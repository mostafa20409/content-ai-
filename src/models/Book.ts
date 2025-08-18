import mongoose, { Schema, Document, Model } from "mongoose";

// 1. تعريف واجهة TypeScript لهيكل البيانات
export interface IBook extends Document {
  userId: string;          // معرف المستخدم اللي أضاف الكتاب
  title: string;           // عنوان الكتاب
  description?: string;    // وصف مختصر للكتاب
  author?: string;         // اسم المؤلف
  language: string;        // لغة الكتاب (مثال: ar, en, la)
  genre?: string;          // التصنيف (خيالي، تاريخي، إلخ)
  chapters: {
    title: string;
    content: string;
  }[];
  createdAt: Date;         // تاريخ الإضافة
  updatedAt: Date;         // تاريخ التحديث
}

// 2. إنشاء الـ Schema
const BookSchema: Schema<IBook> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "يجب إدخال عنوان الكتاب"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      default: "غير معروف",
    },
    language: {
      type: String,
      enum: ["ar", "en", "la"], // العربية، الإنجليزية، اللاتينية
      default: "ar",
    },
    genre: {
      type: String,
      trim: true,
    },
    chapters: [
      {
        title: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true, // بيضيف createdAt و updatedAt تلقائي
  }
);

// 3. عمل Model أو إعادة استخدامه لو كان متعرف قبل كده
const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;