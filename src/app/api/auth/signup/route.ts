// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// تعريف نوع المستخدم
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  createdAt: Date;
}

// Array مؤقت لتخزين المستخدمين مع تحديد النوع
let users: User[] = [];

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // تحقق من صحة البيانات
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // تحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "صيغة البريد الإلكتروني غير صحيحة" },
        { status: 400 }
      );
    }

    // تحقق من قوة كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون على الأقل 6 أحرف" },
        { status: 400 }
      );
    }

    // تحقق من وجود المستخدم مسبقًا
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء مستخدم جديد مفعل على طول
    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      verified: true, // ✅ مفعل مباشرة
      createdAt: new Date(),
    };

    users.push(newUser);

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب وتفعيله بنجاح ✅",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          verified: newUser.verified, // يظهر في الرد أنه مفعل
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