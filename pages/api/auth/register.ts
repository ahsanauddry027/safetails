// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { EmailService } from "@/utils/emailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { name, email, password, role, phone, address, bio } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email, and password are required" });

  try {
    await dbConnect();

    // Check if user already exists
    const emailExists = await UserController.checkEmailExists(email);
    if (emailExists)
      return res.status(400).json({ error: "User already exists" });

    // Generate OTP
    const otp = EmailService.generateOTP();

    // Use controller to create user
    const user = await UserController.createUser({
      name,
      email,
      password,
      role,
      phone,
      address,
      bio,
      emailVerificationToken: otp,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiration
    });

    // Send OTP email
    await EmailService.sendOTPEmail(email, otp, name);

    res.status(201).json({ 
      message: "User registered successfully. Please verify your email within 10 minutes.",
      user
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
}
