// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDB } from "../../../../lib/connectToDB"; 
import User from "../../../../models/User";

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
    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون على الأقل 8 أحرف" },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(password)) {
      return NextResponse.json(
        { error: "يجب أن تحتوي كلمة المرور على حرف كبير، حرف صغير، رقم، ورمز خاص على الأقل" },
        { status: 400 }
      );
    }

    // الاتصال بقاعدة البيانات
    await connectToDB();

    // تحقق من وجود المستخدم مسبقًا
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء مستخدم جديد مفعل على طول
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      verified: true, // ✅ مفعل مباشرة
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب وتفعيله بنجاح ✅",
        user: {
          id: newUser._id,
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