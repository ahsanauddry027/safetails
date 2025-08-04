// pages/api/posts/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { PetPostController } from "@/controllers/PetPostController";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        // Extract query parameters
        const { postType, status, limit = "20", page = "1" } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        // Get posts with optional filtering
        const result = await PetPostController.getPosts(
          { postType, status },
          parseInt(limit as string),
          skip
        );
        
        res.status(200).json(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
      }
      break;

    case "POST":
      try {
        // Check if user is authenticated
        const cookies = cookie.parse(req.headers.cookie || "");
        const token = cookies.token;
        
        if (!token) {
          return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        
        // Verify token and get user ID
        const decoded = verifyToken(token) as { id: string };
        if (!decoded || !decoded.id) {
          return res.status(401).json({ success: false, message: "Invalid token" });
        }
        
        // Create post
        const newPost = await PetPostController.createPost(req.body, decoded.id);
        
        res.status(201).json({ success: true, data: newPost });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}