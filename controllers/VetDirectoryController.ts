// controllers/VetDirectoryController.ts
import VetDirectory from "@/models/VetDirectory";
import { NextApiRequest } from "next";

export class VetDirectoryController {
  // Create a new vet directory entry
  static async createVetEntry(vetData: any) {
    try {
      const vetEntry = new VetDirectory(vetData);
      await vetEntry.save();
      return vetEntry;
    } catch (error) {
      throw new Error(`Failed to create vet directory entry: ${error}`);
    }
  }

  // Get all vet directory entries
  static async getAllVets(filters: any = {}) {
    try {
      const query: any = { isActive: true };
      
      // Apply filters
      if (filters.specialization) {
        query.specialization = { $in: filters.specialization };
      }
      if (filters.isEmergencyAvailable !== undefined) {
        query.isEmergencyAvailable = filters.isEmergencyAvailable;
      }
      if (filters.is24Hours !== undefined) {
        query.is24Hours = filters.is24Hours;
      }
      if (filters.city) {
        query["location.city"] = { $regex: filters.city, $options: "i" };
      }
      if (filters.state) {
        query["location.state"] = { $regex: filters.state, $options: "i" };
      }

      const vets = await VetDirectory.find(query)
        .populate("vetId", "name email phone")
        .sort({ rating: -1, isEmergencyAvailable: -1 })
        .lean();

      return vets;
    } catch (error) {
      throw new Error(`Failed to fetch vet directory: ${error}`);
    }
  }

  // Get vet by ID
  static async getVetById(vetId: string) {
    try {
      const vet = await VetDirectory.findById(vetId)
        .populate("vetId", "name email phone")
        .lean();
      return vet;
    } catch (error) {
      throw new Error(`Failed to fetch vet: ${error}`);
    }
  }

  // Find nearby vets based on coordinates
  static async findNearbyVets(
    longitude: number,
    latitude: number,
    maxDistance: number = 50000, // Default 50km
    filters: any = {}
  ) {
    try {
      const query: any = {
        isActive: true,
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      };

      // Apply additional filters
      if (filters.specialization) {
        query.specialization = { $in: filters.specialization };
      }
      if (filters.isEmergencyAvailable !== undefined) {
        query.isEmergencyAvailable = filters.isEmergencyAvailable;
      }
      if (filters.is24Hours !== undefined) {
        query.is24Hours = filters.is24Hours;
      }

      const vets = await VetDirectory.find(query)
        .populate("vetId", "name email phone")
        .sort({ rating: -1, isEmergencyAvailable: -1 })
        .lean();

      return vets;
    } catch (error) {
      throw new Error(`Failed to find nearby vets: ${error}`);
    }
  }

  // Search vets by text
  static async searchVets(searchTerm: string, filters: any = {}) {
    try {
      const query: any = {
        isActive: true,
        $text: { $search: searchTerm },
      };

      // Apply filters
      if (filters.specialization) {
        query.specialization = { $in: filters.specialization };
      }
      if (filters.isEmergencyAvailable !== undefined) {
        query.isEmergencyAvailable = filters.isEmergencyAvailable;
      }
      if (filters.is24Hours !== undefined) {
        query.is24Hours = filters.is24Hours;
      }

      const vets = await VetDirectory.find(query)
        .populate("vetId", "name email phone")
        .sort({ score: { $meta: "textScore" }, rating: -1 })
        .lean();

      return vets;
    } catch (error) {
      throw new Error(`Failed to search vets: ${error}`);
    }
  }

  // Update vet directory entry
  static async updateVetEntry(vetId: string, updateData: any) {
    try {
      const vet = await VetDirectory.findByIdAndUpdate(
        vetId,
        updateData,
        { new: true, runValidators: true }
      ).populate("vetId", "name email phone");
      
      return vet;
    } catch (error) {
      throw new Error(`Failed to update vet directory entry: ${error}`);
    }
  }

  // Delete vet directory entry
  static async deleteVetEntry(vetId: string) {
    try {
      await VetDirectory.findByIdAndDelete(vetId);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete vet directory entry: ${error}`);
    }
  }

  // Get emergency vets only
  static async getEmergencyVets(location?: { longitude: number; latitude: number }) {
    try {
      let query: any = {
        isActive: true,
        isEmergencyAvailable: true,
      };

      let vets;
      if (location) {
        // Find emergency vets near the location
        vets = await this.findNearbyVets(
          location.longitude,
          location.latitude,
          100000, // 100km radius for emergency
          { isEmergencyAvailable: true }
        );
      } else {
        // Get all emergency vets
        vets = await VetDirectory.find(query)
          .populate("vetId", "name email phone")
          .sort({ rating: -1, is24Hours: -1 })
          .lean();
      }

      return vets;
    } catch (error) {
      throw new Error(`Failed to fetch emergency vets: ${error}`);
    }
  }

  // Get vet statistics
  static async getVetStats() {
    try {
      const stats = await VetDirectory.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalVets: { $sum: 1 },
            emergencyVets: { $sum: { $cond: ["$isEmergencyAvailable", 1, 0] } },
            twentyFourHourVets: { $sum: { $cond: ["$is24Hours", 1, 0] } },
            verifiedVets: { $sum: { $cond: ["$isVerified", 1, 0] } },
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      return stats[0] || {
        totalVets: 0,
        emergencyVets: 0,
        twentyFourHourVets: 0,
        verifiedVets: 0,
        avgRating: 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch vet statistics: ${error}`);
    }
  }
}
