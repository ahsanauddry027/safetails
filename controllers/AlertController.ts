import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Alert from "@/models/Alert";
import { verifyToken } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return await getAlerts(req, res);
      case "POST":
        return await createAlert(req, res);
      case "PUT":
        return await updateAlert(req, res);
      case "DELETE":
        return await deleteAlert(req, res);
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res
          .status(405)
          .json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Get alerts with geolocation filtering
async function getAlerts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      latitude,
      longitude,
      radius = "10",
      type,
      urgency,
      status = "active",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(Array.isArray(page) ? page[0] : page);
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit);
    const radiusNum = parseInt(Array.isArray(radius) ? radius[0] : radius);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: {
      status: string;
      isActive: boolean;
      type?: string;
      urgency?: string;
    } = {
      status: Array.isArray(status) ? status[0] : status,
      isActive: true,
    };

    if (type) filter.type = Array.isArray(type) ? type[0] : type;
    if (urgency) filter.urgency = Array.isArray(urgency) ? urgency[0] : urgency;

    let alerts;
    let total;

    // Add geolocation filter if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(Array.isArray(latitude) ? latitude[0] : latitude);
      const lng = parseFloat(
        Array.isArray(longitude) ? longitude[0] : longitude
      );

      try {
        // First, get all alerts within the user's search radius
        const userSearchFilter = {
          ...filter,
          "location.coordinates": {
            $geoWithin: {
              $centerSphere: [
                [lng, lat],
                radiusNum / 6371, // Convert km to radians (Earth radius = 6371 km)
              ],
            },
          },
        };

        // Get all alerts within user's search radius
        const allAlertsInRange = await Alert.find(userSearchFilter)
          .populate("createdBy", "name email")
          .sort({ urgency: -1, createdAt: -1 });

        // Filter alerts based on their individual radius
        // Only show alerts where the alert's radius is greater than or equal to the user's search radius
        const filteredAlerts = allAlertsInRange.filter((alert) => {
          const alertRadius = alert.location.radius || 10; // Default to 10km if not specified

          // Calculate the distance between user location and alert location
          const alertLng = alert.location.coordinates[0];
          const alertLat = alert.location.coordinates[1];

          // Haversine formula to calculate distance
          const R = 6371; // Earth's radius in km
          const dLat = ((alertLat - lat) * Math.PI) / 180;
          const dLng = ((alertLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((alertLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          // Alert should be shown if:
          // 1. User is within the alert's radius, AND
          // 2. Alert's radius is less than or equal to the user's search radius
          const shouldShow =
            distance <= alertRadius && alertRadius <= radiusNum;

          return shouldShow;
        });

        // Apply pagination to filtered results
        total = filteredAlerts.length;
        alerts = filteredAlerts.slice(skip, skip + limitNum);
      } catch (geoError: unknown) {
        // Fallback to regular query without geospatial filtering
        total = await Alert.countDocuments(filter);

        alerts = await Alert.find(filter)
          .populate("createdBy", "name email")
          .sort({ urgency: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
      }
    } else {
      // No geolocation filter, use regular find
      total = await Alert.countDocuments(filter);

      alerts = await Alert.find(filter)
        .populate("createdBy", "name email")
        .sort({ urgency: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
    });
  }
}

// Create a new alert
async function createAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const {
      type,
      title,
      description,
      location,
      petDetails,
      urgency,
      targetAudience,
      expiresAt,
    } = req.body;

    // Validate required fields
    if (!type || !title || !description || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new alert
    const alert = new Alert({
      type,
      title,
      description,
      location,
      petDetails,
      urgency: urgency || "medium",
      targetAudience: targetAudience || "nearby",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: decoded.id,
    });

    await alert.save();

    return res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create alert",
    });
  }
}

// Update an alert
async function updateAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { id } = req.query;
    const updateData = req.body;

    // Find alert and check ownership
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    if (alert.createdBy.toString() !== decoded.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this alert" });
    }

    // Update alert
    const updatedAlert = await Alert.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Alert updated successfully",
      data: updatedAlert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update alert",
    });
  }
}

// Delete an alert
async function deleteAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { id } = req.query;

    // Find alert and check ownership
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    if (alert.createdBy.toString() !== decoded.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this alert" });
    }

    // Soft delete by setting status to expired
    await Alert.findByIdAndUpdate(id, {
      status: "expired",
      isActive: false,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
}
