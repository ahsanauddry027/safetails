import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Comment from "@/models/Comment";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Testing comments API...");

    // Test database connection
    await dbConnect();
    console.log("Database connection successful");

    // Test comment model
    console.log("Testing Comment model...");

    // Count existing comments
    const commentCount = await Comment.countDocuments();
    console.log(`Found ${commentCount} existing comments`);

    // Test finding approved comments
    const approvedComments = await Comment.find({ isApproved: true })
      .populate("user", "name email role")
      .limit(3);

    console.log(`Found ${approvedComments.length} approved comments`);

    return res.status(200).json({
      success: true,
      message: "Comments API test successful",
      data: {
        totalComments: commentCount,
        approvedComments: approvedComments.length,
        sampleComments: approvedComments.map((c) => ({
          id: c._id,
          content: c.content.substring(0, 50) + "...",
          rating: c.rating,
          userType: c.userType,
          isApproved: c.isApproved,
        })),
      },
    });
  } catch (error) {
    console.error("Comments API test failed:", error);

    return res.status(500).json({
      success: false,
      message: "Comments API test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
