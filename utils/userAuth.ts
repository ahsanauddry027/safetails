// utils/userAuth.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";
import User from "@/models/User";

interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthenticatedUser;
}

export const userAuth = async (req: NextApiRequest, res: NextApiResponse): Promise<{ user: AuthenticatedUser } | null> => {
  try {
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token) as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive || user.isBlocked) {
      return null;
    }

    return { user };
  } catch (error) {
    console.error("User auth error:", error);
    return null;
  }
};

export const withUserAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const { token } = cookie.parse(req.headers.cookie || "");
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const decoded = verifyToken(token) as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive || user.isBlocked) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      console.error("User auth error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };
};
