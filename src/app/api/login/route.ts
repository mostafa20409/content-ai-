// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDB } from "../../../lib/connectToDB";
import User from "../../../models/User";
import rateLimit from "../../../lib/rateLimit";

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 دقيقة
  uniqueTokenPerInterval: 500,
});

// دالة لإنشاء JWT
function createJWT(payload: object): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET غير معرف");
  }
  
  const secret = process.env.JWT_SECRET;
  
  // تحويل expiresIn إلى النوع الصحيح لـ TypeScript
  const expiresInEnv = process.env.JWT_EXPIRES_IN || "1d";
  
  // إذا كانت القيمة رقمية (مثل "86400")، تحويلها إلى رقم
  // وإلا نتركها كنص (مثل "1d")
  const expiresIn = /^\d+$/.test(expiresInEnv) 
    ? parseInt(expiresInEnv, 10) 
    : expiresInEnv;
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export async function POST(req: Request) {
  try {
    // 1️⃣ Rate limit check
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    try {
      await limiter.check(5, ip);
    } catch (rateLimitError) {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها، حاول لاحقاً" },
        { status: 429 }
      );
    }

    // 2️⃣ قراءة البيانات
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // 3️⃣ الاتصال بقاعدة البيانات
    await connectToDB();

    // 4️⃣ البحث عن المستخدم
    const user = await User.findOne({ email }).select("+password +active");
    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 401 }
      );
    }
    
    if (!user.active) {
      return NextResponse.json(
        { error: "الحساب غير مفعل، يرجى التواصل مع الدعم" },
        { status: 401 }
      );
    }

    // 5️⃣ التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // 6️⃣ إنشاء الـ JWT
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    };
    
    const token = createJWT(tokenPayload);
    const maxAge = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "86400", 10);

    // 7️⃣ حفظ الكوكي
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    // 8️⃣ تحديث آخر تسجيل دخول
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 9️⃣ الرد
    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        redirect: "/dashboard",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user"
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Login error:", error);
    
    // تجنب إرجاع تفاصيل الخطأ في production
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message 
      : "حدث خطأ في الخادم";
    
    return NextResponse.json(
      { error: "حدث خطأ في عملية التسجيل", details: errorMessage },
      { status: 500 }
    );
  }
}