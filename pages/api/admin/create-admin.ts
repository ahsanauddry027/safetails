// pages/api/admin/create-admin.ts
import { NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { withAdminAuth, AuthenticatedRequest } from "@/utils/adminAuth";

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password, phone, address, bio } = req.body;
  
  console.log("Received request body:", req.body);
  console.log("Extracted fields:", { name, email, password, phone, address, bio });

  if (!name || !email || !password) {
    console.log("Validation failed - missing required fields");
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Database connected successfully");
    console.log("MongoDB URI:", process.env.MONGODB_URI || "mongodb://localhost:27017/safetails");

    // Check if admin already exists
    console.log("Checking for existing user with email:", email);
    
    // Try exact match first
    let existingAdmin = await User.findOne({ email });
    console.log("Exact email match result:", existingAdmin);
    
    // If no exact match, try case-insensitive search
    if (!existingAdmin) {
      console.log("No exact match, trying case-insensitive search...");
      existingAdmin = await User.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });
      console.log("Case-insensitive search result:", existingAdmin);
    }
    
    console.log("Final database query result:", existingAdmin);
    
    if (existingAdmin) {
      console.log("User already exists with email:", email);
      console.log("Existing user details:", {
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      return res.status(400).json({ error: "User already exists with this email address" });
    }
    
    console.log("No existing user found, proceeding with creation...");
    
    // Debug: Let's see all users in the database
    console.log("Debug: Checking all users in database...");
    const allUsers = await User.find({}).select('name email role').limit(10);
    console.log("All users in database (first 10):", allUsers);

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    console.log("Creating admin user...");
    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      phone: phone || "",
      address: address || "",
      bio: bio || "System Administrator",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("Admin user created successfully:", adminUser._id);

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        phone: adminUser.phone,
        address: adminUser.address,
        bio: adminUser.bio
      }
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    console.error("Request body:", req.body);
    res.status(500).json({ error: "Failed to create admin user" });
  }
}

export default withAdminAuth(handler);