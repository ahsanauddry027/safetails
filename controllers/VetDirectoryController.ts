// controllers/VetDirectoryController.ts
import VetDirectory from "@/models/VetDirectory";
import { FilterQuery, UpdateQuery } from "mongoose";

type OperatingHoursDay = { open?: string; close?: string };
type OperatingHours = {
  monday?: OperatingHoursDay;
  tuesday?: OperatingHoursDay;
  wednesday?: OperatingHoursDay;
  thursday?: OperatingHoursDay;
  friday?: OperatingHoursDay;
  saturday?: OperatingHoursDay;
  sunday?: OperatingHoursDay;
};

type Location = {
  type?: string;
  coordinates: [number, number];
  address: string;
  city: string;
  state: string;
  zipCode?: string;
};

type ContactInfo = {
  phone: string;
  email?: string;
  website?: string;
  emergencyPhone?: string;
};

export type VetDirectoryCreate = {
  vetId: string;
  clinicName: string;
  specialization?: string[];
  services?: string[];
  location: Location;
  contactInfo: ContactInfo;
  operatingHours?: OperatingHours;
  isEmergencyAvailable?: boolean;
  is24Hours?: boolean;
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  isActive?: boolean;
};

export type VetDirectoryUpdate = Partial<VetDirectoryCreate>;

export type VetDirectoryFilters = {
  specialization?: string[];
  isEmergencyAvailable?: boolean;
  is24Hours?: boolean;
  city?: string;
  state?: string;
};

type VetDirectoryDoc = {
  isActive: boolean;
  specialization?: string[];
  isEmergencyAvailable?: boolean;
  is24Hours?: boolean;
  rating?: number;
  location?: { city?: string; state?: string; coordinates?: [number, number] };
};

export class VetDirectoryController {
  // Create a new vet directory entry
  static async createVetEntry(vetData: VetDirectoryCreate) {
    try {
      const vetEntry = new VetDirectory(vetData);
      await vetEntry.save();
      return vetEntry;
    } catch (error) {
      throw new Error(`Failed to create vet directory entry: ${error}`);
    }
  }

  // Get all vet directory entries
  static async getAllVets(filters: VetDirectoryFilters = {}) {
    try {
      const query: FilterQuery<VetDirectoryDoc> = { isActive: true };

      // Apply filters
      if (filters.specialization) {
        (query as unknown as Record<string, unknown>).specialization = {
          $in: filters.specialization,
        };
      }
      if (filters.isEmergencyAvailable !== undefined) {
        query.isEmergencyAvailable = filters.isEmergencyAvailable;
      }
      if (filters.is24Hours !== undefined) {
        query.is24Hours = filters.is24Hours;
      }
      if (filters.city) {
        (query as unknown as Record<string, unknown>)["location.city"] = {
          $regex: filters.city,
          $options: "i",
        };
      }
      if (filters.state) {
        (query as unknown as Record<string, unknown>)["location.state"] = {
          $regex: filters.state,
          $options: "i",
        };
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
    filters: VetDirectoryFilters = {}
  ) {
    try {
      const query: FilterQuery<VetDirectoryDoc> = {
        isActive: true,
        ...({
          ["location.coordinates"]: {
            $near: {
              $geometry: { type: "Point", coordinates: [longitude, latitude] },
              $maxDistance: maxDistance,
            },
          },
        } as Record<string, unknown>),
      };

      // Apply additional filters
      if (filters.specialization) {
        (query as unknown as Record<string, unknown>).specialization = {
          $in: filters.specialization,
        };
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
  static async searchVets(
    searchTerm: string,
    filters: VetDirectoryFilters = {}
  ) {
    try {
      const query: FilterQuery<VetDirectoryDoc> = {
        isActive: true,
        $text: { $search: searchTerm },
      } as unknown as FilterQuery<VetDirectoryDoc>;

      // Apply filters
      if (filters.specialization) {
        (query as unknown as Record<string, unknown>).specialization = {
          $in: filters.specialization,
        };
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
  static async updateVetEntry(vetId: string, updateData: VetDirectoryUpdate) {
    try {
      const vet = await VetDirectory.findByIdAndUpdate(
        vetId,
        updateData as UpdateQuery<VetDirectoryUpdate>,
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
  static async getEmergencyVets(location?: {
    longitude: number;
    latitude: number;
  }) {
    try {
      const query: FilterQuery<VetDirectoryDoc> = {
        isActive: true,
        isEmergencyAvailable: true,
      };

      let vets:
        | Awaited<ReturnType<typeof VetDirectory.find>>
        | Awaited<ReturnType<typeof VetDirectoryController.findNearbyVets>>;
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

      return (
        stats[0] || {
          totalVets: 0,
          emergencyVets: 0,
          twentyFourHourVets: 0,
          verifiedVets: 0,
          avgRating: 0,
        }
      );
    } catch (error) {
      throw new Error(`Failed to fetch vet statistics: ${error}`);
    }
  }
}
