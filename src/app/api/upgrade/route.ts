// مسار: app/api/upgrade/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "../../../lib/connectToDB";
import User from "../../../models/User";

export async function POST(req: Request) {
  try {
    // 1- جلب التوكن من الكوكيز
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "⚠ لم يتم العثور على التوكن. يرجى تسجيل الدخول." },
        { status: 401 }
      );
    }

    // 2- التحقق من صحة التوكن
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "🔒 التوكن غير صالح أو منتهي الصلاحية." },
        { status: 403 }
      );
    }

    // 3- قراءة بيانات الباقة الجديدة من الطلب
    const { newPlan } = await req.json();
    if (!newPlan || !["free", "pro", "premium"].includes(newPlan)) {
      return NextResponse.json(
        { error: "📋 يرجى إدخال باقة صحيحة (free / pro / premium)." },
        { status: 400 }
      );
    }

    // 4- الاتصال بقاعدة البيانات
    await connectToDB();

    // 5- البحث عن المستخدم
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json(
        { error: "🚫 المستخدم غير موجود." },
        { status: 404 }
      );
    }

    // 6- تحديث الباقة
    user.subscription = newPlan;
    // لو lastUpgrade مش موجودة في الـ Schema، لازم تضيفها
    (user as any).lastUpgrade = new Date();
    await user.save();

    // 7- إرجاع النتيجة
    return NextResponse.json({
      message: `✅ تم ترقية الحساب إلى باقة ${newPlan} بنجاح.`,
      plan: user.subscription,
      lastUpgrade: (user as any).lastUpgrade,
    });
  } catch (err) {
    console.error("Upgrade API error:", err);
    return NextResponse.json(
      { error: "❌ حدث خطأ أثناء ترقية الحساب." },
      { status: 500 }
    );
  }
}
