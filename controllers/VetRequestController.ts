// controllers/VetRequestController.ts
import VetRequest from "@/models/VetRequest";
import User from "@/models/User";
import mongoose from "mongoose";

interface VetRequestData {
  userId: string;
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  requestType: string;
  description: string;
  urgencyLevel?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
  };
}

export class VetRequestController {
  // Create a new vet request
  static async createRequest(requestData: VetRequestData) {
    try {
      // Verify that the user exists
      const user = await User.findById(requestData.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Create the request
      const vetRequest = new VetRequest(requestData);
      await vetRequest.save();

      return vetRequest;
    } catch (error) {
      console.error("Create vet request error:", error);
      throw error;
    }
  }

  // Get all requests for a specific vet
  static async getVetRequests(vetId: string) {
    try {
      // Verify that the vet exists and has the vet role
      const vet = await User.findById(vetId);
      if (!vet || vet.role !== "vet") {
        throw new Error("Veterinarian not found");
      }

      // Get all requests assigned to this vet or unassigned (pending)
      const requests = await VetRequest.find({
        $or: [
          { vetId: vetId },
          { vetId: { $exists: false } },
          { vetId: null }
        ]
      }).populate("userId", "name email phone").sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      console.error("Get vet requests error:", error);
      throw error;
    }
  }

  // Get all requests created by a specific user
  static async getUserRequests(userId: string) {
    try {
      const requests = await VetRequest.find({ userId })
        .populate("vetId", "name email phone")
        .sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      console.error("Get user requests error:", error);
      throw error;
    }
  }

  // Update a vet request
  static async updateRequest(requestId: string, updateData: Partial<VetRequestData & { status: string; vetId: string }>) {
    try {
      const updatedRequest = await VetRequest.findByIdAndUpdate(
        requestId,
        updateData,
        { new: true }
      );

      if (!updatedRequest) {
        throw new Error("Request not found");
      }

      return updatedRequest;
    } catch (error) {
      console.error("Update vet request error:", error);
      throw error;
    }
  }

  // Assign a vet to a request
  static async assignVet(requestId: string, vetId: string) {
    try {
      // Verify that the vet exists and has the vet role
      const vet = await User.findById(vetId);
      if (!vet || vet.role !== "vet") {
        throw new Error("Veterinarian not found");
      }

      const updatedRequest = await VetRequest.findByIdAndUpdate(
        requestId,
        { 
          vetId: vetId,
          status: "accepted"
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new Error("Request not found");
      }

      return updatedRequest;
    } catch (error) {
      console.error("Assign vet error:", error);
      throw error;
    }
  }

  // Get request statistics for a vet
  static async getVetStats(vetId: string) {
    try {
      // Verify that the vet exists and has the vet role
      const vet = await User.findById(vetId);
      if (!vet || vet.role !== "vet") {
        throw new Error("Veterinarian not found");
      }

      // Get counts for different request statuses for this vet
      const activeCases = await VetRequest.countDocuments({ vetId, status: "accepted" });
      const completedCases = await VetRequest.countDocuments({ vetId, status: "completed" });
      
      // Get pending requests that are either unassigned or assigned to this vet but still pending
      const pendingConsultations = await VetRequest.countDocuments({ 
        $or: [
          // Unassigned pending requests (available for any vet)
          { 
            $or: [
              { vetId: { $exists: false } },
              { vetId: null }
            ],
            status: "pending"
          },
          // Requests assigned to this vet but still pending
          { vetId, status: "pending" }
        ]
      });

      const totalCases = activeCases + completedCases;

      return {
        totalCases,
        activeCases,
        completedCases,
        pendingConsultations
      };
    } catch (error) {
      console.error("Get vet stats error:", error);
      throw error;
    }
  }
}