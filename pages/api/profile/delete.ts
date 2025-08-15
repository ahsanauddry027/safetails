// pages/api/profile/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") return res.status(405).end("Method not allowed");

  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = await verifyTokenAndCheckBlocked(token);
    await dbConnect();

    // Soft delete - set isActive to false
    const deletedUser = await User.findByIdAndUpdate(
      decoded.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clear the authentication cookie
    res.setHeader(
      "Set-Cookie",
      `token=; httpOnly=true; secure=${process.env.NODE_ENV === "production"}; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    );

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Profile deletion error:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  }
} 