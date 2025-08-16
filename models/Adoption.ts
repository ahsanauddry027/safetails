import mongoose, { Schema, Document } from 'mongoose';

export interface IAdoption extends Document {
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
  adoptionType: 'permanent' | 'trial' | 'senior' | 'special-needs';
  adoptionFee?: number;
  isSpayedNeutered: boolean;
  isVaccinated: boolean;
  isMicrochipped: boolean;
  specialNeeds?: string;
  medicalHistory?: string;
  temperament: string[];
  goodWith: {
    children: boolean;
    otherDogs: boolean;
    otherCats: boolean;
    otherPets: boolean;
  };
  requirements: string[]; // e.g., ["fenced yard", "no other pets", "experienced owner"]
  status: 'available' | 'pending' | 'adopted' | 'on-hold' | 'cancelled';
  userId: mongoose.Types.ObjectId; // Current owner/shelter
  adopter?: {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    applicationId: mongoose.Types.ObjectId;
  };
  applications: mongoose.Types.ObjectId[];
  adoptionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdoptionSchema = new Schema<IAdoption>({
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
  adoptionType: {
    type: String,
    enum: ['permanent', 'trial', 'senior', 'special-needs'],
    required: true
  },
  adoptionFee: {
    type: Number,
    min: 0
  },
  isSpayedNeutered: {
    type: Boolean,
    default: false
  },
  isVaccinated: {
    type: Boolean,
    default: false
  },
  isMicrochipped: {
    type: Boolean,
    default: false
  },
  specialNeeds: String,
  medicalHistory: String,
  temperament: [{
    type: String,
    trim: true
  }],
  goodWith: {
    children: {
      type: Boolean,
      default: false
    },
    otherDogs: {
      type: Boolean,
      default: false
    },
    otherCats: {
      type: Boolean,
      default: false
    },
    otherPets: {
      type: Boolean,
      default: false
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted', 'on-hold', 'cancelled'],
    default: 'available'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adopter: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    phone: String,
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'AdoptionApplication'
    }
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'AdoptionApplication'
  }],
  adoptionDate: Date,
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
AdoptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for efficient queries
AdoptionSchema.index({ status: 1, createdAt: -1 });
AdoptionSchema.index({ location: '2dsphere' });
AdoptionSchema.index({ petType: 1, status: 1 });

export default mongoose.models.Adoption || mongoose.model<IAdoption>('Adoption', AdoptionSchema);
