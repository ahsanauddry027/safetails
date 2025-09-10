// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import User from "@/models/User";
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
      return "Your account has been blocked by an administrator. You cannot login until the block is removed. Please contact support for assistance.";
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

    // Pre-check user status to provide clearer messaging without throwing
    const preUser = await User.findOne({ email })
      .populate("blockedBy", "name email")
      .select(
        "name email role isActive isBlocked blockedBy blockReason password"
      );

    if (!preUser) {
      return res.status(404).json({
        error: "User not found",
        message:
          "No account found with this email address. Please check your email or register for a new account.",
      });
    }

    if (!preUser.isActive) {
      return res.status(403).json({
        error: "Account is inactive",
        message:
          "Your account has been deactivated by an administrator. Please contact support for assistance.",
      });
    }

    if (preUser.isBlocked) {
      const blocker =
        (preUser.blockedBy as unknown as { name?: string; email?: string }) ||
        {};
      const who = blocker.name || blocker.email || "an administrator";
      const reason = preUser.blockReason
        ? ` Reason: ${preUser.blockReason}.`
        : "";
      return res.status(403).json({
        error: "Account is blocked",
        message: `Your account has been blocked by ${who}.${reason}`.trim(),
      });
    }

    // Use controller service method to authenticate user (includes password check)
    const user = await UserController.authenticateUserService(email, password);

    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });
    setTokenCookie(res, token);

    return res.status(200).json({ user });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Login error:", err);

    // Set appropriate status code based on error type
    let statusCode = 401; // Default unauthorized

    // Customize status code based on error message
    if (error.message === "User not found") {
      statusCode = 404; // Not found
    } else if (
      error.message === "Account is inactive" ||
      error.message === "Account is blocked"
    ) {
      statusCode = 403; // Forbidden
    }

    return res.status(statusCode).json({
      error: error.message || "Internal error",
      // Add a user-friendly message
      message: getLoginErrorMessage(error.message),
    });
  }
}
