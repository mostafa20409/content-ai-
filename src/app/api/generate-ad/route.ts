import { NextResponse } from "next/server";

// ✅ إعداد خريطة لتتبع معدل الطلبات (Rate Limit)
const globalAny: any = global;
if (!globalAny.__AD_RATE_MAP) {
  globalAny.__AD_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
}
const RATE_LIMIT = { MAX: 10, WINDOW: 60 * 1000 }; // 10 طلبات في الدقيقة

// ✅ تكوين DeepSeek API
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEEPSEEK_CHAT_ENDPOINT = '/v1/chat/completions';

function checkRateLimit(ip: string): boolean {
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

// ✅ دالة للتحقق من صحة DeepSeek API (بديل أكثر فعالية)
async function validateDeepSeekAPI(apiKey: string): Promise<boolean> {
  try {
    // بدلاً من التحقق من endpoint النماذج، نجرب طلباً بسيطاً
    const response = await fetch(`${DEEPSEEK_API_BASE}${DEEPSEEK_CHAT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
        stream: false
      })
    });
    
    // أي رد غير 401/403 يعني أن المفتاح صالح
    return response.status !== 401 && response.status !== 403;
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

    // ✅ Rate Limiting حسب IP (ننقله قبل التحقق من API لتجنب استنزاف الطلبات)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0] : "unknown";
    
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
      قدم الإعلان باللغة العربية الفصحى.
    `;

    // ✅ استدعاء DeepSeek API
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
          { role: "system", content: "أنت مساعد ذكي متخصص في كتابة الإعلانات التسويقية باللغة العربية. قدم إعلانات جذابة ومختصرة ومناسبة للمنصة المستهدفة." },
          { role: "user", content: prompt },
        ],
        max_tokens: max_tokens,
        temperature: temp,
        stream: false
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

      // تحسين رسائل الخطأ للمستخدم
      if (response.status === 401 || response.status === 403) {
        errorMessage = "مفتاح API غير صالح أو منتهي الصلاحية";
      } else if (response.status === 429) {
        errorMessage = "تم تجاوز الحد المسموح لطلبات API";
      } else if (response.status >= 500) {
        errorMessage = "الخادم غير متاح حالياً، يرجى المحاولة لاحقاً";
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
  // التحقق من وجود مفتاح API (بدون استخدامه)
  const hasApiKey = !!process.env.DEEPSEEK_API_KEY;
  
  return NextResponse.json({
    status: hasApiKey ? '🟢 تعمل' : '🟡 تحتاج إعداد',
    message: 'استخدم POST مع { product: "...", audience: "...", type: "..." }',
    provider: 'DeepSeek API',
    hasApiKey: hasApiKey
  });
}