// models/PetPost.ts
import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  type: { type: String, default: "Point" },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  address: { type: String },
  description: { type: String },
});

const PetPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    postType: {
      type: String,
      enum: ["missing", "emergency", "wounded"],
      required: true,
    },
    petName: {
      type: String,
      required: true,
    },
    petType: {
      type: String,
      required: true,
    },
    petBreed: {
      type: String,
    },
    petAge: {
      type: String,
    },
    petGender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
    petColor: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    location: {
      type: LocationSchema,
      required: function (this: Record<string, unknown>) {
        // Location is required for missing and wounded pet posts
        return (
          this.postType === "missing" ||
          this.postType === "emergency" ||
          this.postType === "wounded"
        );
      },
    },
    lastSeenDate: {
      type: Date,
      required: function (this: mongoose.Document & { postType?: string }) {
        // Last seen date is required for missing pet posts
        return this.postType === "missing";
      },
    },
    status: {
      type: String,
      enum: ["active", "resolved", "closed"],
      default: "active",
    },
    isEmergency: {
      type: Boolean,
      default: function (this: mongoose.Document & { postType?: string }) {
        return this.postType === "emergency";
      },
    },
    contactPhone: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create a geospatial index on the location field
PetPostSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.models.PetPost ||
  mongoose.model("PetPost", PetPostSchema);
