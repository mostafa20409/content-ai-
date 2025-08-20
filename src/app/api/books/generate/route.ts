// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '../../../../lib/connectToDB';
import User from '../../../../models/User';
import rateLimit from '../../../../lib/rateLimit';

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 دقيقة
  uniqueTokenPerInterval: 500,
});

// تكوين DeepSeek API
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEEPSEEK_CHAT_ENDPOINT = '/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await limiter.check(10, ip);

    // التحقق من تسجيل الدخول
    const token = (await cookies()).get("token")?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    await connectToDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const { title, description, language, chapterNumber, totalChapters } = await req.json();
    if (!title || !description || !language) {
      return NextResponse.json({ error: "كل الحقول مطلوبة" }, { status: 400 });
    }

    // التحقق من وجود مفتاح DeepSeek API
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح DeepSeek API غير موجود" },
        { status: 500 }
      );
    }

    // إعداد prompt للذكاء الاصطناعي
    const prompt = language === 'ar' 
      ? `
        اكتب الفصل ${chapterNumber} من ${totalChapters} لكتاب بعنوان "${title}".
        الوصف: ${description}.
        اللغة: العربية.
        اجعل المحتوى مفصلاً وجذاباً ومناسباً للقارئ العربي.
      `
      : `
        Write chapter ${chapterNumber} of ${totalChapters} for a book titled "${title}".
        Description: ${description}.
        Language: English.
        Make it detailed and engaging for the target audience.
      `;

    // استخدام DeepSeek API بدلاً من OpenAI
    const aiRes = await fetch(`${DEEPSEEK_API_BASE}${DEEPSEEK_CHAT_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // يمكنك تغيير النموذج حسب الحاجة
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("DeepSeek API error:", aiRes.status, errorText);
      
      let errorMessage = "خطأ في توليد المحتوى";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }

      return NextResponse.json(
        { error: `خطأ في توليد المحتوى: ${errorMessage}` },
        { status: aiRes.status }
      );
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content) {
      return NextResponse.json(
        { error: "لم يتم توليد محتوى، يرجى المحاولة مرة أخرى" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter: chapterNumber,
      content,
      model: data.model,
    });
  } catch (error: any) {
    if (error?.type === "limit") {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

    console.error("Book generation error:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}