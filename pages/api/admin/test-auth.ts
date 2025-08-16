// pages/api/admin/test-auth.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Test auth API called");
    
    // Verify admin authentication
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
    
    if (!decoded || decoded.role !== "admin") {
      console.log("❌ User is not admin:", { role: decoded?.role });
      return res.status(403).json({ 
        error: "Admin access required",
        userRole: decoded?.role,
        userId: decoded?.id
      });
    }

    console.log("✅ Admin authentication successful!");

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      user: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      }
    });
  } catch (error) {
    console.error("❌ Error in test auth API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
