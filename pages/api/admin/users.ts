// pages/api/admin/users.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { UserController } from "@/controllers/UserController";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    console.log("Users API - Cookies received:", req.headers.cookie);
    const { token } = cookie.parse(req.headers.cookie || "");
    console.log("Users API - Token exists:", !!token);

    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = await verifyTokenAndCheckBlocked(token);
    console.log("Users API - User verified:", { id: decoded.id });
    await dbConnect();

    // Get all users with pagination and filters
    const { page, limit, role, status, search } = req.query;
    const usersResult = await UserController.getAllUsersService(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50, // Get more users for categorization
      { role, status, search }
    );

    // Get user statistics
    const statsResult = await UserController.getUserStatisticsService();

    // Categorize users by role and transform _id to id
    const allUsers = usersResult.data.map((user: any) => {
      const userObj = user.toObject ? user.toObject() : user;
      return {
        ...userObj,
        id: userObj._id?.toString() || userObj.id, // Ensure id field exists as string
      };
    });
    const users = allUsers.filter((user) => user.role === "user");
    const vets = allUsers.filter((user) => user.role === "vet");
    const admins = allUsers.filter((user) => user.role === "admin");
    const blocked = allUsers.filter((user) => user.isBlocked);

    res.status(200).json({
      success: true,
      users: {
        users,
        vets,
        admins,
        blocked,
        total: allUsers.length,
      },
      stats: {
        totalUsers: statsResult.totalUsers,
        totalVets: statsResult.totalVets,
        totalAdmins: statsResult.totalAdmins,
        totalBlocked: statsResult.totalBlocked,
        totalActive: statsResult.totalActive,
      },
      pagination: usersResult.pagination,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
