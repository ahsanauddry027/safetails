import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import PetPost from "../../../../models/PetPost";

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
    const token = req.headers.authorization?.replace(/^Bearer\s/, "") || "";
    const user = await verifyToken(token);
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Connect to database
    await dbConnect();

    // Get post statistics
    const total = await PetPost.countDocuments();
    const missing = await PetPost.countDocuments({ postType: "missing" });
    const emergency = await PetPost.countDocuments({ postType: "emergency" });
    const wounded = await PetPost.countDocuments({ postType: "wounded" });
    const active = await PetPost.countDocuments({ status: "active" });
    const resolved = await PetPost.countDocuments({ status: "resolved" });

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
    return res.status(500).json({ message: "Internal server error" });
  }
}
