// pages/api/vet/requests/[id].ts
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

  try {
    // Parse cookies safely
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify JWT and fetch user
    const decoded = await verifyTokenAndCheckBlocked(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Only vets can modify requests
    if (user.role !== "vet") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id: requestId } = req.query;

    // Ensure requestId is a string
    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    switch (req.method) {
      case "PATCH":
        const { action } = req.body;

        if (action === "assign") {
          // Assign the vet to this request and change status to accepted
          const updatedRequest = await VetRequestController.assignVetToRequest(
            requestId,
            user._id
          );
          return res.status(200).json({ success: true, data: updatedRequest });
        }

        return res.status(400).json({ error: "Invalid action" });

      case "PUT":
        // Update request status (e.g., mark as completed)
        const updateData = req.body;
        const updatedRequest = await VetRequestController.updateRequest(
          requestId,
          updateData
        );
        return res.status(200).json({ success: true, data: updatedRequest });

      case "DELETE":
        // Delete request (only for completed or cancelled requests)
        await VetRequestController.deleteRequest(requestId);
        return res
          .status(200)
          .json({ success: true, message: "Request deleted successfully" });

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    const errMsg =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: errMsg });
  }
}
