import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  postId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: 'inappropriate_content' | 'spam' | 'fake_information' | 'harassment' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'PetPost',
    required: true
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['inappropriate_content', 'spam', 'fake_information', 'harassment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  reviewedBy: {
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

ReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ReportSchema.index({ postId: 1, status: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedBy: 1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

