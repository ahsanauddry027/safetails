// pages/api/auth/forgot-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { EmailService } from "@/utils/emailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    await dbConnect();

    // Generate password reset token
    const result =
      await UserController.generatePasswordResetTokenService(email);

    // Send password reset email
    await EmailService.sendPasswordResetEmail(
      email,
      result.user.name,
      result.resetToken
    );

    res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully. Please check your inbox.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Password reset request failed";
    console.error("Forgot password error:", error);

    // For security, always return success message even if user doesn't exist
    if (error.message === "User not found") {
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } else {
      res
        .status(500)
        .json({ error: "Failed to process password reset request" });
    }
  }
}
