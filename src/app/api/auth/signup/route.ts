// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";

// دالة مساعدة للتحقق من البريد الإلكتروني
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// دالة مساعدة للتحقق من كلمة المرور
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function POST(req: Request) {
  // إضافة headers للتحكم في CORS مباشرة
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // معالجة سريعة للطلب
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "بيانات الطلب غير صحيحة" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const { name, email, password, confirmPassword, phone } = body;

    // تحقق سريع من البيانات
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة يجب ملؤها" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "كلمتا المرور غير متطابقتين" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "صيغة البريد الإلكتروني غير صحيحة" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // اتصال بقاعدة البيانات
    try {
      await connectToDB();
    } catch (dbError) {
      console.error("❌ خطأ في الاتصال بقاعدة البيانات:", dbError);
      return NextResponse.json(
        { 
          error: "خطأ في الاتصال بالخادم",
          details: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // التحقق من البريد الإلكتروني الموجود
    const normalizedEmail = email.toLowerCase().trim();
    let existingUser;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (dbError) {
      console.error("❌ خطأ في البحث عن المستخدم:", dbError);
      return NextResponse.json(
        { 
          error: "خطأ في معالجة الطلب",
          details: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { 
          status: 409,
          headers: corsHeaders
        }
      );
    }

    // التحقق من رقم الهاتف إذا كان موجوداً
    if (phone && phone.trim() !== "") {
      let existingPhoneUser;
      try {
        existingPhoneUser = await User.findOne({ phone: phone.trim() });
      } catch (dbError) {
        console.error("❌ خطأ في البحث برقم الهاتف:", dbError);
        // نستمر في التنفيذ لأن رقم الهاتف اختياري
      }
      
      if (existingPhoneUser) {
        return NextResponse.json(
          { error: "رقم الهاتف مسجل بالفعل" },
          { 
            status: 409,
            headers: corsHeaders
          }
        );
      }
    }

    // تشفير كلمة المرور
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("❌ خطأ في تشفير كلمة المرور:", hashError);
      return NextResponse.json(
        { 
          error: "خطأ في معالجة البيانات",
          details: process.env.NODE_ENV === 'development' ? (hashError as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // إنشاء مستخدم جديد
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
      active: true,
      role: "user",
      lastLogin: new Date(),
    });

    try {
      await newUser.save();
    } catch (saveError) {
      console.error("❌ خطأ في حفظ المستخدم:", saveError);
      return NextResponse.json(
        { 
          error: "خطأ في إنشاء الحساب",
          details: process.env.NODE_ENV === 'development' ? (saveError as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // التحقق من وجود JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET غير معروف في البيئة");
      return NextResponse.json(
        { error: "خطأ في إعدادات الخادم" },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // إنشاء token
    let token;
    try {
      token = jwt.sign(
        {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        jwtSecret,
        {
          expiresIn: 60 * 60 * 24 * 7 // 7 أيام بالثواني
        }
      );
    } catch (jwtError) {
      console.error("❌ خطأ في إنشاء التوكن:", jwtError);
      return NextResponse.json(
        { 
          error: "خطأ في إنشاء الجلسة",
          details: process.env.NODE_ENV === 'development' ? (jwtError as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // إنشاء الرد وإضافة الـ cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "تم إنشاء الحساب بنجاح",
        redirect: "/dashboard",
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
      { 
        status: 201,
        headers: corsHeaders
      }
    );

    // إضافة الـ cookie إلى الرد
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });

    return response;

  } catch (error: any) {
    console.error("❌ خطأ غير متوقع في إنشاء الحساب:", error.message);
    
    return NextResponse.json(
      { 
        error: "حدث خطأ غير متوقع في الخادم",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

// إضافة handler لـ OPTIONS للتعامل مع CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// إضافة GET handler للتحقق من صحة الـ endpoint
export async function GET() {
  return NextResponse.json(
    { 
      message: "Signup endpoint is working",
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    }
  );
}