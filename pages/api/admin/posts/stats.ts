import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import PetPost from "../../../../models/PetPost";
import User from "../../../../models/User";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    console.log("Cookies received:", req.headers.cookie);
    const { token } = cookie.parse(req.headers.cookie || "");
    console.log("Parsed token:", token ? "Token exists" : "No token");
    
    if (!token) {
      console.error("No token found in cookies");
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log("Token found, verifying...");
    const decoded = verifyToken(token) as { id: string };
    console.log("Token decoded:", { id: decoded?.id });
    
    if (!decoded || !decoded.id) {
      console.error("Invalid token payload");
      return res.status(401).json({ message: "Invalid token" });
    }

    // Connect to database first to check user
    try {
      await dbConnect();
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return res.status(500).json({ message: "Database connection failed" });
    }

    // Verify user exists and is admin
    const adminUser = await User.findById(decoded.id);
    console.log("User found:", { id: adminUser?._id, role: adminUser?.role, isActive: adminUser?.isActive });
    
    if (!adminUser || adminUser.role !== "admin" || !adminUser.isActive) {
      console.error("User not admin or inactive:", { role: adminUser?.role, isActive: adminUser?.isActive });
      return res.status(403).json({ message: "Admin access required" });
    }



    // Get post statistics
    let total, missing, emergency, wounded, active, resolved;
    
    try {
      total = await PetPost.countDocuments();
      missing = await PetPost.countDocuments({ postType: "missing" });
      emergency = await PetPost.countDocuments({ postType: "emergency" });
      wounded = await PetPost.countDocuments({ postType: "wounded" });
      active = await PetPost.countDocuments({ status: "active" });
      resolved = await PetPost.countDocuments({ status: "resolved" });
      
      console.log("Post statistics calculated:", { total, missing, emergency, wounded, active, resolved });
    } catch (queryError) {
      console.error("Database query error:", queryError);
      return res.status(500).json({ message: "Failed to fetch post statistics" });
    }

    // Return statistics
    return res.status(200).json({
      total,
      missing,
      emergency,
      wounded,
      active,
      resolved,
    });
  } catch (error) {
    console.error("Error fetching post statistics:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ message: errorMessage });
  }
}
