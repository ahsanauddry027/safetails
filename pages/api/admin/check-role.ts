// pages/api/admin/check-role.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";
import dbConnect from "@/utils/db";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Check role API called");
    await dbConnect();
    
    // Verify authentication
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    console.log("🔍 Token found:", !!token);
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = await verifyToken(token);
    console.log("🔍 Token decoded:", { 
      success: !!decoded, 
      role: decoded?.role,
      userId: decoded?.id,
      email: decoded?.email
    });
    
    if (!decoded) {
      console.log("❌ Token verification failed");
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user from database to check actual role
    const user = await User.findById(decoded.id).select('name email role isActive isBlocked');
    console.log("🔍 User from database:", { 
      found: !!user,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      isActive: user?.isActive,
      isBlocked: user?.isBlocked
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isBlocked: user.isBlocked
      },
      tokenInfo: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      }
    });
  } catch (error) {
    console.error("❌ Error in check role API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
