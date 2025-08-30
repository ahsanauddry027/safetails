// controllers/VetRequestController.ts
import VetRequest from "@/models/VetRequest";
import User from "@/models/User";
import mongoose from "mongoose";
import { Request, Response } from "express"; // Added Request and Response imports
import jwt from "jsonwebtoken"; // Added jwt import

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
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getVetRequests(req: Request, res: Response) {
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

  static async getUserRequests(req: Request, res: Response) {
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

  static async updateVetRequest(req: Request, res: Response) {
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

      const { id } = req.params;
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

  static async assignVet(req: Request, res: Response) {
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

      const { id } = req.params;
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

  static async getVetStats(req: Request, res: Response) {
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
}
