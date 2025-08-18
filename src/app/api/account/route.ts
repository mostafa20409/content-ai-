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

    return NextResponse.json({
      message: "✅ بيانات الحساب",
      account: user,
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

    // ✅ استخدمنا type assertion هنا
    const user = (await User.findOne({ email: decoded.email })) as any;
    if (!user) {
      return NextResponse.json(
        { error: "🚫 المستخدم غير موجود." },
        { status: 404 }
      );
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (settings) user.settings = settings;
    if (subscription && ["free", "pro", "premium"].includes(subscription)) {
      user.subscription = subscription;
    }
    user.lastUpdated = new Date();

    await user.save();

    return NextResponse.json({
      message: "✅ تم تحديث بيانات الحساب بنجاح.",
      account: user,
    });
  } catch (err) {
    console.error("Account API (PUT) error:", err);
    return NextResponse.json(
      { error: "❌ حدث خطأ أثناء تحديث بيانات الحساب." },
      { status: 500 }
    );
  }
}
