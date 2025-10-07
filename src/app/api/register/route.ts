// app/api/register/route.ts
import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";
import { z } from "zod";

// التحقق من وجود متغيرات البيئة الضرورية
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET غير معرف في متغيرات البيئة");
}

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

// مخطط Zod للتحقق من البيانات
const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "الاسم يجب أن يحتوي على الأقل على حرفين" })
    .max(50, { message: "الاسم لا يجب أن يتجاوز 50 حرفًا" })
    .transform((s) => s.trim()),
  email: z
    .string()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .transform((s) => s.toLowerCase().trim()),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تحتوي على الأقل على 8 أحرف" }),
  confirmPassword: z.string(),
  phone: z
    .string()
    .optional()
    .transform((s) => s?.trim() || "")
    .refine(
      (phone) => !phone || /^\+?[0-9]{8,15}$/.test(phone),
      { message: "رقم الهاتف غير صحيح" }
    ),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  }
);

// دالة محسنة لإنشاء JWT token
function createJWT(payload: object): string {
  const secret = process.env.JWT_SECRET as string;
  
  // استخدام any لتجاوز مشاكل TypeScript مع jsonwebtoken
  const options: any = {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    algorithm: "HS256",
    issuer: process.env.JWT_ISSUER || "your-app",
    audience: process.env.JWT_AUDIENCE || "your-app-client",
  };
  
  return jwt.sign(payload, secret, options);
}

export async function POST(req: NextRequest) {
  // إضافة headers للتحكم في CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // التحقق من المعدل
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة" },
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

    // التحقق من نوع المحتوى
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "يجب أن يكون نوع المحتوى application/json" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

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

    // 🔍 DEBUG: سجل محاولة التسجيل
    console.log('🔍 Register attempt:', { 
      name: body.name?.substring(0, 3) + '...', 
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length 
    });

    // التحقق من البيانات باستخدام Zod
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      // تجميع الأخطاء في كائن واحد
      const fieldErrors: Record<string, string> = {};
      errors.forEach(error => {
        fieldErrors[error.field] = error.message;
      });

      return NextResponse.json(
        {
          error: "خطأ في التحقق من البيانات",
          details: errors,
          message: "الرجاء مراجعة البيانات المقدمة",
          fieldErrors: fieldErrors
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const { name, email, password, phone } = parsed.data;

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
      console.log('❌ User already exists:', normalizedEmail);
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
      hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ Password hashed successfully');
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

    // 🔍 DEBUG: قبل حفظ المستخدم
    console.log('💾 Creating user with:', {
      name: name.trim(),
      email: normalizedEmail,
      hashedPassword: !!hashedPassword,
      phone: phone || 'not provided'
    });

    try {
      await newUser.save();
      console.log('✅ User saved successfully:', newUser._id);
    } catch (saveError: any) {
      console.error("❌ خطأ في حفظ المستخدم:", saveError);
      
      // تحسين رسالة الخطأ
      let errorMessage = "خطأ في إنشاء الحساب";
      if (saveError.code === 11000) {
        errorMessage = "البريد الإلكتروني أو رقم الهاتف مسجل بالفعل";
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? saveError.message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // إنشاء token باستخدام الدالة المحسنة
    let token;
    try {
      const tokenPayload = {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      };

      token = createJWT(tokenPayload);
      console.log('✅ JWT token created successfully');
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

    // حساب وقت انتهاء الكوكي (7 أيام افتراضياً)
    const cookieMaxAge = 60 * 60 * 24 * 7; // 7 أيام بالثواني

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
          phone: newUser.phone,
          createdAt: newUser.createdAt,
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
      maxAge: cookieMaxAge,
    });

    console.log('🎉 Registration completed successfully for:', newUser.email);
    return response;

  } catch (error: any) {
    console.error("❌ خطأ غير متوقع في إنشاء الحساب:", error);
    
    return NextResponse.json(
      { 
        error: "حدث خطأ غير متوقع في الخادم",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: corsHeaders
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
      message: "Register endpoint is working",
      timestamp: new Date().toISOString(),
      features: [
        "Zod validation",
        "Rate limiting", 
        "Password hashing",
        "JWT token generation",
        "CORS support",
        "Phone number validation"
      ]
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