// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { signToken, setTokenCookie } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { email, password } = req.body;

  try {
    await dbConnect();
    
    // Use controller to authenticate user
    const user = await UserController.authenticateUser(email, password);

    const token = signToken({ id: user.id });
    setTokenCookie(res, token);

    return res.status(200).json({ user });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(401).json({ error: err.message || "Internal error" });
  }
}
