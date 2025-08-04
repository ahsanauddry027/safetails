// utils/adminAuth.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";
import User from "@/models/User";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface AuthenticatedRequest extends NextApiRequest {
  adminUser?: AdminUser;
}

export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token) as { id: string };
    const adminUser = await User.findById(decoded.id);
    
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.adminUser = adminUser;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const withAdminAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const { token } = cookie.parse(req.headers.cookie || "");
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const decoded = verifyToken(token) as { id: string };
      const adminUser = await User.findById(decoded.id);
      
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.adminUser = adminUser;
      return handler(req, res);
    } catch (error) {
      console.error("Admin auth error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };
}; 