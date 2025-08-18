import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  isVerified?: boolean;
}

// دالة لإنشاء JWT
export const signToken = (user: IUser) => {
  // تحويل _id من unknown إلى string
  const userId = user._id?.toString();
  if (!userId) throw new Error("معرف المستخدم غير موجود");

  const payload: TokenPayload = {
    id: userId,
    email: user.email,
    role: user.role,
    isVerified: false, // لو عايز تتحقق من التحقق
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d", // مدة الصلاحية
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });
};

// دالة للتحقق من JWT
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};