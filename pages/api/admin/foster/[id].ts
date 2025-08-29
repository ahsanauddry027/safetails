// pages/api/admin/foster/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import FosterRequest from "@/models/FosterRequest";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
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

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Foster post ID is required" });
    }

    // Check if foster post exists
    const fosterPost = await FosterRequest.findById(id);
    if (!fosterPost) {
      return res
        .status(404)
        .json({ error: "Foster post not found or already deleted" });
    }

    // Delete the foster post
    await FosterRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Foster post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting foster post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
