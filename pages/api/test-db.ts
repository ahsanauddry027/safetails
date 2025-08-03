// pages/api/test-db.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import mongoose from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Testing database connection...");
    
    // Test connection
    await dbConnect();
    
    // Check connection status
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };
    
    console.log(`📊 Database connection state: ${connectionStates[connectionState]}`);
    
    // Test database operations
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    const result = {
      status: "success",
      message: "Database connection successful",
      connectionState: connectionStates[connectionState],
      databaseName: dbName,
      collections: collections?.map(col => col.name) || [],
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    };
    
    console.log("✅ Database test completed successfully");
    res.status(200).json(result);
    
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  }
} 