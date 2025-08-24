// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../../models/User";
import { connectToDB } from "../../../lib/mongodb"; // تأكد من صحة المسار
import { z } from "zod";

/**
 * Register route
 * - Validates input with Zod
 * - Rate limits
 * - Connects to DB, creates user (password hashing via model pre-save)
 * - Issues JWT cookie (auto-login) and returns user summary
 */

/* ---------- validation schema ---------- */
const registerSchema = z.object({
  name: z
    .string()
    .min(3, { message: "الاسم يجب أن يحتوي على الأقل على 3 أحرف" })
    .max(50, { message: "الاسم لا يجب أن يتجاوز 50 حرفًا" })
    .transform((s) => s.trim()),
  email: z
    .string()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .transform((s) => s.toLowerCase().trim()),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تحتوي على الأقل على 8 أحرف" })
    .regex(/[a-z]/, { message: "يجب أن تحتوي على حرف صغير على الأقل" })
    .regex(/[A-Z]/, { message: "يجب أن تحتوي على حرف كبير على الأقل" })
    .regex(/[0-9]/, { message: "يجب أن تحتوي على رقم على الأقل" })
    .regex(/[^a-zA-Z0-9]/, { message: "يجب أن تحتوي على رمز خاص على الأقل" }),
});

// نظام بسيط للحد من المعدل
const requestCache = new Map();
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_MS: 15 * 60 * 1000 // 15 دقيقة
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // تنظيف الطلبات القديمة
  for (const [key, timestamp] of requestCache.entries()) {
    if (timestamp < windowStart) {
      requestCache.delete(key);
    }
  }
  
  // عد الطلبات الحالية
  const requestCount = Array.from(requestCache.values()).filter(
    timestamp => timestamp >= windowStart
  ).length;
  
  if (requestCount >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  // إضافة الطلب الحالي
  requestCache.set(ip, now);
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // التحقق من المعدل
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

    // ===== ensure JSON =====
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "يجب إرسال البيانات بصيغة JSON" },
        { status: 415 }
      );
    }

    // ===== parse + validate =====
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join(".") || "field",
        message: e.message,
      }));
      return NextResponse.json(
        {
          error: "خطأ في التحقق من البيانات",
          details: errors,
          message: "الرجاء مراجعة البيانات المقدمة",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // ===== connect to DB =====
    await connectToDB();

    // ===== check existing user =====
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        {
          error: "البريد الإلكتروني مسجل بالفعل",
          suggestion: "جرب تسجيل الدخول أو استعادة كلمة المرور",
        },
        { status: 409 }
      );
    }

    // ===== create user (Mongoose pre-save يتولى تجزئة الباسورد) =====
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // ===== issue JWT cookie (auto-login) =====
    if (!process.env.JWT_SECRET) {
      // لم نولد التوكن لكن المستخدم تم إنشاؤه — هذا خطأ تهيئة
      console.error("JWT_SECRET غير معرف في env");
      return NextResponse.json(
        { error: "تكوين الخادم غير مكتمل" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: (newUser as any).role || "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        issuer: process.env.JWT_ISSUER || "your-app",
        audience: process.env.JWT_AUDIENCE || "your-app-client",
      } as jwt.SignOptions
    );

    const cookieMaxAge = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "86400", 10);

    const res = NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الحساب بنجاح",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            subscription: (newUser as any).subscription || "free",
            createdAt: newUser.createdAt,
          },
        },
      },
      { status: 201 }
    );

    // set cookie (HTTP only)
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (err: any) {
    console.error("register route error:", err);

    return NextResponse.json(
      {
        error: "حدث خطأ في الخادم",
        message: "الرجاء المحاولة مرة أخرى لاحقًا",
        ...(process.env.NODE_ENV === "development" ? { details: err.message } : {}),
      },
      { status: 500 }
    );
  }
}