import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import FosterRequest from "../models/FosterRequest";

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/safetails"
);

mongoose.connection.on("error", (error) => {
  throw new Error(`Database connection failed: ${error.message}`);
});

export default class FosterController {
  static async getFosterRequests(req: Request, res: Response) {
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

      const total = await FosterRequest.countDocuments(filter);
      const fosterRequests = await FosterRequest.find(filter)
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: fosterRequests,
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

  static async createFosterRequest(req: Request, res: Response) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is empty",
        });
      }

      let body = req.body;
      if (typeof req.body === "string") {
        try {
          body = JSON.parse(req.body);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body",
          });
        }
      }

      const token =
        req.cookies?.token ||
        req.headers.authorization?.replace("Bearer ", "") ||
        (req.headers.cookie && this.parseCookies(req.headers.cookie).token);

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

      const {
        title,
        petName,
        petType,
        breed,
        age,
        gender,
        description,
        images,
        location,
        contactInfo,
        fosterDuration,
        requirements,
        specialNeeds,
      } = body;

      if (
        !title ||
        !petName ||
        !petType ||
        !description ||
        !images ||
        !location
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (location.coordinates) {
        const [lng, lat] = location.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: "Invalid coordinates",
          });
        }
      }

      if (location.address && !location.city && !location.state) {
        return res.status(400).json({
          success: false,
          message: "City and state are required when address is provided",
        });
      }

      const fosterRequest = new FosterRequest({
        userId: decoded.id,
        title,
        petName,
        petType,
        breed,
        age,
        gender,
        description,
        images,
        location,
        contactInfo,
        fosterDuration,
        requirements,
        specialNeeds,
        status: "active",
      });

      await fosterRequest.save();

      const populatedRequest = await FosterRequest.findById(
        fosterRequest._id
      ).populate("userId", "name email");

      res.status(201).json({
        success: true,
        data: populatedRequest,
        message: "Foster request created successfully",
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      if (error.name === "MongoError" && error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Duplicate foster request",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  private static parseCookies(cookieHeader: string) {
    const cookies: { [key: string]: string } = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies;
  }
}
