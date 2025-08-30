// controllers/VetRequestController.ts
import VetRequest from "@/models/VetRequest";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken"; // Added jwt import

interface VetRequestData {
  userId: string;
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  petGender?: string;
  requestType: string;
  description: string;
  urgencyLevel?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: {
    address?: string;
    coordinates?: [number, number];
    description?: string;
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
      throw new Error(`Failed to create vet request: ${error}`);
    }
  }

  static async getVetRequests(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { page = 1, limit = 10, status, petType, location } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (petType) {
        filter.petType = petType;
      }

      if (location) {
        filter["location.city"] = { $regex: location, $options: "i" };
      }

      const total = await VetRequest.countDocuments(filter);
      const vetRequests = await VetRequest.find(filter)
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "name email phone")
        .populate("assignedVet", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: vetRequests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getUserRequests(req: NextApiRequest, res: NextApiResponse) {
    try {
      const token =
        req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const total = await VetRequest.countDocuments({ userId: decoded.id });
      const vetRequests = await VetRequest.find({ userId: decoded.id })
        .skip(skip)
        .limit(limitNum)
        .populate("assignedVet", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: vetRequests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateVetRequest(req: NextApiRequest, res: NextApiResponse) {
    try {
      const token =
        req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const { id } = req.query;
      const updateData = req.body;

      const vetRequest = await VetRequest.findById(id);
      if (!vetRequest) {
        return res.status(404).json({
          success: false,
          message: "Vet request not found",
        });
      }

      if (
        vetRequest.userId.toString() !== decoded.id &&
        decoded.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own requests",
        });
      }

      const updatedRequest = await VetRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate("userId", "name email phone");

      res.json({
        success: true,
        data: updatedRequest,
        message: "Vet request updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async assignVet(req: NextApiRequest, res: NextApiResponse) {
    try {
      const token =
        req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (decoded.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { id } = req.query;
      const { vetId } = req.body;

      if (!vetId) {
        return res.status(400).json({
          success: false,
          message: "Vet ID is required",
        });
      }

      const vetRequest = await VetRequest.findById(id);
      if (!vetRequest) {
        return res.status(404).json({
          success: false,
          message: "Vet request not found",
        });
      }

      const vet = await User.findById(vetId);
      if (!vet || vet.role !== "vet") {
        return res.status(400).json({
          success: false,
          message: "Invalid vet ID",
        });
      }

      vetRequest.assignedVet = vetId;
      vetRequest.status = "assigned";
      vetRequest.assignedAt = new Date();

      await vetRequest.save();

      const updatedRequest = await VetRequest.findById(id)
        .populate("userId", "name email phone")
        .populate("assignedVet", "name email phone");

      res.json({
        success: true,
        data: updatedRequest,
        message: "Vet assigned successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Assign a vet to a request (for vet use - accepts parameters directly)
  static async assignVetToRequest(requestId: string, vetId: string) {
    try {
      const vetRequest = await VetRequest.findById(requestId);
      if (!vetRequest) {
        throw new Error("Vet request not found");
      }

      const vet = await User.findById(vetId);
      if (!vet || vet.role !== "vet") {
        throw new Error("Invalid vet ID");
      }

      vetRequest.assignedVet = vetId;
      vetRequest.status = "assigned";
      vetRequest.assignedAt = new Date();

      await vetRequest.save();

      const updatedRequest = await VetRequest.findById(requestId)
        .populate("userId", "name email phone")
        .populate("assignedVet", "name email phone");

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to assign vet to request: ${error}`);
    }
  }

  // Update a vet request (for vet use - accepts parameters directly)
  static async updateRequest(requestId: string, updateData: any) {
    try {
      const vetRequest = await VetRequest.findByIdAndUpdate(
        requestId,
        updateData,
        { new: true, runValidators: true }
      ).populate("userId", "name email phone")
       .populate("assignedVet", "name email phone");

      if (!vetRequest) {
        throw new Error("Vet request not found");
      }

      return vetRequest;
    } catch (error) {
      throw new Error(`Failed to update vet request: ${error}`);
    }
  }

  static async getVetStats(req: NextApiRequest, res: NextApiResponse) {
    try {
      const token =
        req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (decoded.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const totalRequests = await VetRequest.countDocuments();
      const pendingRequests = await VetRequest.countDocuments({
        status: "pending",
      });
      const assignedRequests = await VetRequest.countDocuments({
        status: "assigned",
      });
      const completedRequests = await VetRequest.countDocuments({
        status: "completed",
      });

      res.json({
        success: true,
        data: {
          total: totalRequests,
          pending: pendingRequests,
          assigned: assignedRequests,
          completed: completedRequests,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get statistics for a specific vet's requests
  static async getVetRequestStats(vetId: string) {
    try {
      const totalRequests = await VetRequest.countDocuments({ assignedVet: vetId });
      const pendingRequests = await VetRequest.countDocuments({
        assignedVet: vetId,
        status: "pending",
      });
      const assignedRequests = await VetRequest.countDocuments({
        assignedVet: vetId,
        status: "assigned",
      });
      const completedRequests = await VetRequest.countDocuments({
        assignedVet: vetId,
        status: "completed",
      });

      return {
        success: true,
        data: {
          total: totalRequests,
          pending: pendingRequests,
          assigned: assignedRequests,
          completed: completedRequests,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch vet request statistics: ${error}`);
    }
  }

  // Get requests assigned to a specific vet
  static async getVetAssignedRequests(vetId: string, page = 1, limit = 10) {
    try {
      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());
      const skip = (pageNum - 1) * limitNum;

      const total = await VetRequest.countDocuments({ assignedVet: vetId });
      const vetRequests = await VetRequest.find({ assignedVet: vetId })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: vetRequests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch vet assigned requests: ${error}`);
    }
  }
}
