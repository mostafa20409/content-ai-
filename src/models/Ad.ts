// models/Ad.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  title: string;
  description: string;
  targetAudience: string;
  platform: 'فيسبوك' | 'إنستغرام' | 'تويتر' | 'تيك توك' | 'جوجل';
  status: 'مسودة' | 'نشط' | 'متوقف' | 'مكتمل';
  budget: number;
  clicks: number;
  impressions: number;
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['فيسبوك', 'إنستغرام', 'تويتر', 'تيك توك', 'جوجل'],
    required: true
  },
  status: {
    type: String,
    enum: ['مسودة', 'نشط', 'متوقف', 'مكتمل'],
    default: 'مسودة'
  },
  budget: {
    type: Number,
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);