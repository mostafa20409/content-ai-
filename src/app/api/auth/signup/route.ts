// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // التحقق من صحة البيانات
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "صيغة البريد الإلكتروني غير صحيحة" },
        { status: 400 }
      );
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون على الأقل 6 أحرف" },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم مسبقاً
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء مستخدم جديد مع تفعيله تلقائياً
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: true, // ✅ الحساب مفعل تلقائياً
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        createdAt: true
      }
    });

    // إنشاء token للمستخدم (اختياري)
    // const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json(
      { 
        message: "تم إنشاء الحساب بنجاح", 
        user: newUser,
        // token: token // إذا كنت تستخدم JWT
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    
    // معالجة أخطاء Prisma المختلفة
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء إنشاء الحساب" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// دالة للتحقق من صحة البريد الإلكتروني (يمكن نقلها لأداة مساعدة)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}