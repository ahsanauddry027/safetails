// pages/api/user/posts.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { PetPostController } from "@/controllers/PetPostController";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  await dbConnect();

  // Check if user is authenticated
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  
  try {
    // Verify token and get user ID
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    
    const userId = decoded.userId;
    
    switch (method) {
      case "GET":
        try {
          // Extract query parameters
          const { status, limit = "20", page = "1" } = req.query;
          const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
          
          // Get user's posts with optional filtering
          const result = await PetPostController.getPosts(
            { userId, status },
            parseInt(limit as string),
            skip
          );
          
          res.status(200).json(result);
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
        break;
  
      default:
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}