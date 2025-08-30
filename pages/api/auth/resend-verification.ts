// pages/api/auth/resend-verification.ts
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

    // Generate new OTP and update user
    const result = await UserController.resendVerificationEmailService(email);

    // Send new OTP email
    await EmailService.sendOTPEmail(email, result.otp, result.user.name);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to resend verification";
    console.error("Resend verification error:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to resend verification email" });
  }
}
