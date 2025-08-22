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

    // تحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "صيغة البريد الإلكتروني غير صحيحة" },
        { status: 400 }
      );
    }

    await connectToDB();
    const user = await User.findOne({ email });

    // عدم الكشف عن وجود المستخدم من عدمه لأسباب أمنية
    if (!user) {
      // إرجاع نفس الرسالة سواء كان البريد موجوداً أم لا لأسباب أمنية
      return NextResponse.json({
        message: "إذا كان البريد مسجلاً في نظامنا، سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.",
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
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك.</p>
          <p>اضغط على الرابط التالي لإعادة التعيين (صالح لمدة 10 دقائق فقط):</p>
          <p>
            <a href="http://localhost:3000/reset-password/${resetToken}" 
               style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              إعادة تعيين كلمة المرور
            </a>
          </p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "إذا كان البريد مسجلاً في نظامنا، سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}