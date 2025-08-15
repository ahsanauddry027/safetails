import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import PetPost from '../../../../models/PetPost';
import User from '../../../../models/User';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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
    
    if (!adminUser || adminUser.role !== 'admin' || !adminUser.isActive) {
      console.error("User not admin or inactive:", { role: adminUser?.role, isActive: adminUser?.isActive });
      return res.status(403).json({ message: "Admin access required" });
    }



    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const postType = req.query.postType as string;
    const status = req.query.status as string;

    // Build query
    const query: Record<string, string> = {};
    if (postType) query.postType = postType;
    if (status) query.status = status;

    // Get posts with pagination
    const posts = await PetPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role');

    // Get total count for pagination
    const total = await PetPost.countDocuments(query);

    // Return posts with pagination info
    return res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}