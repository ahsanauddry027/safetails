// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { signToken, setTokenCookie } from "@/utils/auth";

// Helper function to get user-friendly error messages
function getLoginErrorMessage(errorMessage: string): string {
  switch (errorMessage) {
    case "User not found":
      return "No account found with this email address. Please check your email or register for a new account.";
    case "Invalid password":
      return "Incorrect password. Please try again or reset your password.";
    case "Account is inactive":
      return "Your account is currently inactive. Please contact support for assistance.";
    case "Account is blocked":
      return "Your account has been blocked. Please contact support for more information.";
    default:
      return "An error occurred during login. Please try again later.";
  }
}

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
    
    // Set appropriate status code based on error type
    let statusCode = 401; // Default unauthorized
    
    // Customize status code based on error message
    if (err.message === "User not found") {
      statusCode = 404; // Not found
    } else if (err.message === "Account is inactive" || err.message === "Account is blocked") {
      statusCode = 403; // Forbidden
    }
    
    return res.status(statusCode).json({ 
      error: err.message || "Internal error",
      // Add a user-friendly message
      message: getLoginErrorMessage(err.message)
    });
  }
}
