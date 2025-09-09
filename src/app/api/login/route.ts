// app/api/login/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rateLimit";

// التحقق من وجود متغيرات البيئة الضرورية
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET غير معرف في متغيرات البيئة");
}

function createJWT(payload: object): string {
  const secret = process.env.JWT_SECRET as string;
  
  // استخدام الطريقة الصحيحة لإنشاء التوكن
  return jwt.sign(payload, secret, { 
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256" // تحديد الخوارزمية بشكل صريح
  } as jwt.SignOptions);
}

export async function POST(req: Request) {
  try {
    // التحقق من اتصال قاعدة البيانات أولاً
    try {
      await connectToDB();
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError);
      return NextResponse.json(
        { error: "تعذر الاتصال بقاعدة البيانات" },
        { status: 500 }
      );
    }

    // الحصول على IP العميل (لـ Rate Limiting)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // التحقق من Rate Limit بناء على IP
    const ipRateLimit = checkRateLimit(clientIp, 'ip');
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "تم تجاوز عدد المحاولات المسموحة",
          retryAfter: ipRateLimit.resetTime ? Math.ceil((ipRateLimit.resetTime - Date.now()) / 1000) : undefined
        },
        { 
          status: 429,
          headers: {
            'Retry-After': ipRateLimit.resetTime ? Math.ceil((ipRateLimit.resetTime - Date.now()) / 1000).toString() : '900'
          }
        }
      );
    }

    // التحقق السريع من الطلب
    if (req.headers.get("content-type") !== "application/json") {
      return NextResponse.json(
        { error: "يجب أن يكون نوع المحتوى application/json" },
        { status: 400 }
      );
    }

    // معالجة الجسم مباشرة
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "تنسيق JSON غير صالح في الجسم المرسل" },
        { status: 400 }
      );
    }
    
    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // التحقق من Rate Limit بناء على البريد الإلكتروني أيضاً
    const emailRateLimit = checkRateLimit(email, 'email');
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "تم تجاوز عدد المحاولات المسموحة لهذا البريد الإلكتروني",
          retryAfter: emailRateLimit.resetTime ? Math.ceil((emailRateLimit.resetTime - Date.now()) / 1000) : undefined
        },
        { 
          status: 429,
          headers: {
            'Retry-After': emailRateLimit.resetTime ? Math.ceil((emailRateLimit.resetTime - Date.now()) / 1000).toString() : '900'
          }
        }
      );
    }

    // التحقق من صيغة البريد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "صيغة البريد الإلكتروني غير صحيحة" },
        { status: 400 }
      );
    }

    // البحث عن المستخدم باستخدام البريد المعالج (تطبيع البريد)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail })
      .select("+password +active +lastLogin +role +name");

    if (!user) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "الحساب غير مفعل، يرجى التواصل مع الدعم" },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // إنشاء التوكن
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    };

    const token = createJWT(tokenPayload);
    const maxAge = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "86400", 10);

    // تحديث آخر تسجيل دخول (بدون انتظار الحفظ)
    user.lastLogin = new Date();
    user.save({ validateBeforeSave: false }).catch(console.error);

    // الرد الناجح مع تعيين الكوكي باستخدام NextResponse
    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      redirect: "/dashboard",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });

    // تعيين الكوكي في الاستجابة
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    return response;

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع في الخادم" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Auth API is working",
    timestamp: new Date().toISOString(),
  });
}