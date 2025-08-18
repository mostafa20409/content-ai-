// src/middleware/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface UserPayload {
  id: string;
  email: string;
  role: "user" | "admin" | "premium";
  isVerified?: boolean;
}

interface AuthOptions {
  requiredRole?: "user" | "admin" | "premium";
  ignoreExpiration?: boolean;
}

export const authMiddleware = (options: AuthOptions = {}) => {
  return async (req: NextRequest) => {
    try {
      // استخراج التوكن من الكوكيز أو الهيدر
      let token = req.cookies.get("token")?.value;
      if (!token) {
        const authHeader = req.headers.get("authorization") || "";
        if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
      }

      if (!token) {
        return NextResponse.json(
          { success: false, message: "مطلوب توكن للمصادقة" },
          { status: 401 }
        );
      }

      // التحقق من JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        ignoreExpiration: options.ignoreExpiration,
      }) as UserPayload;

      if (!decoded.id || !decoded.email) {
        return NextResponse.json(
          { success: false, message: "توكن غير صالح" },
          { status: 401 }
        );
      }

      // التحقق من الدور إذا محدد
      if (options.requiredRole && decoded.role !== options.requiredRole) {
        return NextResponse.json(
          { success: false, message: "صلاحيات غير كافية" },
          { status: 403 }
        );
      }

      // إرفاق بيانات المستخدم في request
      const requestWithUser = req as NextRequest & { user: UserPayload };
      requestWithUser.user = decoded;

      // تمرير الطلب
      return NextResponse.next();
    } catch (error: any) {
      console.error("‼ خطأ في المصادقة:", error.message);

      if (error.name === "TokenExpiredError") {
        return NextResponse.json(
          { success: false, message: "انتهت صلاحية الجلسة" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, message: "توكن غير صالح" },
        { status: 401 }
      );
    }
  };
};