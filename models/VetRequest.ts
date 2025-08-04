// models/VetRequest.ts
import mongoose from "mongoose";

const VetRequestSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    vetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    petName: { 
      type: String, 
      required: true 
    },
    petType: { 
      type: String, 
      required: true 
    },
    petBreed: { 
      type: String 
    },
    petAge: { 
      type: String 
    },
    requestType: { 
      type: String, 
      enum: ["checkup", "emergency", "vaccination", "surgery", "consultation", "other"], 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "completed", "cancelled"], 
      default: "pending" 
    },
    appointmentDate: { 
      type: Date 
    },
    notes: { 
      type: String 
    },
    isEmergency: { 
      type: Boolean, 
      default: false 
    },
    contactPhone: {
      type: String
    },
    contactEmail: {
      type: String
    },
    petGender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown"
    },
    location: {
      coordinates: {
        type: [Number], // [lng, lat]
        required: false
      },
      address: {
        type: String
      },
      description: {
        type: String
      }
    }
  },
  { timestamps: true }
);

export default mongoose.models.VetRequest || mongoose.model("VetRequest", VetRequestSchema);