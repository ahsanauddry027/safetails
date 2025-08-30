// pages/api/test-db.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Alert from "@/models/Alert";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Testing database connection...");

    // Test database connection
    await dbConnect();
    console.log("Database connection successful");

    // Test alert creation with sample data
    const testAlert = new Alert({
      type: "test",
      title: "Test Alert",
      description: "This is a test alert to verify database functionality",
      location: {
        type: "Point",
        coordinates: [0, 0], // [longitude, latitude]
        address: "Test Address",
        city: "Test City",
        state: "Test State",
        radius: 10,
      },
      urgency: "low",
      targetAudience: "all",
      createdBy: "000000000000000000000000", // Dummy ObjectId
      status: "active",
      isActive: true,
      notificationSent: false,
    });

    console.log("Test alert object created:", testAlert);

    // Try to save (this will fail due to validation, but we can see the error)
    try {
      await testAlert.save();
      console.log("Test alert saved successfully");

      // Clean up test alert
      await Alert.findByIdAndDelete(testAlert._id);
      console.log("Test alert cleaned up");

      return res.status(200).json({
        success: true,
        message: "Database test successful - alert creation working",
        connection: "connected",
        alertCreation: "working",
      });
    } catch (saveError) {
      console.log(
        "Test alert save failed (expected due to validation):",
        saveError
      );

      // Check if it's a validation error (which is expected)
      if (
        saveError instanceof Error &&
        saveError.message.includes("validation failed")
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Database test successful - connection working, validation working",
          connection: "connected",
          alertCreation: "validation_working",
          validationError: saveError.message,
        });
      }

      throw saveError;
    }
  } catch (error) {
    console.error("Database test failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      connection: "failed",
    });
  }
}
