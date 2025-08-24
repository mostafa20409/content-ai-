// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

// تحقق من صحة البيانات
const generateSchema = z.object({
  researchData: z.record(z.string(), z.array(z.any())),
  topic: z.string().min(2).max(200),
  language: z.enum(['ar', 'en']).default('ar'),
  tone: z.enum(['professional', 'casual', 'friendly', 'academic', 'informative', 'persuasive']).default('professional'),
  contentType: z.enum(['article', 'video_script', 'social_media', 'email', 'blog_post', 'summary']).default('article'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  targetAudience: z.enum(['general', 'experts', 'students', 'business', 'technical']).default('general')
});

// إعدادات التوليد
const GENERATION_CONFIG = {
  maxTokens: {
    short: 500,
    medium: 1000,
    long: 2000
  },
  temperature: 0.7,
  timeout: 30000 // 30 ثانية
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { researchData, topic, language, tone, contentType, length, targetAudience } = generateSchema.parse(body);

    // التحقق من وجود بيانات البحث
    if (!researchData || Object.keys(researchData).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: language === 'ar' 
            ? 'بيانات البحث مطلوبة لتوليد المحتوى' 
            : 'Research data is required to generate content'
        },
        { status: 400 }
      );
    }

    // توليد المحتوى
    const generatedContent = await generateContent({
      researchData,
      topic,
      language,
      tone,
      contentType,
      length,
      targetAudience // تم التصحيح هنا
    });

    return NextResponse.json({
      success: true,
      content: generatedContent,
      metadata: {
        topic,
        language,
        tone,
        contentType,
        length,
        targetAudience,
        generatedAt: new Date().toISOString(),
        sourcesUsed: Object.keys(researchData)
      }
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// واجهة معاملات التوليد - تم التصحيح هنا
interface GenerationParams {
  researchData: any;
  topic: string;
  language: string;
  tone: string;
  contentType: string;
  length: string;
  targetAudience: string; // تم تغيير من audience إلى targetAudience
}

// دالة مساعدة لتوليد المحتوى
async function generateContent(params: GenerationParams): Promise<string> {
  const { length } = params;
  
  const prompt = createIntelligentPrompt(params);
  
  try {
    // محاولة استخدام Groq أولاً (الأولوية الأساسية)
    if (process.env.GROQ_API_KEY) {
      return await generateWithGroq(prompt, length);
    }
    
    // ثم محاولة استخدام DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      return await generateWithDeepSeek(prompt, length);
    }
    
    // ثم محاولة استخدام OpenAI
    if (process.env.OPENAI_API_KEY) {
      return await generateWithOpenAI(prompt, length);
    }
    
    // إذا لم توجد أي مفاتيح API، نعود بمحتوى بديل
    return generateFallbackContent(params);
    
  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackContent(params);
  }
}

// إنشاء prompt ذكي بناء على معطيات البحث
function createIntelligentPrompt(params: GenerationParams): string {
  const { researchData, topic, language, tone, contentType, targetAudience } = params; // تم التصحيح هنا
  
  const researchSummary = summarizeResearchData(researchData, language);
  
  const contentTypes = {
    article: language === 'ar' ? 'مقال' : 'article',
    video_script: language === 'ar' ? 'نص فيديو' : 'video script',
    social_media: language === 'ar' ? 'منشور وسائل تواصل اجتماعي' : 'social media post',
    email: language === 'ar' ? 'بريد إلكتروني' : 'email',
    blog_post: language === 'ar' ? 'مدونة' : 'blog post',
    summary: language === 'ar' ? 'ملخص' : 'summary'
  };
  
  const tones = {
    professional: language === 'ar' ? 'احترافي' : 'professional',
    casual: language === 'ar' ? 'عامي' : 'casual',
    friendly: language === 'ar' ? 'ودي' : 'friendly',
    academic: language === 'ar' ? 'أكاديمي' : 'academic',
    informative: language === 'ar' ? 'إعلامي' : 'informative',
    persuasive: language === 'ar' ? 'إقناعي' : 'persuasive'
  };
  
  const audiences = {
    general: language === 'ar' ? 'عام' : 'general',
    experts: language === 'ar' ? 'خبراء' : 'experts',
    students: language === 'ar' ? 'طلاب' : 'students',
    business: language === 'ar' ? 'أعمال' : 'business',
    technical: language === 'ar' ? 'تقني' : 'technical'
  };
  
  if (language === 'ar') {
    return `
أنت كاتب محتوى محترف. الرجاء إنشاء ${contentTypes[contentType]} حول الموضوع التالي:

الموضوع: ${topic}
نوع المحتوى: ${contentTypes[contentType]}
النبرة: ${tones[tone]}
الجمهور المستهدف: ${audiences[targetAudience]} // تم التصحيح هنا

معلومات البحث المتاحة:
${researchSummary}

الرجاء تقديم محتوى أصلي وجذاب وذو قيمة، مع الاستفادة من المعلومات أعلاه.
أكتب بطريقة ${tones[tone]} تناسب جمهور ${audiences[targetAudience]}. // تم التصحيح هنا

تأكد من:
1. تقديم معلومات دقيقة وموثوقة
2. تنظيم المحتوى بطريقة منطقية
3. استخدام لغة واضحة وسلسة
4. إضافة عناوين فرعية عند الحاجة
5. ختام المحتوى بشكل مناسب
6. استخدام أمثلة واقعية من مصادر البحث عند الاقتضاء
    `;
  } else {
    return `
You are a professional content writer. Please create a ${contentType} about the following topic:

Topic: ${topic}
Content Type: ${contentType}
Tone: ${tone}
Target Audience: ${targetAudience} // تم التصحيح هنا

Research information available:
${researchSummary}

Please provide original, engaging, and valuable content using the above information.
Write in a ${tone} tone suitable for ${targetAudience} audience. // تم التصحيح هنا

Ensure to:
1. Provide accurate and reliable information
2. Organize content logically
3. Use clear and smooth language
4. Add subheadings when needed
5. Conclude the content appropriately
6. Use real examples from research sources when appropriate
    `;
  }
}

// تلخيص بيانات البحث
function summarizeResearchData(researchData: any, language: string): string {
  let summary = '';
  
  for (const [source, results] of Object.entries(researchData)) {
    if (Array.isArray(results) && results.length > 0) {
      const sourceName = getSourceName(source, language);
      summary += `\n${sourceName}:\n`;
      
      results.slice(0, 3).forEach((result: any, index: number) => {
        summary += `${index + 1}. ${result.title || 'No title'}\n`;
        if (result.description) {
          summary += `   ${result.description.substring(0, 150)}...\n`;
        }
      });
    }
  }
  
  return summary || (language === 'ar' ? 'لا توجد معلومات بحث متاحة' : 'No research information available');
}

// الحصول على اسم المصدر بلغة مناسبة
function getSourceName(source: string, language: string): string {
  const sources: Record<string, { ar: string; en: string }> = {
    web: { ar: 'نتائج البحث من الويب', en: 'Web search results' },
    youtube: { ar: 'مقاطع يوتيوب', en: 'YouTube videos' },
    news: { ar: 'أخبار', en: 'News articles' },
    academic: { ar: 'مصادر أكاديمية', en: 'Academic sources' },
    wikipedia: { ar: 'ويكيبيديا', en: 'Wikipedia' }
  };
  
  return sources[source]?.[language] || source;
}

// التوليد باستخدام Groq (الأولوية الأساسية)
async function generateWithGroq(prompt: string, length: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_CONFIG.timeout);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // يمكن تغيير النموذج حسب الحاجة
        messages: [{ role: 'user', content: prompt }],
        temperature: GENERATION_CONFIG.temperature,
        max_tokens: GENERATION_CONFIG.maxTokens[length],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Groq API request timed out');
    }
    throw error;
  }
}

// التوليد باستخدام DeepSeek
async function generateWithDeepSeek(prompt: string, length: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_CONFIG.timeout);

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: GENERATION_CONFIG.temperature,
        max_tokens: GENERATION_CONFIG.maxTokens[length],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('DeepSeek API request timed out');
    }
    throw error;
  }
}

// التوليد باستخدام OpenAI
async function generateWithOpenAI(prompt: string, length: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_CONFIG.timeout);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: GENERATION_CONFIG.temperature,
        max_tokens: GENERATION_CONFIG.maxTokens[length],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('OpenAI API request timed out');
    }
    throw error;
  }
}

// محتوى بديل إذا فشل التوليد - تم التصحيح هنا
function generateFallbackContent(params: GenerationParams): string {
  const { topic, language, contentType, tone, targetAudience } = params; // تم التصحيح هنا
  
  if (language === 'ar') {
    return `
# ${topic}

## نوع المحتوى: ${contentType}
## النبرة: ${tone}
## الجمهور المستهدف: ${targetAudience} // تم التصحيح هنا

هذا محتوى بديل حول "${topic}". 

للأسف، تعذر الاتصال بخدمة التوليد الذكي في الوقت الحالي. 
يوصى بالتحقق من اتصال الإنترنت وإعدادات مفاتيح API.

يمكنك المحاولة مرة أخرى لاحقاً أو استخدام مفتاح API مختلف.

## نصائح لتحسين المحتوى:
1. استخدم معلومات من مصادر موثوقة
2. رتب المحتوى بطريقة منطقية
3. أضف أمثلة واقعية
4. ختم بخلاصة أو توصيات
    `;
  } else {
    return `
# ${topic}

## Content Type: ${contentType}
## Tone: ${tone}
## Target Audience: ${targetAudience} // تم التصحيح هنا

This is fallback content about "${topic}".

Unfortunately, we couldn't connect to the smart generation service at this time.
Please check your internet connection and API key settings.

You can try again later or use a different API key.

## Tips to improve content:
1. Use information from reliable sources
2. Organize content logically
3. Add real examples
4. Conclude with summary or recommendations
    `;
  }
}

// endpoint للتحقق من الحالة
export async function GET() {
  const availableAPIs = {
    groq: !!process.env.GROQ_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    openai: !!process.env.OPENAI_API_KEY
  };

  return NextResponse.json({
    status: 'active',
    availableAPIs,
    config: GENERATION_CONFIG,
    message: 'Use POST with research data to generate content',
    primaryAPI: 'Groq (Llama 3)'
  });
}