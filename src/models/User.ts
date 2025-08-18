// src/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// 📌 واجهة TypeScript لتعريف المستخدم
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  // 📌 حالة التفعيل
  active: boolean;

  // 📌 إعلانات
  adsUsedThisMonth: number;
  lastAdReset: Date;

  // 📌 كلمات مفتاحية
  keywordsUsedThisMonth: number;
  lastKeywordReset: Date;

  // 📌 محتوى
  contentUsedThisMonth: number;
  lastContentReset: Date;

  // 📌 كتب
  booksUsedThisMonth: number;
  lastBookReset: Date;

  // 📌 حدود الخطة الشهرية
  adsLimitPerMonth: number;
  keywordsLimitPerMonth: number;
  contentLimitPerMonth: number;
  booksLimitPerMonth: number;

  // 📌 الصلاحيات
  role: "user" | "admin" | "premium";

  // 📌 الاشتراك
  subscription: "free" | "pro" | "premium";

  // 📌 إعادة تعيين كلمة المرور
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // 📌 Timestamps
  createdAt: Date;
  updatedAt: Date;
  __v?: number;

  // 📌 دالة مقارنة كلمات المرور
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 📌 مخطط قاعدة البيانات
const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: 6,
    },

    // 📌 حالة التفعيل
    active: {
      type: Boolean,
      default: true,
    },

    // 📌 إعلانات
    adsUsedThisMonth: {
      type: Number,
      default: 0,
    },
    lastAdReset: {
      type: Date,
      default: Date.now,
    },

    // 📌 كلمات مفتاحية
    keywordsUsedThisMonth: {
      type: Number,
      default: 0,
    },
    lastKeywordReset: {
      type: Date,
      default: Date.now,
    },

    // 📌 محتوى
    contentUsedThisMonth: {
      type: Number,
      default: 0,
    },
    lastContentReset: {
      type: Date,
      default: Date.now,
    },

    // 📌 كتب
    booksUsedThisMonth: {
      type: Number,
      default: 0,
    },
    lastBookReset: {
      type: Date,
      default: Date.now,
    },

    // 📌 حدود الخطة الشهرية
    adsLimitPerMonth: {
      type: Number,
      default: 10,
    },
    keywordsLimitPerMonth: {
      type: Number,
      default: 50,
    },
    contentLimitPerMonth: {
      type: Number,
      default: 2000,
    },
    booksLimitPerMonth: {
      type: Number,
      default: 5,
    },

    // 📌 الصلاحيات
    role: {
      type: String,
      enum: ["user", "admin", "premium"],
      default: "user",
    },

    // 📌 الاشتراك
    subscription: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },

    // 📌 إعادة تعيين كلمة المرور
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// 📌 Middleware: تشفير كلمة المرور قبل الحفظ
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 📌 دالة لمقارنة كلمات المرور
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 📌 إنشاء الموديل
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
