// مسار: app/api/generate-ad/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "../../../lib/connectToDB";
import User from "../../../models/User";

// ✅ إعداد خريطة لتتبع معدل الطلبات (Rate Limit)
const globalAny: any = global;
if (!globalAny.__AD_RATE_MAP) {
  globalAny.__AD_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
}
const RATE_LIMIT = { MAX: 20, WINDOW: 60 * 1000 }; 

// ✅ تكوين Groq API
const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_CHAT_ENDPOINT = '/chat/completions';

// ✅ نماذج API المحدثة
const API_MODELS = {
  groq: 'llama-3.1-8b-instant', 
  deepseek: 'deepseek-chat',
  openai: 'gpt-4'
};

// ✅ أنواع المنصات المتاحة
const PLATFORM_TYPES = {
  facebook: 'فيسبوك',
  instagram: 'انستغرام',
  twitter: 'تويتر',
  tiktok: 'تيك توك',
  linkedin: 'لينكد إن',
  youtube: 'يوتيوب',
  google: 'إعلانات جوجل'
} as const;

// ✅ أنواع تحليل السوق
interface MarketAnalysis {
  competitors: Competitor[];
  trends: string[];
  audienceInsights: string[];
  recommendations: string[];
  socialMediaTrends: SocialMediaTrend[];
}

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  adExamples: string[];
}

interface SocialMediaTrend {
  platform: string;
  trendingContent: string[];
  engagementRate: number;
  popularHashtags: string[];
}

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
        model: API_MODELS.groq,
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
  category: string = "تكنولوجيا",
  researchDepth: 'basic' | 'advanced' = 'basic'
): Promise<{features: string[], benefits: string[], tags: string[]}> {
  
  try {
    // محاكاة البحث عن معلومات المنتج
    const delay = researchDepth === 'basic' ? 500 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // بيانات افتراضية بناءً على نوع المنتج
    const productData: Record<string, {features: string[], benefits: string[], tags: string[]}> = {
      تكنولوجيا: {
        features: ["أحدث التقنيات", "تصميم مبتكر", "واجهة سهلة الاستخدام", "أداء عالي"],
        benefits: ["توفير الوقت", "زيادة الإنتاجية", "تجربة مستخدم متميزة", "كفاءة عالية"],
        tags: ["#تكنولوجيا", "#ابتكار", "#حديث", "#تقنية"]
      },
      موضة: {
        features: ["تصميم عصري", "خامات عالية الجودة", "ألوان متنوعة", "قطع فريدة"],
        benefits: ["تعزيز الثقة", "إبراز الشخصية", "مظهر جذاب", "أناقة دائمة"],
        tags: ["#موضة", "#أناقة", "#جمال", "#أزياء"]
      },
      طعام: {
        features: ["مكونات طازجة", "وصفات مميزة", "نكهات فريدة", "جودة عالية"],
        benefits: ["صحة أفضل", "تجربة طعم ممتعة", "توفير الوقت", "نكهة لا تُنسى"],
        tags: ["#طعام", "#صحي", "#لذيذ", "#مذاق"]
      },
      صحة: {
        features: ["مكونات طبيعية", "خالية من المواد الضارة", "معتمدة علمياً", "فعالة"],
        benefits: ["تحسين الصحة", "نمط حياة أفضل", "طاقة متجددة", "عافية دائمة"],
        tags: ["#صحة", "#عافية", "#طبيعي", "#wellness"]
      }
    };

    return productData[category] || {
      features: ["جودة عالية", "سعر مناسب", "تصميم مميز", "أداء متميز"],
      benefits: ["تلبية الاحتياجات", "تجربة مرضية", "قيمة مضافة", "رضا تام"],
      tags: ["#منتج", "#جديد", "#مميز", "#مبتكر"]
    };
  } catch (error) {
    console.error('Product research error:', error);
    return { features: [], benefits: [], tags: [] };
  }
}

// ✅ دالة إنشاء الـ prompt المتقدم للإعلانات
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
    - End with clear call to action
    - Use proper Arabic language suitable for the platform

    ## Important Notes:
    - Avoid unrealistic exaggeration
    - Focus on platform-appropriate copywriting
    - Maintain logical flow
    - Keep the text smooth and natural
  `;
}

// ✅ دالة إنشاء prompt لتحليل السوق
function createMarketAnalysisPrompt(
  product: string,
  audience: string,
  platform: string,
  language: string
): string {
  
  const isArabic = language === 'ar';
  const platformName = PLATFORM_TYPES[platform as keyof typeof PLATFORM_TYPES] || platform;

  return isArabic ? `
    # مهمة تحليل السوق والمنافسين
    ## المنتج: ${product}
    ## الجمهور المستهدف: ${audience}
    ## المنصة: ${platformName}

    ## المطلوب:
    1. حدد 3 منافسين رئيسيين في هذا المجال مع تحليل نقاط القوة والضعف لكل منهم
    2. حدد 5 اتجاهات سوقية حالية ذات صلة بالمنتج
    3. حلل اتجاهات وسائل التواصل الاجتماعي الخاصة بهذا المجال، بما في ذلك:
       - المحتوى الرائج على YouTube والتيك توك
       - الهاشتاقات الشائعة
       - معدلات التفاعل
    4. قدم 5 توصيات استراتيجية للتميز في السوق

    ## شكل الإخراج المطلوب (JSON فقط بدون أي نص إضافي):
    {
      "competitors": [
        {
          "name": "اسم المنافس",
          "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
          "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
          "adExamples": ["مثال إعلان 1", "مثال إعلان 2"]
        }
      ],
      "trends": ["اتجاه 1", "اتجاه 2", "اتجاه 3", "توجيه 4", "اتجاه 5"],
      "audienceInsights": ["رؤية 1", "رؤية 2", "رؤية 3"],
      "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4", "توصية 5"],
      "socialMediaTrends": [
        {
          "platform": "youtube",
          "trendingContent": ["موضوع 1", "موضوع 2", "موضوع 3"],
          "engagementRate": 15.5,
          "popularHashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3"]
        },
        {
          "platform": "tiktok",
          "trendingContent": ["موضوع 1", "موضوع 2", "موضوع 3"],
          "engagementRate": 18.2,
          "popularHashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3"]
        }
      ]
    }
  ` : `
    # Market and Competitor Analysis Task
    ## Product: ${product}
    ## Target Audience: ${audience}
    ## Platform: ${platformName}

    ## Requirements:
    1. Identify 3 main competitors in this field with analysis of strengths and weaknesses for each
    2. Identify 5 current market trends relevant to the product
    3. Analyze social media trends in this field, including:
       - Trending content on YouTube and TikTok
       - Popular hashtags
       - Engagement rates
    4. Provide 5 strategic recommendations to stand out in the market

    ## Required output format (JSON only without any additional text):
    {
      "competitors": [
        {
          "name": "Competitor name",
          "strengths": ["Strength 1", "Strength 2", "Strength 3"],
          "weaknesses": ["Weakness 1", "Weakness 2"],
          "adExamples": ["Ad example 1", "Ad example 2"]
        }
      ],
      "trends": ["Trend 1", "Trend 2", "Trend 3", "Trend 4", "Trend 5"],
      "audienceInsights": ["Insight 1", "Insight 2", "Insight 3"],
      "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"],
      "socialMediaTrends": [
        {
          "platform": "youtube",
          "trendingContent": ["Topic 1", "Topic 2", "Topic 3"],
          "engagementRate": 15.5,
          "popularHashtags": ["Hashtag1", "Hashtag2", "Hashtag3"]
        },
        {
          "platform": "tiktok",
          "trendingContent": ["Topic 1", "Topic 2", "Topic 3"],
          "engagementRate": 18.2,
          "popularHashtags": ["Hashtag1", "Hashtag2", "Hashtag3"]
        }
      ]
    }
  `;
}

// ✅ دالة لتحليل النص إلى structured data
function parseMarketAnalysis(text: string): MarketAnalysis {
  try {
    // محاولة استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // التأكد من وجود جميع الحقول المطلوبة
      return {
        competitors: parsed.competitors || [],
        trends: parsed.trends || [],
        audienceInsights: parsed.audienceInsights || [],
        recommendations: parsed.recommendations || [],
        socialMediaTrends: parsed.socialMediaTrends || []
      };
    }
  } catch (e) {
    console.error("Failed to parse market analysis JSON:", e);
  }

  // Fallback في حالة فشل التحليل
  return {
    competitors: [],
    trends: [],
    audienceInsights: [],
    recommendations: [],
    socialMediaTrends: []
  };
}

// ✅ دالة للتحقق من حدود الاشتراك
async function checkSubscriptionLimits(email: string, serviceType: 'ad' | 'analysis' = 'ad') {
  try {
    await connectToDB();
    const user = await User.findOne({ email });
    
    if (!user) {
      return { allowed: false, error: "المستخدم غير موجود" };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // إذا لم يكن هناك سجل للشهر الحالي، نبدأ من الصفر
    if (!user.monthlyUsage || user.monthlyUsage.month !== currentMonth || user.monthlyUsage.year !== currentYear) {
      user.monthlyUsage = {
        month: currentMonth,
        year: currentYear,
        adsGenerated: 0,
        marketAnalysis: 0
      };
      await user.save();
    }

    // تعريف حدود كل خطة
    const planLimits = {
      'free': {
        monthlyAds: 5,
        monthlyAnalysis: 0
      },
      'pro': {
        monthlyAds: 50,
        monthlyAnalysis: 10
      },
      'premium': {
        monthlyAds: -1, // -1 يعني غير محدود
        monthlyAnalysis: -1
      }
    };

    // الحصول على خطة المستخدم الحالية
    const userPlan = user.subscription || 'free';
    
    // الحصول على الحدود الحالية
    const currentLimits = planLimits[userPlan];
    
    // التحقق من الحدود
    if (serviceType === 'ad') {
      if (currentLimits.monthlyAds !== -1 && user.monthlyUsage.adsGenerated >= currentLimits.monthlyAds) {
        return { 
          allowed: false, 
          error: "SUBSCRIPTION_LIMIT_EXCEEDED",
          plan: userPlan,
          limit: currentLimits.monthlyAds,
          used: user.monthlyUsage.adsGenerated
        };
      }
    } else if (serviceType === 'analysis') {
      if (currentLimits.monthlyAnalysis !== -1 && user.monthlyUsage.marketAnalysis >= currentLimits.monthlyAnalysis) {
        return { 
          allowed: false, 
          error: "SUBSCRIPTION_LIMIT_EXCEEDED",
          plan: userPlan,
          limit: currentLimits.monthlyAnalysis,
          used: user.monthlyUsage.marketAnalysis
        };
      }
    }

    return { 
      allowed: true, 
      user,
      plan: userPlan,
      limits: currentLimits
    };
  } catch (error) {
    console.error("Subscription check error:", error);
    return { allowed: false, error: "خطأ في التحقق من الاشتراك" };
  }
}

// ✅ نقطة النهاية الرئيسية لتوليد الإعلانات
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

    // ✅ التحقق من التوكن والمستخدم
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

    // ✅ التحقق من حدود الاشتراك
    const subscriptionCheck = await checkSubscriptionLimits(decoded.email, 'ad');
    if (!subscriptionCheck.allowed) {
      return NextResponse.json(
        { 
          error: subscriptionCheck.error,
          plan: subscriptionCheck.plan,
          limit: subscriptionCheck.limit,
          used: subscriptionCheck.used
        },
        { status: 402 } // Payment Required
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
    if (includeResearch && subscriptionCheck.user.subscription !== "free") {
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
        model: API_MODELS.groq,
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

    // ✅ تحديث عدد الإعلانات المستخدمة
    if (subscriptionCheck.user) {
      subscriptionCheck.user.monthlyUsage.adsGenerated += 1;
      await subscriptionCheck.user.save();
    }

    // ✅ الرد بنجاح مع معلومات إضافية
    return NextResponse.json({ 
      adText,
      model: data.model,
      tokens: data.usage?.total_tokens,
      research: includeResearch ? researchData : undefined,
      plan: subscriptionCheck.plan,
      remainingAds: subscriptionCheck.limits.monthlyAds === -1 ? 
        'unlimited' : 
        subscriptionCheck.limits.monthlyAds - subscriptionCheck.user.monthlyUsage.adsGenerated
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

// ✅ نقطة نهاية جديدة لتحليل السوق (للمشتركين Pro وPremium فقط)
export async function POSTAnalyzeMarket(req: Request) {
  try {
    // التحقق من وجود مفتاح API
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "⚠️ مفتاح Groq API غير معرف في المتغيرات البيئية." },
        { status: 500 }
      );
    }

    // Rate Limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0] : "unknown";
    
    if (checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "🚫 تم تجاوز الحد المسموح للطلبات. حاول بعد قليل." },
        { status: 429 }
      );
    }

    // التحقق من التوكن والمستخدم
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

    // ✅ التحقق من أن المستخدم لديه اشتراك Pro أو Premium
    await connectToDB();
    const user = await User.findOne({ email: decoded.email });
    
    if (!user || user.subscription === "free") {
      return NextResponse.json(
        { error: "❌ هذه الميزة متاحة فقط للمشتركين في الخطط الاحترافية." },
        { status: 402 }
      );
    }

    // ✅ التحقق من حدود تحليلات السوق
    const subscriptionCheck = await checkSubscriptionLimits(decoded.email, 'analysis');
    if (!subscriptionCheck.allowed) {
      return NextResponse.json(
        { 
          error: subscriptionCheck.error,
          plan: subscriptionCheck.plan,
          limit: subscriptionCheck.limit,
          used: subscriptionCheck.used
        },
        { status: 402 } // Payment Required
      );
    }

    // قراءة البيانات من الطلب
    const { product, audience, type, language = "ar" } = await req.json();

    // التحقق من الحقول المطلوبة
    if (!product || typeof product !== "string") {
      return NextResponse.json(
        { error: "❌ يرجى إدخال اسم المنتج لتحليل السوق." },
        { status: 400 }
      );
    }

    // إنشاء prompt لتحليل السوق
    const prompt = createMarketAnalysisPrompt(product, audience || "عام", type || "facebook", language);

    // استدعاء Groq API لتحليل السوق
    const apiUrl = `${GROQ_API_BASE}${GROQ_CHAT_ENDPOINT}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: API_MODELS.groq,
        messages: [
          { 
            role: "system", 
            content: language === 'ar' 
              ? "أنت محلل أسواق خبير. قم بتحليل السوق والمنافسين وتقديم رؤى قيمة حول المنتج والجمهور المستهدف. قدم توصيات عملية قابلة للتنفيذ. أرجو الإخراج بصيغة JSON فقط بدون أي نص إضافي."
              : "You are an expert market analyst. Analyze the market and competitors, providing valuable insights about the product and target audience. Offer practical, actionable recommendations. Please output JSON only without any additional text."
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.5,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Groq API error:", response.status, errorText);
      
      let errorMessage = "خطأ في تحليل السوق";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }

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
    const analysisText = data.choices?.[0]?.message?.content?.trim();

    if (!analysisText) {
      return NextResponse.json(
        { error: "⚠️ لم يتمكن النظام من تحليل السوق بنجاح." },
        { status: 500 }
      );
    }

    // تحليل النتيجة إلى structured data
    const analysis = parseMarketAnalysis(analysisText);

    // ✅ تحديث عدد تحليلات السوق المستخدمة
    if (user) {
      user.monthlyUsage.marketAnalysis += 1;
      await user.save();
    }

    // الرد بنجاح مع تحليل السوق
    return NextResponse.json({ 
      analysis,
      model: data.model,
      tokens: data.usage?.total_tokens
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in market analysis:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء تحليل السوق. يرجى المحاولة لاحقًا.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ نقطة نهاية للحصول على معلومات الاشتراك
export async function GET(_req: Request) {
  try {
    // التحقق من التوكن والمستخدم
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
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "🚫 المستخدم غير موجود." },
        { status: 404 }
      );
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // إذا لم يكن هناك سجل للشهر الحالي، نبدأ من الصفر
    if (!user.monthlyUsage || user.monthlyUsage.month !== currentMonth || user.monthlyUsage.year !== currentYear) {
      user.monthlyUsage = {
        month: currentMonth,
        year: currentYear,
        adsGenerated: 0,
        marketAnalysis: 0
      };
      await user.save();
    }

    // تعريف حدود كل خطة
    const planLimits = {
      'free': { monthlyRequests: 5, marketAnalysis: 0 },
      'pro': { monthlyRequests: 50, marketAnalysis: 10 },
      'premium': { monthlyRequests: -1, marketAnalysis: -1 } // -1 يعني غير محدود
    };

    const currentPlan = user.subscription || 'free';
    const currentLimits = planLimits[currentPlan];

    return NextResponse.json({
      type: currentPlan,
      limits: currentLimits,
      usage: user.monthlyUsage,
      remainingAds: currentLimits.monthlyRequests === -1 ? 
        'unlimited' : 
        currentLimits.monthlyRequests - user.monthlyUsage.adsGenerated,
      remainingAnalysis: currentLimits.marketAnalysis === -1 ? 
        'unlimited' : 
        currentLimits.marketAnalysis - user.monthlyUsage.marketAnalysis
    });
  } catch (error: any) {
    console.error("❌ Error getting subscription info:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء جلب معلومات الاشتراك.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}