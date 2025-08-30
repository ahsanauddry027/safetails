// pages/api/auth/verify-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { EmailService } from "@/utils/emailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    await dbConnect();

    // Verify email with OTP
    const result = await UserController.verifyEmailWithOTPService(email, otp);

    // Send welcome email after successful verification
    try {
      await EmailService.sendWelcomeEmail(email, result.user.name);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the verification if welcome email fails
    }

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Email verification failed";
    console.error("Email verification error:", error);
    res
      .status(400)
      .json({ error: error.message || "Email verification failed" });
  }
}
