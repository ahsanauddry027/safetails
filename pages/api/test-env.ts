// pages/api/test-env.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const envInfo = {
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.length
        : 0,
      JWT_SECRET_START: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.substring(0, 10) + "..."
        : "NOT_SET",
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV,
      ALL_ENV_KEYS: Object.keys(process.env).filter(
        (key) => key.includes("JWT") || key.includes("MONGODB")
      ),
    };

    res.status(200).json({
      success: true,
      message: "Environment variables check",
      data: envInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check environment variables",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
