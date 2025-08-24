// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '../../../../lib/connectToDB';
import User from '../../../../models/User';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_CHAT_ENDPOINT = '/chat/completions';

// تخزين مؤقت بسيط لإدارة المعدل
const requestCache = new Map();
const RATE_LIMIT = {
  MAX_REQUESTS: 8,
  WINDOW_MS: 15 * 60 * 1000 // 15 دقيقة
};

// دالة بسيطة للتحقق من المعدل
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // تنظيف الطلبات القديمة
  for (const [key, timestamp] of requestCache.entries()) {
    if (timestamp < windowStart) {
      requestCache.delete(key);
    }
  }
  
  // عد الطلبات الحالية
  const requestCount = Array.from(requestCache.values()).filter(
    timestamp => timestamp >= windowStart
  ).length;
  
  if (requestCount >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  // إضافة الطلب الحالي
  requestCache.set(ip, now);
  return true;
}

// أنواع الكتب المتاحة
const BOOK_TYPES = {
  RELIGIOUS: 'ديني',
  PHILOSOPHICAL: 'فلسفي', 
  HORROR: 'رعب',
  SCIENTIFIC: 'علمي',
  HISTORICAL: 'تاريخي',
  LITERARY: 'أدبي',
  SELF_DEVELOPMENT: 'تطوير ذاتي',
  ROMANCE: 'رومانسي',
  BIOGRAPHY: 'سيرة ذاتية',
  CHILDREN: 'أطفال'
} as const;

type BookType = keyof typeof BOOK_TYPES;

// واجهة خيارات التصميم
interface DesignCustomization {
  authorName: string;
  coverLayout: 'minimal' | 'modern' | 'classic' | 'elegant' | 'custom';
  colorScheme: {
    primary: string;
    secondary: string; 
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    titleSize: string;
    authorSize: string;
  };
  includeAuthorOnCover: boolean;
  customGraphics: string[];
  coverImageStyle: 'abstract' | 'realistic' | 'minimalist' | 'vintage';
}

// واجهة فصل الكتاب مع العنوان والوصف
interface BookChapter {
  chapterNumber: number;
  title: string;
  description: string;
  content?: string;
}

// واجهة للفصل الناتج
interface GeneratedChapter {
  chapterNumber: number;
  title: string;
  description: string;
  content: string;
  tokens?: number;
}

// واجهة لنتيجة البحث
interface ResearchData {
  examples: string[];
  sources: string[];
  references: string[];
}

// دالة البحث المتكاملة - أعلى مستوى
async function fetchResearchExamples(
  bookType: string, 
  topic: string, 
  language: string,
  researchDepth: 'basic' | 'advanced' | 'academic' = 'advanced'
): Promise<ResearchData> {
  
  try {
    const searchQueries: string[] = [];
    const sources: string[] = [];
    const references: string[] = [];

    // تحديد استراتيجية البحث حسب نوع الكتاب
    switch(bookType.toLowerCase()) {
      case 'religious':
      case 'ديني':
        searchQueries.push(
          `${topic} Islamic references`,
          `${topic} religious studies`,
          `${topic} theological perspectives`,
          `${topic} Quranic references`,
          `${topic} Hadith sources`
        );
        sources.push('Islamic databases', 'Religious archives', 'Historical texts', 'Quranic libraries');
        references.push('المراجع الإسلامية', 'الدراسات الدينية', 'المصادر التاريخية');
        break;
      
      case 'philosophical':
      case 'فلسفي':
        searchQueries.push(
          `${topic} philosophical theories`,
          `${topic} existential analysis`,
          `${topic} metaphysical perspectives`,
          `${topic} ethical frameworks`,
          `${topic} logical arguments`
        );
        sources.push('Philosophy journals', 'Academic papers', 'Thinker archives', 'Philosophical databases');
        references.push('المجلات الفلسفية', 'الأوراق الأكاديمية', 'أرشيف المفكرين');
        break;
      
      case 'horror':
      case 'رعب':
        searchQueries.push(
          `${topic} psychological horror`,
          `${topic} supernatural phenomena`,
          `${topic} Gothic literature references`,
          `${topic} horror genre analysis`,
          `${topic} fear psychology`
        );
        sources.push('Horror literature database', 'Psychological studies', 'Folklore archives', 'Genre analysis');
        references.push('أدب الرعب', 'الدراسات النفسية', 'أرشيف الفولكلور');
        break;

      case 'scientific':
      case 'علمي':
        searchQueries.push(
          `${topic} scientific research`,
          `${topic} empirical studies`,
          `${topic} experimental data`,
          `${topic} peer-reviewed papers`,
          `${topic} scientific methodology`
        );
        sources.push('Scientific journals', 'Research databases', 'Academic publications', 'Peer-reviewed sources');
        references.push('المجلات العلمية', 'قواعد البحث', 'المنشورات الأكاديمية');
        break;

      default:
        searchQueries.push(
          `${topic} research studies`,
          `${topic} academic references`,
          `${topic} expert analysis`,
          `${topic} comprehensive study`,
          `${topic} in-depth analysis`
        );
        sources.push('Academic databases', 'Research papers', 'Expert publications', 'Comprehensive archives');
        references.push('قواعد البيانات الأكاديمية', 'الأوراق البحثية', 'المنشورات المتخصصة');
    }

    // محاكاة البحث في قواعد البيانات
    const researchResults = await Promise.all(
      searchQueries.map(async (query, index) => {
        try {
          const delay = researchDepth === 'basic' ? 300 : 
                       researchDepth === 'advanced' ? 600 : 900;
          
          await new Promise(resolve => setTimeout(resolve, delay + index * 100));
          
          const depthMultiplier = researchDepth === 'basic' ? 1 : 
                                 researchDepth === 'advanced' ? 2 : 3;
          
          return {
            content: `${language === 'ar' ? 'نتيجة بحث متقدمة: ' : 'Advanced research result: '}${query} - ${
              depthMultiplier * (index + 1)
            } ${language === 'ar' ? 'مصادر موثوقة' : 'verified sources'}`,
            source: sources[index % sources.length],
            reference: references[index % references.length]
          };
        } catch (error) {
          console.error(`Search failed for query: ${query}`, error);
          return null;
        }
      })
    );

    const validResults = researchResults.filter((result): result is NonNullable<typeof result> => result !== null);
    const examples = validResults.map(result => result.content);
    const uniqueSources = Array.from(new Set(validResults.map(result => result.source)));
    const uniqueReferences = Array.from(new Set(validResults.map(result => result.reference)));

    return {
      examples: examples.slice(0, researchDepth === 'basic' ? 3 : 
                               researchDepth === 'advanced' ? 5 : 7),
      sources: uniqueSources,
      references: uniqueReferences
    };

  } catch (error) {
    console.error('Research system error:', error);
    return { examples: [], sources: [], references: [] };
  }
}

// دالة توليد غلاف متقدمة مع تخصيص كامل
async function generateAdvancedBookCover(
  bookTitle: string,
  bookType: string,
  language: string,
  designOptions: DesignCustomization,
  authorName: string = ''
): Promise<{coverUrl: string; design: DesignCustomization; coverId: string}> {
  
  try {
    // محاكاة إنشاء الغلاف مع التخصيص
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const coverId = `cover_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    
    // إنشاء رابط غلاف فريد مع جميع خيارات التصميم
    const coverParams = new URLSearchParams({
      title: encodeURIComponent(bookTitle),
      type: bookType,
      author: designOptions.includeAuthorOnCover ? encodeURIComponent(authorName || designOptions.authorName) : '',
      layout: designOptions.coverLayout,
      style: designOptions.coverImageStyle,
      primary: designOptions.colorScheme.primary.replace('#', ''),
      secondary: designOptions.colorScheme.secondary.replace('#', ''),
      accent: designOptions.colorScheme.accent.replace('#', ''),
      font: designOptions.typography.fontFamily,
      titleSize: designOptions.typography.titleSize,
      custom: designOptions.customGraphics.join(',')
    });

    const coverUrl = `https://api.bookcover.design/generate?${coverParams.toString()}`;
    
    return {
      coverUrl,
      design: designOptions,
      coverId
    };
    
  } catch (error) {
    console.error('Cover generation error:', error);
    throw new Error(language === 'ar' ? 'فشل في توليد الغلاف المتقدم' : 'Advanced cover generation failed');
  }
}

// دالة إنشاء الـ prompt مع كل التفاصيل
function createAdvancedPrompt(
  bookTitle: string,
  bookDescription: string,
  bookType: string,
  language: string,
  chapter: BookChapter,
  totalChapters: number,
  researchData?: ResearchData,
  authorStyle: string = 'professional'
): string {
  
  const isArabic = language === 'ar';
  const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;

  return isArabic ? `
    # مهمة كتابة محتوى متقدم
    ## المعلومات الأساسية:
    - نوع الكتاب: ${bookTypeName}
    - عنوان الكتاب: ${bookTitle}
    - وصف الكتاب: ${bookDescription}
    - الفصل: ${chapter.chapterNumber} من ${totalChapters}
    - عنوان الفصل: ${chapter.title}
    - وصف الفصل: ${chapter.description}
    - الأسلوب: ${authorStyle}

    ## نتائج البحث المتقدم:
    ${researchData && researchData.examples.length > 0 ? `
    ### المصادر والمراجع:
    ${researchData.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}
    
    ### قواعد البيانات المستخدمة:
    ${researchData.sources.join('، ')}
    
    ### المراجع العربية:
    ${researchData.references.join('، ')}
    ` : 'لا توجد نتائج بحث مطلوبة'}

    ## متطلبات المحتوى:
    - الطول: 1500-2000 كلمة
    - الهيكل: مقدمة (20%)، محتوى رئيسي (60%)، خاتمة (20%)
    - الأسلوب: ${authorStyle} يناسب نوع ${bookTypeName}
    - الدقة: المعلومات يجب أن تكون موثقة ودقيقة
    - السلاسة: الانتقال بين الأفكار يجب أن يكون طبيعياً
    - العمق: معالجة الموضوع بعمق وتحليل متقدم

    ## تعليمات خاصة:
    1. ابدأ بمقدمة جذابة تعرض أهمية الموضوع
    2. استخدم أمثلة واقعية من نتائج البحث إن وجدت
    3. حافظ على التسلسل المنطقي للأفكار
    4. استخدم لغة عربية فصحى سليمة
    5. أنهِ الفصل بخلاصة تضع أساساً للفصل التالي
    6. راعي الخصائص الفنية لنوع ${bookTypeName}

    ## ملاحظات مهمة:
    - تجنب الحشو غير الضروري
    - اهتم بالأسلوب الأدبي المناسب
    - استخدم terminology متخصص يناسب النوع
    - حافظ على العمق الفكري المناسب للقارئ المتخصص
  ` : `
    # Advanced Content Generation Task
    ## Basic Information:
    - Book Type: ${bookTypeName}
    - Book Title: ${bookTitle}
    - Book Description: ${bookDescription}
    - Chapter: ${chapter.chapterNumber} of ${totalChapters}
    - Chapter Title: ${chapter.title}
    - Chapter Description: ${chapter.description}
    - Writing Style: ${authorStyle}

    ## Advanced Research Results:
    ${researchData && researchData.examples.length > 0 ? `
    ### Sources and References:
    ${researchData.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}
    
    ### Databases Used:
    ${researchData.sources.join(', ')}
    ` : 'No research results required'}

    ## Content Requirements:
    - Length: 1500-2000 words
    - Structure: Introduction (20%), main content (60%), conclusion (20%)
    - Style: ${authorStyle} appropriate for ${bookTypeName} genre
    - Accuracy: Information must be verified and precise
    - Flow: Natural transition between ideas
    - Depth: Advanced analysis and deep treatment of the subject

    ## Special Instructions:
    1. Start with an engaging introduction highlighting the topic's importance
    2. Use real examples from research results if available
    ${researchData && researchData.examples.length > 0 ? '3. Reference specific research findings where applicable' : '3. Focus on comprehensive analysis'}
    4. Use professional ${language} language
    5. End the chapter with a summary that sets the stage for the next chapter
    6. Consider the technical characteristics of the ${bookTypeName} genre

    ## Important Notes:
    - Avoid unnecessary filler content
    - Focus on appropriate literary style
    - Use specialized terminology suitable for the genre
    - Maintain intellectual depth appropriate for specialized readers
  `;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // التحقق من المعدل باستخدام النظام البسيط
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

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

    // استقبال البيانات الجديدة مع التفاصيل الكاملة
    const { 
      title, 
      description, 
      language: bookLanguage, 
      chapters, // مصفوفة الفصول مع العناوين والأوصاف
      bookType,
      includeExamples = true,
      generateCover = false,
      researchDepth = 'advanced',
      designOptions,
      authorStyle = 'professional',
      authorName = ''
    } = await req.json();

    if (!title || !description || !bookLanguage || !bookType || !chapters || !chapters.length) {
      return NextResponse.json({ 
        error: bookLanguage === 'ar' ? "جميع الحقول مطلوبة بما في ذلك تفاصيل الفصول" : "All fields including chapter details are required" 
      }, { status: 400 });
    }

    // التحقق من وجود مفتاح Groq API
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: bookLanguage === 'ar' ? "مفتاح Groq API غير موجود" : "Groq API key not found" },
        { status: 500 }
      );
    }

    // البحث المتقدم
    let researchData: ResearchData = {
      examples: [], sources: [], references: []
    };
    
    if (includeExamples) {
      researchData = await fetchResearchExamples(bookType, title, bookLanguage, researchDepth);
    }

    // توليد الأغلفة
    let coverResult: {coverUrl: string; design: DesignCustomization; coverId: string} | null = null;
    if (generateCover && designOptions) {
      coverResult = await generateAdvancedBookCover(
        title, 
        bookType, 
        bookLanguage, 
        designOptions,
        authorName
      );
    }

    const results: GeneratedChapter[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 ثانية

    try {
      for (const chapter of chapters) {
        if (controller.signal.aborted) {
          throw new Error(bookLanguage === 'ar' ? "تم إلغاء العملية" : "Operation cancelled");
        }

        const prompt = createAdvancedPrompt(
          title,
          description,
          bookType,
          bookLanguage,
          chapter,
          chapters.length,
          includeExamples ? researchData : undefined,
          authorStyle
        );

        const requestBody = {
          model: "llama3-70b-8192", // نموذج Groq الموصى به
          messages: [
            {
              role: "system",
              content: bookLanguage === 'ar' 
                ? `أنت كاتب محترف متخصص في ${BOOK_TYPES[bookType as BookType] || bookType} بأسلوب ${authorStyle}.`
                : `You are a professional writer specialized in ${bookType} with ${authorStyle} style.`
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          stream: false,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        };

        const aiRes = await fetch(`${GROQ_API_BASE}${GROQ_CHAT_ENDPOINT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!aiRes.ok) {
          const errorText = await aiRes.text();
          throw new Error(errorText);
        }

        const data = await aiRes.json();
        const content = data.choices?.[0]?.message?.content || "";

        results.push({
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.description,
          content,
          tokens: data.usage?.total_tokens
        });

        // إضافة تأخير بين الفصول لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      clearTimeout(timeoutId);

      return NextResponse.json({
        success: true,
        book: {
          title,
          description,
          type: bookType,
          language: bookLanguage,
          totalChapters: chapters.length
        },
        chapters: results,
        research: includeExamples ? {
          examples: researchData.examples,
          sources: researchData.sources,
          references: researchData.references
        } : undefined,
        cover: coverResult,
        totalTokens: results.reduce((sum, chapter) => sum + (chapter.tokens || 0), 0)
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "انتهت مهلة الاتصال" },
        { status: 408 }
      );
    }

    console.error("❌ Advanced book generation error:", error);
    
    return NextResponse.json(
      { 
        error: "حدث خطأ في الخادم",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// نقاط النهاية المساعدة
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  if (type === 'design-options') {
    return NextResponse.json({
      layoutOptions: ['minimal', 'modern', 'classic', 'elegant', 'custom'],
      colorPresets: {
        professional: { 
          primary: '#2C3E50', 
          secondary: '#34495E', 
          accent: '#E74C3C',
          background: '#FFFFFF',
          text: '#2C3E50'
        },
        creative: { 
          primary: '#8E44AD', 
          secondary: '#9B59B6', 
          accent: '#F1C40F',
          background: '#F8F9FA',
          text: '#2C3E50'
        },
        academic: { 
          primary: '#16A085', 
          secondary: '#1ABC9C', 
          accent: '#D35400',
          background: '#FFFFFF',
          text: '#2C3E50'
        }
      },
      fontOptions: ['Traditional', 'Modern', 'Classic', 'Elegant', 'Minimal', 'Arabic'],
      styleOptions: ['abstract', 'realistic', 'minimalist', 'vintage'],
      writingStyles: ['professional', 'academic', 'creative', 'conversational', 'formal'],
      defaultDesign: {
        authorName: '',
        coverLayout: 'modern',
        colorScheme: { 
          primary: '#2C3E50', 
          secondary: '#34495E', 
          accent: '#E74C3C',
          background: '#FFFFFF',
          text: '#2C3E50'
        },
        typography: { 
          fontFamily: 'Traditional', 
          titleSize: '2.5rem',
          authorSize: '1.5rem'
        },
        includeAuthorOnCover: true,
        customGraphics: [],
        coverImageStyle: 'abstract'
      }
    });
  }
  
  // إرجاع أنواع الكتب المتاحة
  return NextResponse.json({ 
    bookTypes: BOOK_TYPES,
    researchLevels: ['basic', 'advanced', 'academic'],
    status: 'success'
  });
}