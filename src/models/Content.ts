// models/Content.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  title: string;
  description?: string;
  content: string;
  category: string;
  status: 'مسودة' | 'مراجعة' | 'منشور';
  tags: string[];
  userId: mongoose.Types.ObjectId;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['مسودة', 'مراجعة', 'منشور'],
    default: 'مسودة'
  },
  tags: [{
    type: String,
    trim: true
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// إنشاء فهرس للبحث
ContentSchema.index({ title: 'text', description: 'text', content: 'text' });

export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);