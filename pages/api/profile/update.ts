// pages/api/profile/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") return res.status(405).end("Method not allowed");

  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = await verifyTokenAndCheckBlocked(token);
    await dbConnect();

    const { name, phone, address, bio, profileImage } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        bio: bio || undefined,
        profileImage: profileImage || undefined,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
} 