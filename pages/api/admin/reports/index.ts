// pages/api/admin/reports/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Report from "@/models/Report";
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
    console.log("🔍 Admin reports API called");
    await dbConnect();

    // Verify admin authentication
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    console.log("🔍 Token found:", !!token);
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Authentication required" });
    }

    // First verify the token
    const decoded = await verifyTokenAndCheckBlocked(token);
    console.log("🔍 Token decoded:", { 
      success: !!decoded, 
      userId: decoded?.id 
    });
    
    // Check if user is admin by querying the database
    const user = await User.findById(decoded.id).select('role isActive isBlocked');
    console.log("🔍 User from database:", { 
      role: user?.role,
      isActive: user?.isActive,
      isBlocked: user?.isBlocked
    });
    
    if (!user || user.role !== "admin") {
      console.log("❌ User is not admin:", { role: user?.role });
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log("✅ Admin authentication successful, fetching reports...");

    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Report.countDocuments({});
    console.log("📊 Total reports found:", total);

    // Get reports with pagination and populate related data
    const reports = await Report.find({})
      .populate("postId", "title images")
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);
    console.log("✅ Reports fetched successfully:", reports.length);

    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error in admin reports API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
