import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/safetails";

if (!MONGODB_URI) {
  console.warn("MongoDB URI missing, using default localhost");
}

export default async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}
