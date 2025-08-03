// pages/api/admin/update-user.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";
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

    const decoded = verifyToken(token) as { id: string };
    await dbConnect();
    
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId, name, email, role, phone, address, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from changing other admin roles
    if (targetUser.role === "admin" && role !== "admin") {
      return res.status(403).json({ error: "Cannot change administrator roles" });
    }

    // Check if email is already taken by another user
    if (email && email !== targetUser.email) {
      const emailExists = await UserController.checkEmailExists(email, userId);
      if (emailExists) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Use controller to update user
    const updatedUser = await UserController.updateUser(userId, {
      name, email, role, phone, address, bio
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
} 