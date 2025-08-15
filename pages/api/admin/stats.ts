// pages/api/admin/stats.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = await verifyTokenAndCheckBlocked(token);
    await dbConnect();
    
    // Get complete statistics including current admin
    const stats = await UserController.getUserStatistics();
    
    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
} 