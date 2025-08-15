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

    // Check if admin user is blocked or inactive
    if (adminUser.isBlocked) {
      return res.status(403).json({ error: "Your admin account has been blocked" });
    }

    if (!adminUser.isActive) {
      return res.status(403).json({ error: "Your admin account is inactive" });
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

      // Check if admin user is blocked or inactive
      if (adminUser.isBlocked) {
        return res.status(403).json({ error: "Your admin account has been blocked" });
      }

      if (!adminUser.isActive) {
        return res.status(403).json({ error: "Your admin account is inactive" });
      }

      req.adminUser = adminUser;
      return handler(req, res);
    } catch (error) {
      console.error("Admin auth error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };
};

// Simple admin auth function for checking if a user is admin
export const adminAuth = async (userId: string): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    return user?.role === "admin" && user?.isActive && !user?.isBlocked;
  } catch (error) {
    console.error("Admin auth check error:", error);
    return false;
  }
}; 