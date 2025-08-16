// TEMPORARY ENDPOINT - REMOVE AFTER USE FOR SECURITY
// pages/api/temp-make-admin.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user role to admin
    user.role = "admin";
    user.isEmailVerified = true;
    await user.save();

    console.log(`✅ User ${email} is now an admin`);

    res.status(200).json({
      success: true,
      message: `User ${email} is now an admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error making user admin:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
}
