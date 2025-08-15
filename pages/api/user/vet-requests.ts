// pages/api/user/vet-requests.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { VetRequestController } from "@/controllers/VetRequestController";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  // Verify authentication
  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token) as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // For GET requests, fetch user's vet requests
    if (req.method === "GET") {
      const requests = await VetRequestController.getUserRequests(user._id);
      return res.status(200).json({ requests });
    }
    
    // For POST requests, create a new request
    else if (req.method === "POST") {
      const requestData = {
        ...req.body,
        userId: user._id
      };
      
      const newRequest = await VetRequestController.createRequest(requestData);
      return res.status(201).json({ request: newRequest });
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: unknown) {
    console.error("API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return res.status(500).json({ error: errorMessage });
  }
}