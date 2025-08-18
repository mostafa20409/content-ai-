import { NextResponse } from "next/server";
import OpenAI from "openai";

// ✅ إنشاء عميل OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// ✅ إعداد خريطة لتتبع معدل الطلبات (Rate Limit)
const globalAny = global as any;
if (!globalAny.__AD_RATE_MAP) {
  globalAny.__AD_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
}
const RATE_LIMIT = { MAX: 10, WINDOW: 60 * 1000 }; // 10 طلبات في الدقيقة

function checkRateLimit(ip: string) {
  const now = Date.now();
  const rec = globalAny.__AD_RATE_MAP.get(ip);
  if (!rec || now > rec.resetAt) {
    globalAny.__AD_RATE_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT.WINDOW });
    return false;
  }
  rec.count++;
  if (rec.count > RATE_LIMIT.MAX) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    // ✅ التحقق من وجود مفتاح API
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "⚠️ مفتاح OpenAI API غير معرف في المتغيرات البيئية." },
        { status: 500 }
      );
    }

    // ✅ Rate Limiting حسب IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "🚫 تم تجاوز الحد المسموح للطلبات. حاول بعد قليل." },
        { status: 429 }
      );
    }

    // ✅ قراءة البيانات من الطلب
    const { product, audience, type, maxTokens, temperature } = await req.json();

    // ✅ التحقق من الحقول المطلوبة
    if (
      !product ||
      typeof product !== "string" ||
      !audience ||
      typeof audience !== "string" ||
      !type ||
      typeof type !== "string"
    ) {
      return NextResponse.json(
        { error: "❌ يرجى إدخال كل الحقول المطلوبة بشكل صحيح: product, audience, type." },
        { status: 400 }
      );
    }

    // ✅ الإعدادات الافتراضية
    const max_tokens =
      typeof maxTokens === "number" && maxTokens > 0 && maxTokens <= 300
        ? maxTokens
        : 150;

    const temp =
      typeof temperature === "number" && temperature >= 0 && temperature <= 1
        ? temperature
        : 0.7;

    // ✅ تخصيص الـ prompt حسب نوع المنصة
    const prompt = `
      اكتب إعلانًا تسويقيًا جذابًا، مختصرًا، وفعالًا مخصصًا لمنصة "${type}" 
      لمنتج اسمه "${product}"، موجه للجمهور التالي: ${audience}.
      اجعل النص مناسبًا لطبيعة المنصة، مع لمسة إبداعية وCTA واضح.
    `;

    // ✅ استدعاء OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مساعد ذكي متخصص في كتابة الإعلانات التسويقية." },
        { role: "user", content: prompt },
      ],
      max_tokens,
      temperature: temp,
    });

    const adText = response.choices?.[0]?.message?.content?.trim();

    if (!adText) {
      return NextResponse.json(
        { error: "⚠️ لم يتمكن النظام من توليد الإعلان بنجاح." },
        { status: 500 }
      );
    }

    // ✅ الرد بنجاح
    return NextResponse.json({ adText }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in /api/generate-ad:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء توليد الإعلان. يرجى المحاولة لاحقًا.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
