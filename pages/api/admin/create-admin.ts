// pages/api/admin/create-admin.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      phone: "",
      address: "",
      bio: "System Administrator"
    });

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    res.status(500).json({ error: "Failed to create admin user" });
  }
} 