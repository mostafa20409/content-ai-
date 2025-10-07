// app/api/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rateLimit";

// التحقق من وجود متغيرات البيئة الضرورية
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET غير معرف في متغيرات البيئة");
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI غير معرف في متغيرات البيئة");
}

// دالة لإنشاء JWT token
function createJWT(payload: object): string {
  const secret = process.env.JWT_SECRET as string;
  
  return jwt.sign(payload, secret, { 
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256"
  } as jwt.SignOptions);
}

// دالة مساعدة للتحقق من اتصال قاعدة البيانات
async function ensureDBConnection() {
  try {
    await connectToDB();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// دالة محسنة للتحقق من كلمات المرور مع دعم الترقية
async function verifyPassword(inputPassword: string, storedPassword: string, userId: string): Promise<boolean> {
  try {
    // إذا كانت كلمة المرور مخزنة كنص عادي (للمستخدمين القدامى)
    if (!storedPassword.startsWith('$2b$') && !storedPassword.startsWith('$2a$')) {
      console.log('🔓 Plain text password detected, comparing directly');
      const isMatch = inputPassword === storedPassword;
      
      // إذا تطابقت، قم بتحديثها إلى bcrypt
      if (isMatch) {
        console.log('🔄 Upgrading plain text password to bcrypt');
        const hashedPassword = await bcrypt.hash(inputPassword, 10);
        await User.updateOne(
          { _id: userId }, 
          { $set: { password: hashedPassword } }
        ).catch(err => console.error('Error updating password:', err));
      }
      return isMatch;
    }
    
    // استخدام bcrypt للمستخدمين الجدد
    const isMatch = await bcrypt.compare(inputPassword, storedPassword);
    console.log('🔐 BCrypt comparison result:', isMatch);
    return isMatch;
    
  } catch (error) {
    console.error('❌ Password verification error:', error);
    
    // المحاولة الأخيرة: إذا كانت كلمة المرور غير مشفرة (نص عادي)
    if (inputPassword === storedPassword) {
      console.log('🔓 Plain text password match detected');
      return true;
    }
    
    return false;
  }
}

// POST handler لتسجيل الدخول
export async function POST(req: NextRequest) {
  // إضافة headers للتحكم في CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  // التحقق من اتصال قاعدة البيانات أولاً
  const dbConnected = await ensureDBConnection();
  if (!dbConnected) {
    return NextResponse.json(
      { error: "تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت وإعدادات قاعدة البيانات." },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    // 🔍 DEBUG: سجل محاولة تسجيل الدخول
    console.log('🔍 Login attempt received');

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
            ...corsHeaders,
            'Retry-After': ipRateLimit.resetTime ? Math.ceil((ipRateLimit.resetTime - Date.now()) / 1000).toString() : '900'
          }
        }
      );
    }

    // التحقق السريع من الطلب
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "يجب أن يكون نوع المحتوى application/json" },
        { status: 400, headers: corsHeaders }
      );
    }

    // معالجة الجسم مباشرة
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "تنسيق JSON غير صالح في الجسم المرسل" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // 🔍 DEBUG: سجل البيانات المستلمة
    console.log('📨 Request body received:', { 
      email: body.email, 
      hasPassword: !!body.password,
      passwordLength: body.password ? body.password.length : 0 
    });
    
    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400, headers: corsHeaders }
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
            ...corsHeaders,
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
        { status: 400, headers: corsHeaders }
      );
    }

    // البحث عن المستخدم باستخدام البريد المعالج (تطبيع البريد)
    const normalizedEmail = email.toLowerCase().trim();
    
    // 🔍 DEBUG: سجل البحث عن المستخدم
    console.log('🔎 Searching for user with email:', normalizedEmail);
    
    const user = await User.findOne({ email: normalizedEmail })
      .select("+password +active +lastLogin +role +name");

    // 🔍 DEBUG: سجل نتيجة البحث
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('📋 User details:', {
        id: user._id,
        email: user.email,
        active: user.active,
        hasPassword: !!user.password,
        passwordStartsWithBcrypt: user.password ? user.password.startsWith('$2') : false
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "الحساب غير مفعل، يرجى التواصل مع الدعم" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 🔍 DEBUG: أضف قبل التحقق من كلمة المرور
    console.log('🔐 Input password length:', password.length);
    console.log('💾 Stored password exists:', !!user.password);
    if (user.password) {
      console.log('💾 Stored password length:', user.password.length);
      console.log('🔍 Stored starts with $2b$:', user.password.startsWith('$2b$'));
      console.log('🔍 Stored starts with $2a$:', user.password.startsWith('$2a$'));
    }

    // التحقق من كلمة المرور باستخدام الدالة المحسنة
    const isMatch = await verifyPassword(password, user.password, user._id.toString());
    
    // 🔍 DEBUG: سجل نتيجة المقارنة
    console.log('✅ Password match result:', isMatch);

    if (!isMatch) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401, headers: corsHeaders }
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
    user.save({ validateBeforeSave: false }).catch(err => 
      console.error('Error updating last login:', err)
    );

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
    }, { 
      status: 200,
      headers: corsHeaders 
    });

    // تعيين الكوكي في الاستجابة
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    // 🔍 DEBUG: سجل نجاح عملية التسجيل
    console.log('🎉 Login successful for user:', user.email);
    
    return response;

  } catch (error: any) {
    // 🔍 DEBUG: سجل الخطأ المفصل
    console.error("❌ Unexpected error in login route:", error);
    console.error("📋 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // تقديم رسالة خطأ أكثر وضوحاً
    let errorMessage = "حدث خطأ غير متوقع في الخادم";
    if (error.name === "MongoServerSelectionError") {
      errorMessage = "تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت وإعدادات قاعدة البيانات.";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS handler للتعامل مع طلبات CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}