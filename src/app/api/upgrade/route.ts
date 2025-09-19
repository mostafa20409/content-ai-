// app/api/upgrade/route.ts
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
    const { plan, limits } = await req.json();
    if (!plan || !["free", "pro", "premium"].includes(plan)) {
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

    // 6- التحقق إذا كان المستخدم يحاول التخفيض من خطته
    const currentPlanLevel = { free: 0, pro: 1, premium: 2 }[user.subscription];
    const newPlanLevel = { free: 0, pro: 1, premium: 2 }[plan];
    
    if (newPlanLevel < currentPlanLevel) {
      return NextResponse.json(
        { error: "⚠ لا يمكنك التخفيض من خطتك الحالية. يرجى التواصل مع الدعم." },
        { status: 400 }
      );
    }

    // 7- تحديث الباقة والحدود
    user.subscription = plan;
    
    // استخدام الحدود الممررة أو الحدود الافتراضية للباقة
    user.subscriptionLimits = limits || {
      'free': { coverGeneration: 0, imageGeneration: 0, booksPerMonth: 5, wordsPerMonth: 10000 },
      'pro': { coverGeneration: 10, imageGeneration: 50, booksPerMonth: 20, wordsPerMonth: 50000 },
      'premium': { coverGeneration: -1, imageGeneration: -1, booksPerMonth: -1, wordsPerMonth: -1 }
    }[plan];

    user.lastUpgrade = new Date();
    await user.save();

    // 8- إرجاع النتيجة
    return NextResponse.json({
      message: `✅ تم ترقية الحساب إلى باقة ${plan} بنجاح.`,
      subscription: user.subscription,
      limits: user.subscriptionLimits,
      lastUpgrade: user.lastUpgrade,
    });
  } catch (err) {
    console.error("Upgrade API error:", err);
    return NextResponse.json(
      { error: "❌ حدث خطأ أثناء ترقية الحساب." },
      { status: 500 }
    );
  }
}