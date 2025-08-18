// app/api/login/route.ts
import { NextResponse } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";
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
function createJWT(payload: object) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET غير معرف");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  } as SignOptions);
}

export async function POST(req: Request) {
  try {
    // 1️⃣ Rate limit check
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("remote-addr") ||
      "127.0.0.1";
    await limiter.check(5, ip);

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
    if (!user || !user.active) {
      return NextResponse.json(
        { error: "المستخدم غير موجود أو غير مفعل" },
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

    // 7️⃣ حفظ الكوكي
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "86400", 10),
    });

    // 8️⃣ تحديث آخر تسجيل دخول
    user.updatedAt = new Date();
    await user.save({ validateBeforeSave: false });

    // 9️⃣ الرد
    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        redirect: "/dashboard",
        user: tokenPayload,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.type === "limit") {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها، حاول لاحقاً" },
        { status: 429 }
      );
    }
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم", details: error.message },
      { status: 500 }
    );
  }
}