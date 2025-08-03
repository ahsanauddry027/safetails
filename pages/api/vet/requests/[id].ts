// pages/api/vet/requests/[id].ts
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

  // Get the request ID from the URL
  const { id } = req.query;
  
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid request ID" });
  }

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

    // For PUT requests, update the request
    if (req.method === "PUT") {
      // Only vets can update requests
      if (user.role !== "vet") {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedRequest = await VetRequestController.updateRequest(id, req.body);
      return res.status(200).json({ request: updatedRequest });
    }
    
    // For PATCH requests, assign a vet to the request
    else if (req.method === "PATCH" && req.body.action === "assign") {
      // Only vets can be assigned to requests
      if (user.role !== "vet") {
        return res.status(403).json({ error: "Only veterinarians can be assigned to requests" });
      }

      const updatedRequest = await VetRequestController.assignVet(id, user._id);
      return res.status(200).json({ request: updatedRequest });
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}