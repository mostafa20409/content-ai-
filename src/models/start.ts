import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface IStart extends Document {
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// سكيمة Start
const StartSchema: Schema<IStart> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // يدير createdAt و updatedAt تلقائيًا
  }
);

// إذا الموديل معرف بالفعل، استخدمه، وإلا عرفه جديد
const StartModel: Model<IStart> = models.Start || mongoose.model<IStart>("Start", StartSchema);

export default StartModel;