import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "../../../lib/connectToDB";
import User from "../../../models/User";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "⚠ لم يتم العثور على التوكن. يرجى تسجيل الدخول." },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "🔒 التوكن غير صالح أو منتهي الصلاحية." },
        { status: 403 }
      );
    }

    await connectToDB();
    const user = await User.findOne({ email: decoded.email }).select("-password");
    if (!user) {
      return NextResponse.json(
        { error: "🚫 المستخدم غير موجود." },
        { status: 404 }
      );
    }

    // معالجة الإعدادات لضمان أنها كائن صالح
    let settings = {};
    try {
      settings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings || {};
    } catch (e) {
      settings = {};
    }

    // إرجاع بيانات المستخدم مع الإعدادات المعالجة
    return NextResponse.json({
      message: "✅ بيانات الحساب",
      account: {
        ...user.toObject(),
        settings
      },
    });
  } catch (err) {
    console.error("Account API (GET) error:", err);
    return NextResponse.json(
      { error: "❌ حدث خطأ أثناء جلب بيانات الحساب." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "⚠ لم يتم العثور على التوكن. يرجى تسجيل الدخول." },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "🔒 التوكن غير صالح أو منتهي الصلاحية." },
        { status: 403 }
      );
    }

    const { name, avatar, settings, subscription } = await req.json();
    await connectToDB();

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json(
        { error: "🚫 المستخدم غير موجود." },
        { status: 404 }
      );
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    
    // معالجة الإعدادات - تحويلها من string إلى object إذا لزم الأمر
    if (settings !== undefined) {
      if (typeof settings === 'string') {
        try {
          user.settings = JSON.parse(settings);
        } catch (e) {
          // إذا فشل التحويل، تخزينها ككائن يحتوي على النص الخام
          user.settings = { raw: settings };
        }
      } else {
        user.settings = settings;
      }
    }
    
    if (subscription && ["free", "pro", "premium"].includes(subscription)) {
      user.subscription = subscription;
    }
    
    user.lastUpdated = new Date();

    await user.save();

    // إرجاع بيانات المستخدم مع الإعدادات المعالجة
    return NextResponse.json({
      message: "✅ تم تحديث بيانات الحساب بنجاح.",
      account: {
        ...user.toObject(),
        settings: user.settings
      },
    });
  } catch (err) {
    console.error("Account API (PUT) error:", err);
    return NextResponse.json(
      { error: "❌ حدث خطأ أثناء تحديث بيانات الحساب." },
      { status: 500 }
    );
  }
} 