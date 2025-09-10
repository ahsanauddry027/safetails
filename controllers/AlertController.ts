import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Alert from "@/models/Alert";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

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
        console.log("User location:", { lat, lng, radiusNum });

        // First, check if there are any alerts at all
        const totalAlertsCount = await Alert.countDocuments(filter);
        console.log(
          `Total alerts in database (with basic filter): ${totalAlertsCount}`
        );

        // If no alerts exist, create some sample alerts for testing in the user's area
        if (totalAlertsCount === 0) {
          console.log(
            "No alerts found, creating sample alerts in user's area..."
          );

          const sampleAlerts = [
            {
              type: "lost_pet",
              title: "Lost Cat - Mimi",
              description:
                "Small black and white cat, very friendly. Last seen near the market area.",
              urgency: "high",
              status: "active",
              location: {
                type: "Point",
                coordinates: [lng + 0.01, lat + 0.01], // Slightly offset from user location
                address: "Near Market Area",
                city: "Dhaka",
                state: "Dhaka",
                radius: 5,
              },
              targetAudience: "nearby",
              isActive: true,
              notificationSent: false,
              createdBy: new mongoose.Types.ObjectId(), // Temporary ObjectId
            },
            {
              type: "emergency",
              title: "Injured Dog Needs Help",
              description:
                "Found an injured street dog that needs immediate veterinary care.",
              urgency: "critical",
              status: "active",
              location: {
                type: "Point",
                coordinates: [lng - 0.01, lat - 0.01], // Slightly offset from user location
                address: "Residential Area",
                city: "Dhaka",
                state: "Dhaka",
                radius: 8,
              },
              targetAudience: "nearby",
              isActive: true,
              notificationSent: false,
              createdBy: new mongoose.Types.ObjectId(), // Temporary ObjectId
            },
            {
              type: "foster_request",
              title: "Foster Home Needed for Puppies",
              description:
                "Three puppies need temporary foster care for 2 weeks.",
              urgency: "medium",
              status: "active",
              location: {
                type: "Point",
                coordinates: [lng + 0.005, lat - 0.005], // Slightly offset from user location
                address: "Community Center Area",
                city: "Dhaka",
                state: "Dhaka",
                radius: 12,
              },
              targetAudience: "nearby",
              isActive: true,
              notificationSent: false,
              createdBy: new mongoose.Types.ObjectId(), // Temporary ObjectId
            },
          ];

          await Alert.insertMany(sampleAlerts);
          console.log("Created 3 sample alerts for testing");
        }

        // IMPROVED GEOSPATIAL FILTERING - Show alerts based on actual distance from user AND alert radius
        console.log(
          `Searching for alerts within ${radiusNum}km of user location`
        );
        const searchRadius = Math.max(radiusNum, 50);
        const geospatialFilter = {
          ...filter,
          "location.coordinates": {
            $geoWithin: {
              $centerSphere: [[lng, lat], searchRadius / 6371],
            },
          },
        };

        console.log(
          "Geospatial filter:",
          JSON.stringify(geospatialFilter, null, 2)
        );

        // Get all alerts within the expanded search radius
        const allAlertsInRange = await Alert.find(geospatialFilter)
          .populate("createdBy", "name email")
          .sort({ urgency: -1, createdAt: -1 });

        console.log(
          `Found ${allAlertsInRange.length} alerts within ${searchRadius}km radius`
        );

        const filteredAlerts = allAlertsInRange.filter((alert) => {
          const alertLng = alert.location.coordinates[0];
          const alertLat = alert.location.coordinates[1];
          const alertRadius = alert.location.radius || 10; // Default to 10km if not specified

          const R = 6371;
          const dLat = ((alertLat - lat) * Math.PI) / 180;
          const dLng = ((alertLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((alertLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const actualDistance = R * c;

          const withinDistance = actualDistance <= radiusNum;
          const radiusCompatible = alertRadius <= radiusNum;
          const shouldShow = withinDistance && radiusCompatible;

          console.log(
            `Alert "${alert.title}": distance=${actualDistance.toFixed(2)}km, alertRadius=${alertRadius}km, userRadius=${radiusNum}km, withinDistance=${withinDistance}, radiusCompatible=${radiusCompatible}, shouldShow=${shouldShow}`
          );

          return shouldShow;
        });

        console.log(
          `Filtered to ${filteredAlerts.length} alerts that are both within ${radiusNum}km AND have radius <= ${radiusNum}km`
        );

        // Apply pagination
        total = filteredAlerts.length;
        alerts = filteredAlerts.slice(skip, skip + limitNum);

        console.log(
          `Returning ${alerts.length} alerts (page ${pageNum}, limit ${limitNum})`
        );
      } catch (geoError: unknown) {
        console.error("Geospatial query error:", geoError);

        console.log("Falling back to non-geospatial query");
        total = await Alert.countDocuments(filter);

        alerts = await Alert.find(filter)
          .populate("createdBy", "name email")
          .sort({ urgency: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum);

        console.log(`Fallback query found ${alerts.length} alerts`);
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
    console.log("Creating alert - Request body:", req.body); // Debug log

    // Verify authentication
    const token = req.cookies?.token;
    if (!token) {
      console.log("No token found in cookies"); // Debug log
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = (await verifyToken(token)) as { id: string };
    if (!decoded) {
      console.log("Token verification failed"); // Debug log
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("User authenticated:", decoded.id); // Debug log

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
      console.log("Missing required fields:", {
        type,
        title,
        description,
        location: !!location,
      }); // Debug log
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate location structure
    if (
      !location.coordinates ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      console.log("Invalid location coordinates:", location.coordinates); // Debug log
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    if (!location.address || !location.city || !location.state) {
      console.log("Missing location details:", {
        address: !!location.address,
        city: !!location.city,
        state: !!location.state,
      }); // Debug log
      return res.status(400).json({ message: "Missing location details" });
    }

    // Ensure location has the required 'type' field for GeoJSON
    if (!location.type || location.type !== "Point") {
      console.log("Invalid location type:", location.type); // Debug log
      return res.status(400).json({ message: "Location type must be 'Point'" });
    }

    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      console.log("Coordinates out of range:", { lng, lat });
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    console.log("Creating alert with validated data:", {
      type,
      title,
      description: description.substring(0, 100) + "...",
      location: {
        type: location.type,
        coordinates: location.coordinates,
        address: location.address,
        city: location.city,
        state: location.state,
        radius: location.radius || 10,
      },
      urgency: urgency || "medium",
      targetAudience: targetAudience || "nearby",
      createdBy: decoded.id,
    });

    const alert = new Alert({
      type,
      title: title.trim(),
      description: description.trim(),
      location: {
        type: location.type,
        coordinates: location.coordinates,
        address: location.address.trim(),
        city: location.city.trim(),
        state: location.state.trim(),
        zipCode: location.zipCode?.trim() || undefined,
        radius: location.radius || 10,
      },
      petDetails: petDetails
        ? {
            petType: petDetails.petType?.trim(),
            petBreed: petDetails.petBreed?.trim(),
            petColor: petDetails.petColor?.trim(),
            petAge: petDetails.petAge?.trim(),
            petGender: petDetails.petGender?.trim(),
          }
        : undefined,
      urgency: urgency || "medium",
      targetAudience: targetAudience || "nearby",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: decoded.id,
      status: "active",
      isActive: true,
      notificationSent: false,
    });

    console.log("Alert object created, attempting to save..."); // Debug log

    // Save the alert
    const savedAlert = await alert.save();

    console.log("Alert saved successfully with ID:", savedAlert._id); // Debug log

    return res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: savedAlert,
    });
  } catch (error) {
    console.error("Error in createAlert:", error); // Enhanced error logging

    // Check for specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes("validation failed")) {
        console.error("Validation error details:", error.message);
        return res.status(400).json({
          success: false,
          message: "Validation failed: " + error.message,
        });
      }

      if (error.message.includes("duplicate key")) {
        return res.status(400).json({
          success: false,
          message: "Alert with this information already exists",
        });
      }
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create alert: " +
        (error instanceof Error ? error.message : "Unknown error"),
    });
  }
}

// Update an alert
async function updateAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = (await verifyToken(token)) as { id: string };
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

async function deleteAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = (await verifyToken(token)) as { id: string };
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
