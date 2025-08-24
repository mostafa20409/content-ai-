import { NextResponse } from "next/server";

// ✅ إعداد خريطة لتتبع معدل الطلبات (Rate Limit)
const globalAny: any = global;
if (!globalAny.__AD_RATE_MAP) {
  globalAny.__AD_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
}
const RATE_LIMIT = { MAX: 15, WINDOW: 60 * 1000 }; // 15 طلب في الدقيقة (تمت الزيادة)

// ✅ تكوين Groq API
const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_CHAT_ENDPOINT = '/chat/completions';

// ✅ أنواع المنصات المتاحة
const PLATFORM_TYPES = {
  FACEBOOK: 'فيسبوك',
  INSTAGRAM: 'انستغرام',
  TWITTER: 'تويتر',
  TIKTOK: 'تيك توك',
  LINKEDIN: 'لينكد إن',
  SNAPCHAT: 'سناب شات',
  YOUTUBE: 'يوتيوب',
  WHATSAPP: 'واتساب',
  GOOGLE_ADS: 'إعلانات جوجل',
  EMAIL: 'البريد الإلكتروني'
} as const;

// ✅ أنواع المنتجات
const PRODUCT_CATEGORIES = {
  TECHNOLOGY: 'تكنولوجيا',
  FASHION: 'موضة',
  FOOD: 'طعام',
  HEALTH: 'صحة',
  EDUCATION: 'تعليم',
  TRAVEL: 'سفر',
  FINANCE: 'مالية',
  REAL_ESTATE: 'عقارات',
  ENTERTAINMENT: 'ترفيه',
  AUTOMOTIVE: 'سيارات'
} as const;

// ✅ واجهة خيارات الإعلان المتقدمة
interface AdCustomization {
  tone: 'formal' | 'casual' | 'humorous' | 'inspirational' | 'urgent';
  includeEmojis: boolean;
  includeHashtags: boolean;
  callToAction: string;
  specialOffers?: string;
  brandVoice?: string;
  lengthPreference: 'short' | 'medium' | 'long';
}

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

// ✅ دالة للتحقق من صحة Groq API
async function validateGroqAPI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GROQ_API_BASE}${GROQ_CHAT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
        stream: false
      })
    });
    
    return response.status !== 401 && response.status !== 403;
  } catch (error) {
    console.error('❌ Groq API validation failed:', error);
    return false;
  }
}

// ✅ دالة البحث عن معلومات المنتج
async function fetchProductResearch(
  _product: string, 
  category: string,
  researchDepth: 'basic' | 'advanced' = 'basic'
): Promise<{features: string[], benefits: string[], tags: string[]}> {
  
  try {
    // محاكاة البحث عن معلومات المنتج
    const delay = researchDepth === 'basic' ? 500 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // بيانات افتراضية بناءً على نوع المنتج
    const productData: Record<string, {features: string[], benefits: string[], tags: string[]}> = {
      تكنولوجيا: {
        features: ["أحدث التقنيات", "تصميم مبتكر", "واجهة سهلة الاستخدام"],
        benefits: ["توفير الوقت", "زيادة الإنتاجية", "تجربة مستخدم متميزة"],
        tags: ["#تكنولوجيا", "#ابتكار", "#حديث"]
      },
      موضة: {
        features: ["تصميم عصري", "خامات عالية الجودة", "ألوان متنوعة"],
        benefits: ["تعزيز الثقة", "إبراز الشخصية", "مظهر جذاب"],
        tags: ["#موضة", "#أناقة", "#جمال"]
      },
      طعام: {
        features: ["مكونات طازجة", "وصفات مميزة", "نكهات فريدة"],
        benefits: ["صحة أفضل", "تجربة طعم ممتعة", "توفير الوقت"],
        tags: ["#طعام", "#صحي", "#لذيذ"]
      },
      صحة: {
        features: ["مكونات طبيعية", "خالية من المواد الضارة", "معتمدة علمياً"],
        benefits: ["تحسين الصحة", "نمط حياة أفضل", "طاقة متجددة"],
        tags: ["#صحة", "#عافية", "#طبيعي"] // تم إصلاح الخطأ هنا (إضافة #)
      }
    };

    return productData[category] || {
      features: ["جودة عالية", "سعر مناسب", "تصميم مميز"],
      benefits: ["تلبية الاحتياجات", "تجربة مرضية", "قيمة مضافة"],
      tags: ["#منتج", "#جديد", "#مميز"]
    };
  } catch (error) {
    console.error('Product research error:', error);
    return { features: [], benefits: [], tags: [] };
  }
}

// ✅ دالة إنشاء الـ prompt المتقدم
function createAdvancedAdPrompt(
  product: string,
  audience: string,
  type: string,
  language: string,
  researchData?: {features: string[], benefits: string[], tags: string[]},
  customization?: AdCustomization
): string {
  
  const isArabic = language === 'ar';
  const platformName = PLATFORM_TYPES[type as keyof typeof PLATFORM_TYPES] || type;

  return isArabic ? `
    # مهمة إنشاء إعلان متقدم
    ## المعلومات الأساسية:
    - المنتج: ${product}
    - الجمهور المستهدف: ${audience}
    - المنصة: ${platformName}
    - اللغة: العربية

    ## نتائج البحث عن المنتج:
    ${researchData ? `
    ### الميزات الرئيسية:
    ${researchData.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}
    
    ### الفوائد للعميل:
    ${researchData.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}
    
    ### الوسوم المقترحة:
    ${researchData.tags.join(' ')}
    ` : 'لا توجد معلومات إضافية'}

    ## تخصيص الإعلان:
    - النبرة: ${customization?.tone || 'احترافية'}
    - ${customization?.includeEmojis ? 'يتضمن إيموجيات' : 'بدون إيموجيات'}
    - ${customization?.includeHashtags ? 'يتضمن وسوم' : 'بدون وسوم'}
    - نداء العمل: ${customization?.callToAction || 'اشتري الآن'}
    - ${customization?.specialOffers ? `عروض خاصة: ${customization.specialOffers}` : 'بدون عروض خاصة'}
    - الطول: ${customization?.lengthPreference === 'short' ? 'قصير' : customization?.lengthPreference === 'long' ? 'طويل' : 'متوسط'}

    ## متطلبات الإعلان:
    - مناسب تماماً لطبيعة منصة ${platformName}
    - جذاب ومقنع للجمهور المستهدف (${audience})
    - يحتوي على نداء عمل واضح
    - يبرز فوائد المنتج الرئيسية
    - يتناسب مع النبرة المطلوبة

    ## تعليمات خاصة:
    1. ابدأ بجذب الانتباه
    2. قدم القيمة الرئيسية للمنتج
    3. أبرز الفوائد للعميل
    4. أنهِ بنداء عمل واضح
    5. استخدم لغة عربية سليمة ومناسبة للمنصة

    ## ملاحظات مهمة:
    - تجنب المبالغة غير الواقعية
    - اهتم بالتصميم النصي المناسب للمنصة
    - حافظ على التسلسل المنطقي
    - اجعل النص سلساً وطبيعياً
  ` : `
    # Advanced Ad Generation Task
    ## Basic Information:
    - Product: ${product}
    - Target Audience: ${audience}
    - Platform: ${platformName}
    - Language: Arabic

    ## Product Research Results:
    ${researchData ? `
    ### Key Features:
    ${researchData.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}
    
    ### Customer Benefits:
    ${researchData.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}
    
    ### Suggested Tags:
    ${researchData.tags.join(' ')}
    ` : 'No additional information'}

    ## Ad Customization:
    - Tone: ${customization?.tone || 'professional'}
    - ${customization?.includeEmojis ? 'Includes emojis' : 'No emojis'}
    - ${customization?.includeHashtags ? 'Includes hashtags' : 'No hashtags'}
    - Call to Action: ${customization?.callToAction || 'Buy now'}
    - ${customization?.specialOffers ? `Special offers: ${customization.specialOffers}` : 'No special offers'}
    - Length: ${customization?.lengthPreference === 'short' ? 'short' : customization?.lengthPreference === 'long' ? 'long' : 'medium'}

    ## Ad Requirements:
    - Perfectly suited for ${platformName} platform
    - Engaging and persuasive for target audience (${audience})
    - Contains clear call to action
    - Highlights key product benefits
    - Matches the requested tone

    ## Special Instructions:
    1. Start with attention-grabbing
    2. Present the product's core value
    3. Highlight customer benefits
    4. End with clear call to action
    5. Use proper Arabic language suitable for the platform

    ## Important Notes:
    - Avoid unrealistic exaggeration
    - Focus on platform-appropriate copywriting
    - Maintain logical flow
    - Keep the text smooth and natural
  `;
}

export async function POST(req: Request) {
  try {
    // ✅ التحقق من وجود مفتاح API
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "⚠️ مفتاح Groq API غير معرف في المتغيرات البيئية." },
        { status: 500 }
      );
    }

    // ✅ التحقق من صحة API key قبل المتابعة
    const isValidAPI = await validateGroqAPI(process.env.GROQ_API_KEY);
    if (!isValidAPI) {
      return NextResponse.json(
        { error: "❌ مفتاح Groq API غير صالح أو منتهي الصلاحية." },
        { status: 401 }
      );
    }

    // ✅ Rate Limiting حسب IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0] : "unknown";
    
    if (checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "🚫 تم تجاوز الحد المسموح للطلبات. حاول بعد قليل." },
        { status: 429 }
      );
    }

    // ✅ قراءة البيانات من الطلب
    const { 
      product, 
      audience, 
      type, 
      maxTokens, 
      temperature,
      category = "تكنولوجيا",
      includeResearch = true,
      customization,
      language = "ar"
    } = await req.json();

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

    // ✅ البحث عن معلومات المنتج
    let researchData: {features: string[], benefits: string[], tags: string[]} | undefined = undefined;
    if (includeResearch) {
      researchData = await fetchProductResearch(product, category, 'basic');
    }

    // ✅ الإعدادات الافتراضية
    const max_tokens =
      typeof maxTokens === "number" && maxTokens > 0 && maxTokens <= 500
        ? maxTokens
        : 200;

    const temp =
      typeof temperature === "number" && temperature >= 0 && temperature <= 1
        ? temperature
        : 0.7;

    // ✅ إنشاء الـ prompt المتقدم
    const prompt = createAdvancedAdPrompt(
      product,
      audience,
      type,
      language,
      researchData,
      customization
    );

    // ✅ استدعاء Groq API
    const apiUrl = `${GROQ_API_BASE}${GROQ_CHAT_ENDPOINT}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { 
            role: "system", 
            content: language === 'ar' 
              ? "أنت مساعد ذكي متخصص في كتابة الإعلانات التسويقية باللغة العربية. قدم إعلانات جذابة ومختصرة ومناسبة للمنصة المستهدفة مع مراعاة التخصيص المطلوب."
              : "You are an AI assistant specialized in writing Arabic marketing ads. Provide engaging, concise ads suitable for the target platform while considering the requested customization."
          },
          { role: "user", content: prompt },
        ],
        max_tokens: max_tokens,
        temperature: temp,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Groq API error:", response.status, errorText);
      
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
        { error: `❌ خطأ في Groq API: ${errorMessage}` },
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
      tokens: data.usage?.total_tokens,
      research: includeResearch ? researchData : undefined
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
  const hasApiKey = !!process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    status: hasApiKey ? '🟢 تعمل' : '🟡 تحتاج إعداد',
    message: 'استخدم POST مع { product: "...", audience: "...", type: "..." }',
    provider: 'Groq API',
    hasApiKey: hasApiKey,
    platformTypes: PLATFORM_TYPES,
    productCategories: PRODUCT_CATEGORIES
  });
}