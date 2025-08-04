import jwt from "jsonwebtoken";
import { serialize } from "cookie";

// Use a more secure default secret for development
const secret = process.env.JWT_SECRET || "safetails-dev-secret-key-2024-change-in-production";

// Validate that we have a proper secret
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set in environment variables. Using development secret.");
  console.warn("⚠️  Please set JWT_SECRET in your .env.local file for production.");
}

export function signToken(payload: object) {
  try {
    return jwt.sign(payload, secret, { 
      expiresIn: "7d",
      issuer: "safetails",
      audience: "safetails-users"
    });
  } catch (error) {
    console.error("JWT signing error:", error);
    throw new Error("Failed to create authentication token");
  }
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret, {
      issuer: "safetails",
      audience: "safetails-users"
    });
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error("Invalid authentication token");
  }
}

export function setTokenCookie(res: { setHeader: (name: string, value: string) => void }, token: string) {
  res.setHeader(
    "Set-Cookie",
    serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
  );
}
