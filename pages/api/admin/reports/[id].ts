// pages/api/admin/reports/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Report from "@/models/Report";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // First verify the token
    const decoded = await verifyTokenAndCheckBlocked(token);
    
    // Check if user is admin by querying the database
    const user = await User.findById(decoded.id).select('role');
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.query;
    const { status, reviewedBy } = req.body;

    if (!status || !reviewedBy) {
      return res.status(400).json({ error: "Status and reviewedBy are required" });
    }

    // Update report status
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("postId", "title images")
     .populate("reportedBy", "name email");

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      data: updatedReport,
      message: `Report marked as ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
