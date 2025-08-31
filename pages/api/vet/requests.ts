// pages/api/vet/requests.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { VetRequestController } from "@/controllers/VetRequestController";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
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

    const decoded = await verifyTokenAndCheckBlocked(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // For GET requests, fetch vet requests
    if (req.method === "GET") {
      // Only vets can get their requests
      console.log(user, "User details");
      if (user.role !== "vet") {
        return res.status(403).json({ error: "Access denied" });
      }

      try {
        const stats = await VetRequestController.getVetRequestStats(user._id);
        const requests = await VetRequestController.getVetDashboardRequests(user._id);

        return res.status(200).json({ stats, requests });
      } catch (error) {
        console.error("Error fetching vet data:", error);
        return res.status(500).json({ error: "Failed to fetch vet data" });
      }
    }

    // For POST requests, create a new request
    else if (req.method === "POST") {
      // Any authenticated user can create a request
      const requestData = {
        ...req.body,
        userId: user._id,
      };

      const newRequest = await VetRequestController.createRequest(requestData);
      return res.status(201).json({ request: newRequest });
    }

    // Method not allowed
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    const errMsg =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: errMsg });
  }
}
