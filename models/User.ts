// models/User.ts
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "vet", "admin"], default: "user" },
    phone: { type: String },
    address: { type: String },
    bio: { type: String },
    profileImage: { type: String },
    permissions: {
      userManagement: { type: Boolean, default: true },
      contentModeration: { type: Boolean, default: true },
      systemSettings: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true }
    },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blockedAt: { type: Date },
    blockReason: { type: String },
    // Email verification fields
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    // Password reset fields
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
