// models/VetDirectory.ts
import mongoose from "mongoose";

const VetDirectorySchema = new mongoose.Schema(
  {
    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clinicName: {
      type: String,
      required: true,
    },
    specialization: [{
      type: String,
      enum: ["emergency", "surgery", "vaccination", "checkup", "dental", "orthopedic", "dermatology", "cardiology", "other"],
    }],
    services: [{
      type: String,
    }],
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
      },
    },
    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      website: {
        type: String,
      },
      emergencyPhone: {
        type: String,
      },
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    isEmergencyAvailable: {
      type: Boolean,
      default: false,
    },
    is24Hours: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create geospatial index for location-based queries
VetDirectorySchema.index({ "location.coordinates": "2dsphere" });

// Create text index for search functionality
VetDirectorySchema.index({
  clinicName: "text",
  specialization: "text",
  services: "text",
  "location.city": "text",
  "location.state": "text",
});

export default mongoose.models.VetDirectory || mongoose.model("VetDirectory", VetDirectorySchema);
