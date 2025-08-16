import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  type: 'lost_pet' | 'found_pet' | 'foster_request' | 'emergency' | 'adoption' | 'general';
  title: string;
  description: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude] for MongoDB 2dsphere
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    radius: number; // Alert radius in kilometers
  };
  petDetails?: {
    petType: string;
    petBreed?: string;
    petColor?: string;
    petAge?: string;
    petGender?: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'expired';
  createdBy: mongoose.Types.ObjectId;
  targetAudience: 'all' | 'nearby' | 'specific_area';
  expiresAt?: Date;
  isActive: boolean;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  type: {
    type: String,
    enum: ['lost_pet', 'found_pet', 'foster_request', 'emergency', 'adoption', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: String,
    radius: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 10
    }
  },
  petDetails: {
    petType: String,
    petBreed: String,
    petColor: String,
    petAge: String,
    petGender: String
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'expired'],
    default: 'active'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'nearby', 'specific_area'],
    default: 'nearby'
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
AlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for efficient queries
AlertSchema.index({ 'location.coordinates': '2dsphere' });
AlertSchema.index({ type: 1, status: 1, isActive: 1 });
AlertSchema.index({ urgency: 1, createdAt: -1 });
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
