import mongoose, { Schema, Document } from 'mongoose';

export interface IFosterApplication extends Document {
  fosterRequestId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    age: number;
    occupation: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  experience: {
    previousPets: boolean;
    petTypes: string[];
    yearsOfExperience: number;
    description: string;
  };
  homeEnvironment: {
    homeType: 'apartment' | 'house' | 'condo' | 'townhouse';
    hasYard: boolean;
    yardSize?: string;
    isFenced: boolean;
    otherPets: boolean;
    otherPetDetails?: string;
    children: boolean;
    childrenAges?: string;
    workSchedule: string;
    timeAlone: string;
  };
  motivation: {
    reason: string;
    commitment: string;
    expectations: string;
  };
  references: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }[];
  additionalInfo: string;
  adminNotes?: string;
  adminId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FosterApplicationSchema = new Schema<IFosterApplication>({
  fosterRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'FosterRequest',
    required: true
  },
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  personalInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 18
    },
    occupation: {
      type: String,
      required: true,
      trim: true
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
    zipCode: {
      type: String,
      required: true,
      trim: true
    }
  },
  experience: {
    previousPets: {
      type: Boolean,
      required: true
    },
    petTypes: [{
      type: String,
      trim: true
    }],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  homeEnvironment: {
    homeType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse'],
      required: true
    },
    hasYard: {
      type: Boolean,
      required: true
    },
    yardSize: String,
    isFenced: {
      type: Boolean,
      required: true
    },
    otherPets: {
      type: Boolean,
      required: true
    },
    otherPetDetails: String,
    children: {
      type: Boolean,
      required: true
    },
    childrenAges: String,
    workSchedule: {
      type: String,
      required: true,
      trim: true
    },
    timeAlone: {
      type: String,
      required: true,
      trim: true
    }
  },
  motivation: {
    reason: {
      type: String,
      required: true,
      trim: true
    },
    commitment: {
      type: String,
      required: true,
      trim: true
    },
    expectations: {
      type: String,
      required: true,
      trim: true
    }
  },
  references: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    }
  }],
  additionalInfo: String,
  adminNotes: String,
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
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
FosterApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for efficient queries
FosterApplicationSchema.index({ fosterRequestId: 1, applicantId: 1 }, { unique: true });
FosterApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.FosterApplication || mongoose.model<IFosterApplication>('FosterApplication', FosterApplicationSchema);
