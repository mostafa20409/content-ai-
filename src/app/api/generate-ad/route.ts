import { NextResponse } from "next/server";

// ✅ إعداد خريطة لتتبع معدل الطلبات (Rate Limit)
const globalAny = global as any;
if (!globalAny.__AD_RATE_MAP) {
  globalAny.__AD_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
}
const RATE_LIMIT = { MAX: 10, WINDOW: 60 * 1000 }; // 10 طلبات في الدقيقة

// ✅ تكوين DeepSeek API
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEEPSEEK_CHAT_ENDPOINT = '/v1/chat/completions';

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

// ✅ دالة للتحقق من صحة DeepSeek API
async function validateDeepSeekAPI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${DEEPSEEK_API_BASE}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('❌ DeepSeek API validation failed:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // ✅ التحقق من وجود مفتاح API
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "⚠️ مفتاح DeepSeek API غير معرف في المتغيرات البيئية." },
        { status: 500 }
      );
    }

    // ✅ التحقق من صحة API
    const isAPIValid = await validateDeepSeekAPI(process.env.DEEPSEEK_API_KEY);
    if (!isAPIValid) {
      return NextResponse.json(
        { error: "❌ مشكلة في اتصال DeepSeek API. يرجى التحقق من المفتاح." },
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

    // ✅ استدعاء DeepSeek API بدلاً من OpenAI
    const apiUrl = `${DEEPSEEK_API_BASE}${DEEPSEEK_CHAT_ENDPOINT}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "أنت مساعد ذكي متخصص في كتابة الإعلانات التسويقية." },
          { role: "user", content: prompt },
        ],
        max_tokens: max_tokens,
        temperature: temp,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ DeepSeek API error:", response.status, errorText);
      
      let errorMessage = "خطأ في توليد الإعلان";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }

      return NextResponse.json(
        { error: `❌ خطأ في DeepSeek API: ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const adText = data.choices?.[0]?.message?.content?.trim();

    if (!adText) {
      return NextResponse.json(
        { error: "⚠️ لم يتمكن النظام من توليد الإعلان بنجاح." },
        { status: 500 }
      );
    }

    // ✅ الرد بنجاح مع معلومات إضافية
    return NextResponse.json({ 
      adText,
      model: data.model,
      tokens: data.usage?.total_tokens 
    }, { status: 200 });
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

// ✅ نقطة نهاية اختبارية
export async function GET() {
  return NextResponse.json({
    status: '🟢 تعمل',
    message: 'استخدم POST مع { product: "...", audience: "...", type: "..." }',
    provider: 'DeepSeek API'
  });
}