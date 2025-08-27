// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '../../../../lib/connectToDB';
import User from '../../../../models/User';
import Book from '../../../../models/Book';

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

// تعريف واجهة للـ JWT payload
interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// دالة مساعدة للتحقق من JWT
function verifyToken(token: string, secret: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token payload');
    }
    
    if (!('id' in decoded)) {
      throw new Error('Token missing id field');
    }
    
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
}

// دالة البحث المتكاملة
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
    ${researchData && researchData.examples.length > 0 ? '6. استخدم المراجع والمصادر المقدمة في البحث' : '6. راعي الخصائص الفنية لنوع الكتاب'}
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
    ${researchData && researchData.examples.length > 0 ? '6. Utilize the provided references and research sources' : '6. Consider the technical characteristics of the book genre'}
  `;
}

// دالة للتحقق من صحة بيانات الفصول
function validateChapters(chapters: BookChapter[], language: string): { isValid: boolean; error?: string } {
  if (!chapters || chapters.length === 0) {
    return {
      isValid: false,
      error: language === 'ar' ? 'يجب توفير الفصول' : 'Chapters are required'
    };
  }

  for (const chapter of chapters) {
    if (!chapter.title || !chapter.title.trim()) {
      return {
        isValid: false,
        error: language === 'ar' 
          ? 'كل فصل يجب أن يحتوي على عنوان' 
          : 'Each chapter must have a title'
      };
    }

    if (!chapter.description || !chapter.description.trim()) {
      return {
        isValid: false,
        error: language === 'ar' 
          ? 'كل فصل يجب أن يحتوي على وصف مفصل' 
          : 'Each chapter must have a detailed description'
      };
    }

    // التحقق من أن الوصف يحتوي على 10 جمل على الأقل (تقريباً 50 كلمة)
    const wordCount = chapter.description.trim().split(/\s+/).length;
    if (wordCount < 20) {
      return {
        isValid: false,
        error: language === 'ar' 
          ? `وصف الفصل "${chapter.title}" قصير جداً. يجب أن يحتوي على 20 كلمة على الأقل` 
          : `Chapter "${chapter.title}" description is too short. Must contain at least 20 words`
      };
    }
  }

  return { isValid: true };
}

// دالة لحفظ الكتاب في قاعدة البيانات
async function saveBookToDatabase(
  userId: string,
  title: string,
  description: string,
  bookType: string,
  language: string,
  chapters: GeneratedChapter[],
  researchData?: ResearchData,
  totalTokens?: number
) {
  try {
    const book = new Book({
      userId,
      title,
      description,
      type: bookType,
      language,
      chapters: chapters.map(chapter => ({
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        description: chapter.description,
        content: chapter.content,
        tokens: chapter.tokens
      })),
      research: researchData ? {
        examples: researchData.examples,
        sources: researchData.sources,
        references: researchData.references
      } : undefined,
      totalTokens,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await book.save();
    return (book._id as string).toString();
  } catch (error) {
    console.error('Error saving book to database:', error);
    throw new Error('Failed to save book');
  }
}

export async function POST(req: Request) {
  try {
    // التحقق من المصادقة أولاً
    const token = (await cookies()).get("token")?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // التحقق من صحة التوكن
    let userId: string;
    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    await connectToDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // التحقق من معدل الطلبات
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

    // استقبال البيانات
    const { 
      title, 
      description, 
      bookLanguage, 
      chapters,
      bookType,
      includeExamples = true,
      researchDepth = 'advanced',
      authorStyle = 'professional',
      saveToLibrary = true
    } = await req.json();

    // التحقق من الحقول المطلوبة
    if (!title || !description || !bookLanguage || !bookType || !chapters) {
      return NextResponse.json({ 
        error: bookLanguage === 'ar' ? "جميع الحقول مطلوبة" : "All fields are required" 
      }, { status: 400 });
    }

    // التحقق من صحة الفصول
    const validationResult = validateChapters(chapters, bookLanguage);
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: validationResult.error 
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

    const results: GeneratedChapter[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

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
          model: "llama3-70b-8192",
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

        const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
        const GROQ_CHAT_ENDPOINT = '/chat/completions';

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

        // تحديث التقدم
        const progress = Math.round((results.length / chapters.length) * 100);
        console.log(`Progress: ${progress}% - Chapter ${results.length} of ${chapters.length}`);

        // تأخير بين الفصول
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      clearTimeout(timeoutId);

      // حفظ الكتاب في قاعدة البيانات إذا طلب المستخدم ذلك
      let bookId: string | null = null;
      if (saveToLibrary) {
        bookId = await saveBookToDatabase(
          userId,
          title,
          description,
          bookType,
          bookLanguage,
          results,
          includeExamples ? researchData : undefined,
          results.reduce((sum, chapter) => sum + (chapter.tokens || 0), 0)
        );
      }

      return NextResponse.json({
        success: true,
        book: {
          title,
          description,
          type: bookType,
          language: bookLanguage,
          totalChapters: chapters.length,
          bookId: bookId || undefined
        },
        chapters: results,
        research: includeExamples ? {
          examples: researchData.examples,
          sources: researchData.sources,
          references: researchData.references
        } : undefined,
        totalTokens: results.reduce((sum, chapter) => sum + (chapter.tokens || 0), 0)
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: bookLanguage === 'ar' ? "انتهت مهلة الاتصال" : "Request timeout" },
          { status: 408 }
        );
      }
      
      console.error("AI API error:", error);
      return NextResponse.json(
        { error: bookLanguage === 'ar' ? "فشل في الاتصال بخدمة الذكاء الاصطناعي" : "Failed to connect to AI service" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("❌ Advanced book generation error:", error);
    
    const errorMessage = error.message || "حدث خطأ في الخادم";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// نقاط النهاية المساعدة
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  if (type === 'user-books') {
    // التحقق من المصادقة
    const token = (await cookies()).get("token")?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      
      await connectToDB();
      
      const books = await Book.find({ userId: decoded.id })
        .sort({ createdAt: -1 })
        .select('title description type language createdAt totalChapters');
      
      return NextResponse.json({ books });
    } catch (error) {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }
  }
  
  // إرجاع أنواع الكتب المتاحة
  return NextResponse.json({ 
    bookTypes: BOOK_TYPES,
    researchLevels: ['basic', 'advanced', 'academic'],
    writingStyles: ['professional', 'academic', 'creative', 'conversational', 'formal'],
    status: 'success'
  });
}