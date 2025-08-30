import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safetails";

if (!MONGODB_URI) {
  console.warn("MongoDB URI missing, using default localhost");
}

// Connection monitoring
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

export default async function dbConnect() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState >= 1) {
      console.log(
        "MongoDB already connected, state:",
        mongoose.connection.readyState
      );
      return mongoose.connection;
    }

    console.log("Connecting to MongoDB...");

    // Simple connection without complex options
    const connection = await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connection established");
    return connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
