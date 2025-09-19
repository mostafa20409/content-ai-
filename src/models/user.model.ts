// src/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  active: boolean;
  adsUsedThisMonth: number;
  lastAdReset: Date;
  keywordsUsedThisMonth: number;
  lastKeywordReset: Date;
  contentUsedThisMonth: number;
  lastContentReset: Date;
  booksUsedThisMonth: number;
  lastBookReset: Date;
  adsLimitPerMonth: number;
  keywordsLimitPerMonth: number;
  contentLimitPerMonth: number;
  booksLimitPerMonth: number;
  role: "user" | "admin" | "premium";
  subscription: "free" | "pro" | "premium";
  subscriptionLimits: {
    coverGeneration: number;
    imageGeneration: number;
    booksPerMonth: number;
    wordsPerMonth: number;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;

  comparePassword(candidatePassword: string): Promise<boolean>;
  canUseFeature(feature: string): { allowed: boolean; remaining?: number };
  resetMonthlyCounters(): Promise<void>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
      minlength: [2, "الاسم يجب أن يكون على الأقل حرفين"],
      maxlength: [50, "الاسم يجب أن لا يتجاوز 50 حرفًا"]
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "صيغة البريد الإلكتروني غير صحيحة"]
    },
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: [8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف"],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      match: [/^\+?[0-9]{8,15}$/, "رقم الهاتف غير صحيح"]
    },
    active: {
      type: Boolean,
      default: true,
    },
    adsUsedThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastAdReset: {
      type: Date,
      default: Date.now,
    },
    keywordsUsedThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastKeywordReset: {
      type: Date,
      default: Date.now,
    },
    contentUsedThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastContentReset: {
      type: Date,
      default: Date.now,
    },
    booksUsedThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastBookReset: {
      type: Date,
      default: Date.now,
    },
    adsLimitPerMonth: {
      type: Number,
      default: 10,
      min: 0
    },
    keywordsLimitPerMonth: {
      type: Number,
      default: 50,
      min: 0
    },
    contentLimitPerMonth: {
      type: Number,
      default: 2000,
      min: 0
    },
    booksLimitPerMonth: {
      type: Number,
      default: 5,
      min: 0
    },
    role: {
      type: String,
      enum: ["user", "admin", "premium"],
      default: "user",
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    subscriptionLimits: {
      coverGeneration: {
        type: Number,
        default: 0,
        min: 0
      },
      imageGeneration: {
        type: Number,
        default: 0,
        min: 0
      },
      booksPerMonth: {
        type: Number,
        default: 5,
        min: 0
      },
      wordsPerMonth: {
        type: Number,
        default: 10000,
        min: 0
      }
    },
    passwordResetToken: { 
      type: String,
      select: false
    },
    passwordResetExpires: { 
      type: Date,
      select: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(_doc, ret) {
        const { password, passwordResetToken, passwordResetExpires, ...safeRet } = ret;
        return safeRet;
      }
    }
  }
);

// إزالة الفهرس المكرر - التعليق على الفهرس المنفصل
// userSchema.index({ phone: 1 }, { 
//   unique: true, 
//   sparse: true,
//   partialFilterExpression: { phone: { $type: 'string' } } 
// });

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// تبسيط middleware لتجنب التكرار المفرط
userSchema.pre(/^findOneAndUpdate/, async function(next) {
  try {
    const query = this as any;
    const doc = await query.model.findOne(query.getFilter());
    if (doc) {
      await doc.resetMonthlyCounters();
    }
    next();
  } catch (error) {
    next();
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canUseFeature = function (feature: string): { allowed: boolean; remaining?: number } {
  const subscriptionLimits = {
    free: { imageGeneration: 0, coverGeneration: 0, pdfExport: 0, ads: 10, keywords: 50, content: 2000, books: 5 },
    pro: { imageGeneration: 50, coverGeneration: 10, pdfExport: 5, ads: 50, keywords: 200, content: 10000, books: 20 },
    premium: { imageGeneration: -1, coverGeneration: -1, pdfExport: -1, ads: -1, keywords: -1, content: -1, books: -1 }
  };

  const limits = subscriptionLimits[this.subscription as keyof typeof subscriptionLimits];
  if (!limits || !limits.hasOwnProperty(feature)) {
    return { allowed: false };
  }

  const limit = limits[feature as keyof typeof limits];
  if (limit === -1) return { allowed: true };

  let used = 0;
  let remaining = 0;

  switch(feature) {
    case 'imageGeneration': used = this.subscriptionLimits.imageGeneration; break;
    case 'coverGeneration': used = this.subscriptionLimits.coverGeneration; break;
    case 'pdfExport': return { allowed: true };
    case 'ads': used = this.adsUsedThisMonth; break;
    case 'keywords': used = this.keywordsUsedThisMonth; break;
    case 'content': used = this.contentUsedThisMonth; break;
    case 'books': used = this.booksUsedThisMonth; break;
    default: return { allowed: false };
  }

  remaining = Math.max(0, limit - used);
  return { allowed: used < limit, remaining };
};

userSchema.methods.resetMonthlyCounters = async function (): Promise<void> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const counters = [
    { field: 'lastAdReset', used: 'adsUsedThisMonth' },
    { field: 'lastKeywordReset', used: 'keywordsUsedThisMonth' },
    { field: 'lastContentReset', used: 'contentUsedThisMonth' },
    { field: 'lastBookReset', used: 'booksUsedThisMonth' }
  ];

  for (const counter of counters) {
    if (this[counter.field] < oneMonthAgo) {
      this[counter.used] = 0;
      this[counter.field] = now;
    }
  }

  if (now.getMonth() !== this.lastLogin.getMonth() || now.getFullYear() !== this.lastLogin.getFullYear()) {
    const subscriptionResetValues = {
      free: { coverGeneration: 0, imageGeneration: 0, booksPerMonth: 5, wordsPerMonth: 10000 },
      pro: { coverGeneration: 10, imageGeneration: 50, booksPerMonth: 20, wordsPerMonth: 50000 },
      premium: { coverGeneration: -1, imageGeneration: -1, booksPerMonth: -1, wordsPerMonth: -1 }
    };
    
    this.subscriptionLimits = subscriptionResetValues[this.subscription as keyof typeof subscriptionResetValues] || 
                             subscriptionResetValues.free;
  }

  await this.save({ validateBeforeSave: false });
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone: phone.trim() });
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;