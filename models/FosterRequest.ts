import mongoose, { Schema, Document } from 'mongoose';

export interface IFosterRequest extends Document {
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  petGender?: string;
  petColor?: string;
  petCategory?: string;
  description: string;
  images: string[];
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  fosterType: 'temporary' | 'long-term' | 'emergency';
  duration: string; // e.g., "2 weeks", "1 month", "until adopted"
  startDate: Date;
  endDate?: Date;
  requirements: string[]; // e.g., ["fenced yard", "no other pets", "experienced owner"]
  specialNeeds?: string;
  medicalHistory?: string;
  isUrgent: boolean;
  status: 'pending' | 'active' | 'matched' | 'completed' | 'cancelled';
  userId: mongoose.Types.ObjectId;
  fosterParent?: {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    experience: string;
    homeEnvironment: string;
    otherPets: boolean;
    children: boolean;
    workSchedule: string;
    reason: string;
  };
  applications: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FosterRequestSchema = new Schema<IFosterRequest>({
  petName: {
    type: String,
    required: true,
    trim: true
  },
  petType: {
    type: String,
    required: true,
    trim: true
  },
  petBreed: {
    type: String,
    trim: true
  },
  petAge: {
    type: String,
    trim: true
  },
  petGender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  petColor: {
    type: String,
    trim: true
  },
  petCategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  location: {
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String
  },
  fosterType: {
    type: String,
    enum: ['temporary', 'long-term', 'emergency'],
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  requirements: [{
    type: String,
    trim: true
  }],
  specialNeeds: String,
  medicalHistory: String,
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'matched', 'completed', 'cancelled'],
    default: 'pending'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fosterParent: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    phone: String,
    experience: String,
    homeEnvironment: String,
    otherPets: Boolean,
    children: Boolean,
    workSchedule: String,
    reason: String
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'FosterApplication'
  }],
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
FosterRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.FosterRequest || mongoose.model<IFosterRequest>('FosterRequest', FosterRequestSchema);
