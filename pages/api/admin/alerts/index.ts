// pages/api/admin/alerts/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Alert from "@/models/Alert";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // First verify the token
    const decoded = await verifyTokenAndCheckBlocked(token);

    // Check if user is admin by querying the database
    const user = await User.findById(decoded.id).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get all alerts (including inactive ones) for admin management
    const alerts = await Alert.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Transform the data to match the frontend expectations
    const transformedAlerts = alerts.map((alert) => ({
      _id: alert._id,
      title: alert.title,
      description: alert.description,
      alertType: alert.type || "info",
      status: alert.status || "active",
      priority: alert.urgency || "medium",
      createdAt: alert.createdAt,
      userId: alert.createdBy
        ? {
            _id: alert.createdBy._id,
            name: alert.createdBy.name,
            email: alert.createdBy.email,
          }
        : {
            _id: "",
            name: "Unknown User",
            email: "unknown@example.com",
          },
    }));

    return res.status(200).json({
      success: true,
      data: transformedAlerts,
      total: transformedAlerts.length,
    });
  } catch (error) {
    console.error("Error fetching alerts for admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
