// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = verifyToken(token) as { id: string };
    await dbConnect();
    
    // Use controller to get user by token
    const user = await UserController.getUserByToken(decoded.id);

    res.status(200).json({ user });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error("Auth error:", error);
    
    // Set appropriate status code based on error type
    let statusCode = 401; // Default unauthorized
    
    if (errorMessage === "Account is blocked") {
      statusCode = 403; // Forbidden
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: errorMessage === "Account is blocked" 
        ? "Your account has been blocked by an administrator. You cannot access the site until the block is removed." 
        : "Authentication failed"
    });
  }
}
