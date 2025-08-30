// pages/api/admin/block-user.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import User from "@/models/User";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = await verifyTokenAndCheckBlocked(token);
    await dbConnect();

    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId, isBlocked, blockReason } = req.body;

    console.log("Block user API called with:", {
      userId,
      isBlocked,
      blockReason,
      adminId: decoded.id,
    });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists and is not the admin
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.role === "admin") {
      return res
        .status(403)
        .json({ error: "Cannot block other administrators" });
    }

    // Use controller service method to block/unblock user
    const updatedUser = await UserController.toggleUserBlockService(
      userId,
      isBlocked,
      blockReason,
      decoded.id
    );

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Block user error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user status";
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : "Unknown error",
    });
  }
}
