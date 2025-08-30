import { NextApiRequest, NextApiResponse } from "next";

import jwt from "jsonwebtoken";
import FosterRequest from "../models/FosterRequest";
import dbConnect from "../utils/db";

export default class FosterController {
  static async getFosterRequests(req: NextApiRequest, res: NextApiResponse) {
    try {
      await dbConnect();

      const {
        page = 1,
        limit = 10,
        status,
        petType,
        search,
        fosterType,
        city,
        state,
        isUrgent,
      } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};

      if (status) {
        filter.status = status;
      }

      if (fosterType) {
        filter.fosterType = fosterType;
      }

      if (petType) {
        filter.petType = petType;
      }

      if (city) {
        filter["location.city"] = { $regex: city, $options: "i" };
      }

      if (state) {
        filter["location.state"] = { $regex: state, $options: "i" };
      }

      if (isUrgent === "true") {
        filter.isUrgent = true;
      }

      if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [
          { petName: searchRegex },
          { description: searchRegex },
          { petBreed: searchRegex },
        ];
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
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error in getFosterRequests:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async createFosterRequest(req: NextApiRequest, res: NextApiResponse) {
    try {
      await dbConnect();

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

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const {
        petName,
        petType,
        petBreed,
        petAge,
        petGender,
        petColor,
        petCategory,
        description,
        images,
        location,
        fosterType,
        duration,
        startDate,
        endDate,
        requirements,
        specialNeeds,
        medicalHistory,
        isUrgent,
        goodWith,
      } = body;

      if (
        !petName ||
        !petType ||
        !description ||
        !fosterType ||
        !duration ||
        !startDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: petName, petType, description, fosterType, duration, and startDate are required",
        });
      }

      if (location?.coordinates) {
        const [lng, lat] = location.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: "Invalid coordinates",
          });
        }
      }

      const fosterRequest = new FosterRequest({
        userId: decoded.id,
        petName,
        petType,
        petBreed,
        petAge,
        petGender,
        petColor,
        petCategory,
        description,
        images: images || [],
        location,
        fosterType,
        duration,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        requirements: requirements || [],
        specialNeeds,
        medicalHistory,
        isUrgent: isUrgent || false,
        goodWith: goodWith || {
          dogs: false,
          cats: false,
          children: false,
          seniors: false,
        },
        status: "pending",
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
    } catch (error: unknown) {
      console.error("Error in createFosterRequest:", error);

      if (error && typeof error === "object" && "name" in error) {
        const errorObj = error as {
          name: string;
          errors?: Record<string, unknown>;
          code?: number;
        };

        if (errorObj.name === "ValidationError") {
          const validationErrors = Object.values(errorObj.errors || {}).map(
            (err: unknown) => {
              if (err && typeof err === "object" && "message" in err) {
                return (err as { message: string }).message;
              }
              return "Validation error";
            }
          );
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validationErrors,
          });
        }

        if (errorObj.name === "MongoError" && errorObj.code === 11000) {
          return res.status(409).json({
            success: false,
            message: "Duplicate foster request",
          });
        }
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
