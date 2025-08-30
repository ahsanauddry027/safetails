import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../utils/db";
import CommentController from "../../../controllers/CommentController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Comments API called - method:", req.method); // Debug log

    // Ensure database connection
    await dbConnect();
    console.log("Database connection successful in comments endpoint"); // Debug log

    switch (req.method) {
      case "GET":
        console.log("Calling getApprovedComments..."); // Debug log
        return await CommentController.getApprovedComments(req, res);
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Error in comments API handler:", error); // Enhanced error logging

    // Return detailed error information
    res.status(500).json({
      success: false,
      message: "Internal server error in comments API",
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
}
