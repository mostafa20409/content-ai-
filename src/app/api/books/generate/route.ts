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

    // إعداد prompt للذكاء الاصطناعي
    const prompt = `
      Write chapter ${chapterNumber} of ${totalChapters} for a book titled "${title}".
      Description: ${description}.
      Language: ${language}.
      Make it detailed and engaging.
    `;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: "خطأ في توليد المحتوى" }, { status: 500 });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      chapter: chapterNumber,
      content,
    });
  } catch (error: any) {
    if (error?.type === "limit") {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

    console.error("Book generation error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
