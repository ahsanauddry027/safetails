import mongoose, { Schema, Document } from 'mongoose';

export interface IAdoptionApplication extends Document {
  adoptionId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'approved-pending';
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
    householdSize: number;
    children: boolean;
    childrenAges?: string;
  };
  experience: {
    previousPets: boolean;
    petTypes: string[];
    yearsOfExperience: number;
    description: string;
    currentPets: boolean;
    currentPetDetails?: string;
  };
  homeEnvironment: {
    homeType: 'apartment' | 'house' | 'condo' | 'townhouse';
    ownership: 'own' | 'rent';
    hasYard: boolean;
    yardSize?: string;
    isFenced: boolean;
    landlordApproval?: boolean;
    workSchedule: string;
    timeAlone: string;
    travelFrequency: string;
  };
  financial: {
    income: 'low' | 'medium' | 'high' | 'prefer-not-to-say';
    canAffordVet: boolean;
    canAffordFood: boolean;
    canAffordSupplies: boolean;
    emergencyFund: boolean;
  };
  motivation: {
    reason: string;
    commitment: string;
    expectations: string;
    lifestyle: string;
    timeCommitment: string;
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

const AdoptionApplicationSchema = new Schema<IAdoptionApplication>({
  adoptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Adoption',
    required: true
  },
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn', 'approved-pending'],
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
    },
    householdSize: {
      type: Number,
      required: true,
      min: 1
    },
    children: {
      type: Boolean,
      required: true
    },
    childrenAges: String
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
    },
    currentPets: {
      type: Boolean,
      required: true
    },
    currentPetDetails: String
  },
  homeEnvironment: {
    homeType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse'],
      required: true
    },
    ownership: {
      type: String,
      enum: ['own', 'rent'],
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
    landlordApproval: Boolean,
    workSchedule: {
      type: String,
      required: true,
      trim: true
    },
    timeAlone: {
      type: String,
      required: true,
      trim: true
    },
    travelFrequency: {
      type: String,
      required: true,
      trim: true
    }
  },
  financial: {
    income: {
      type: String,
      enum: ['low', 'medium', 'high', 'prefer-not-to-say'],
      required: true
    },
    canAffordVet: {
      type: Boolean,
      required: true
    },
    canAffordFood: {
      type: Boolean,
      required: true
    },
    canAffordSupplies: {
      type: Boolean,
      required: true
    },
    emergencyFund: {
      type: Boolean,
      required: true
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
    },
    lifestyle: {
      type: String,
      required: true,
      trim: true
    },
    timeCommitment: {
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
AdoptionApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for efficient queries
AdoptionApplicationSchema.index({ adoptionId: 1, applicantId: 1 }, { unique: true });
AdoptionApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.AdoptionApplication || mongoose.model<IAdoptionApplication>('AdoptionApplication', AdoptionApplicationSchema);
