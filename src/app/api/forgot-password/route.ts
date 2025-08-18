import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "../../../lib/connectToDB";
import User from "../../../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    await connectToDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({
        message: "إذا كان البريد صحيحًا، سيتم إرسال رابط إعادة التعيين.",
      });
    }

    // إنشاء توكن إعادة تعيين جديد
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق
    await user.save();

    // إعداد nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail", // ممكن تغيرها لـ SMTP خاص بك
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // إرسال الإيميل
    await transporter.sendMail({
      from: `"دعم الموقع" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "إعادة تعيين كلمة المرور",
      html: `
        <p>لقد طلبت إعادة تعيين كلمة المرور.</p>
        <p>اضغط على الرابط التالي لإعادة التعيين (صالح لمدة 10 دقائق):</p>
        <a href="http://localhost:3000/reset-password/${resetToken}">
          إعادة تعيين كلمة المرور
        </a>
      `,
    });

    return NextResponse.json({
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
