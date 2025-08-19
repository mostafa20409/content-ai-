// app/api/auth/signup/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Array مؤقت عشان نخزن فيه اليوزرز
let users = [];

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
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء مستخدم جديد
    const newUser = {
      id: Date.now(), // id بسيط
      name,
      email,
      password: hashedPassword,
      verified: true,
      createdAt: new Date(),
    };

    // إضافة المستخدم للـ array
    users.push(newUser);

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          verified: newUser.verified,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}