import { NextRequest, NextResponse } from "next/server";
import {connectToDB} from '../../../lib/connectToDB';
import User from '../../../models/User';
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    await connectToDB();

    // هاش التوكن المرسل
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // البحث عن المستخدم بالتوكن وصلاحية التوكن
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "رابط إعادة التعيين غير صالح أو انتهت صلاحيته" }, { status: 400 });
    }

    // تحديث كلمة المرور وحذف التوكن وتاريخ الانتهاء
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "تم تحديث كلمة المرور بنجاح." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث كلمة المرور" }, { status: 500 });
  }
}