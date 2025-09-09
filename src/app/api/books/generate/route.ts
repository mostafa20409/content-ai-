// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';
import Book from '@/models/Book';

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
  CHILDREN: 'أطفال',
  REAL_STORY: 'قصه حقيقيه'
} as const;

type BookType = keyof typeof BOOK_TYPES;

// واجهة فصل الكتاب مع العنوان والوصف
interface BookChapter {
  chapterNumber: number;
  title: string;
  description: string;
  imageDescription?: string;
  content?: string;
}

// واجهة للفصل الناتج
interface GeneratedChapter {
  chapterNumber: number;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tokens?: number;
  wordCount?: number;
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

// دالة إنشاء الـ prompt مع كل التفاصيل مع التركيز على الاستمرارية
function createAdvancedPrompt(
  bookTitle: string,
  bookDescription: string,
  bookType: string,
  language: string,
  chapter: BookChapter,
  totalChapters: number,
  previousChaptersContent: string[] = [],
  authorStyle: string = 'professional'
): string {
  
  const isArabic = language === 'ar';
  const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;

  // بناء محتوى الفصول السابقة للاستمرارية
  let previousContentSummary = '';
  if (previousChaptersContent.length > 0) {
    previousContentSummary = isArabic ? 
      `## محتوى الفصول السابقة (للحفاظ على الاستمرارية):
${previousChaptersContent.map((content, index) => `الفصل ${index + 1}: ${content.substring(0, 500)}...`).join('\n')}`
      : 
      `## Previous Chapters Content (for continuity):
${previousChaptersContent.map((content, index) => `Chapter ${index + 1}: ${content.substring(0, 500)}...`).join('\n')}`;
  }

  return isArabic ? `
    # مهمة كتابة محتوى متقدم مع الحفاظ على الاستمرارية
    ## المعلومات الأساسية:
    - نوع الكتاب: ${bookTypeName}
    - عنوان الكتاب: ${bookTitle}
    - وصف الكتاب: ${bookDescription}
    - الفصل: ${chapter.chapterNumber} من ${totalChapters}
    - عنوان الفصل: ${chapter.title}
    - وصف الفصل: ${chapter.description}
    - الأسلوب: ${authorStyle}

    ${previousContentSummary}

    ## متطلبات المحتوى:
    - الطول: 8000+ كلمة (محتوى غني ومفصل)
    - الهيكل: مقدمة (10%)، محتوى رئيسي (80%)، خاتمة (10%)
    - الأسلوب: ${authorStyle} يناسب نوع ${bookTypeName}
    - الدقة: المعلومات يجب أن تكون موثقة ودقيقة
    - السلاسة: الانتقال بين الأفكار يجب أن يكون طبيعياً
    - العمق: معالجة الموضوع بعمق وتحليل متقدم شامل
    - التنظيم: تقسيم المحتوى إلى أقسام وعناوين فرعية واضحة
    - الاستمرارية: يجب أن يكون المحتوى امتداداً طبيعياً للفصول السابقة

    ## تعليمات خاصة:
    1. ابدأ بمقدمة شاملة وجذابة تعرض أهمية الموضوع وأهداف الفصل مع الربط بما سبق
    2. استخدم لغة عربية فصحى سليمة وغنية بالمفردات
    3. حافظ على التسلسل المنطقي والترابط بين الأفكار مع الفصول السابقة
    4. أنهِ الفصل بخلاصة شاملة تضع أساساً للفصل التالي
    5. استخدم العناوين الفرعية لتنظيم المحتوى بشكل واضح
    6. أضف أمثلة وتطبيقات عملية للمفاهيم المطروحة
    7. راعي الخصائص الفنية لنوع الكتاب بشكل متعمق
    8. تأكد من أن المحتوى شامل ويغطي جميع جوانب الموضوع
    9. استخدم أسلوباً سردياً يجذب القارئ ويحافظ على اهتمامه مع الحفاظ على تسلسل الأحداث
    10. تجنب التكرار غير الضروري وركز على تقديم قيمة حقيقية
    11. تأكد من أن الأحداث والشخصيات تتابع بشكل منطقي من الفصول السابقة
    12. لا تغير حقائق أو أحداث تم تأسيسها في الفصول السابقة
  ` : `
    # Advanced Content Generation Task with Continuity
    ## Basic Information:
    - Book Type: ${bookTypeName}
    - Book Title: ${bookTitle}
    - Book Description: ${bookDescription}
    - Chapter: ${chapter.chapterNumber} of ${totalChapters}
    - Chapter Title: ${chapter.title}
    - Chapter Description: ${chapter.description}
    - Writing Style: ${authorStyle}

    ${previousContentSummary}

    ## Content Requirements:
    - Length: 8000+ words (rich and detailed content)
    - Structure: Introduction (10%), main content (80%), conclusion (10%)
    - Style: ${authorStyle} appropriate for ${bookTypeName} genre
    - Accuracy: Information must be verified and precise
    - Flow: Natural transition between ideas and previous chapters
    - Depth: Comprehensive analysis and deep treatment of the subject
    - Organization: Divide content into clear sections and subheadings
    - Continuity: Content must be a natural extension of previous chapters

    ## Special Instructions:
    1. Start with a comprehensive introduction linking to previous chapters
    2. Use professional ${language} language with rich vocabulary
    3. Maintain logical sequence and connection with previous content
    4. End the chapter with a comprehensive summary that sets the stage for the next chapter
    5. Use subheadings to organize content clearly
    6. Add practical examples and applications of the concepts discussed
    7. Focus on comprehensive analysis
    8. Consider the technical characteristics of the book genre in depth
    9. Ensure the content is comprehensive and covers all aspects of the topic
    10. Use a narrative style that maintains reader interest while preserving story continuity
    11. Ensure events and characters follow logically from previous chapters
    12. Do not change facts or events established in previous chapters
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

    // التحقق من أن الوصف يحتوي على 20 كلمة على الأقل
    const wordCount = chapter.description.trim().split(/\s+/).length;
    if (wordCount < 20) {
      return {
        isValid: false,
        error: language === 'ar' 
          ? `وصف الفصل "${chapter.title}" قصير جداً. يجب أن يحتوي على 20 كلمة على الأقل` 
          : `Chapter "${chapter.title}" description is too short. Must contain at least 20 words`
      };
    }

    return { isValid: true };
  }

  return { isValid: true };
}

// دالة لحساب عدد الكلمات
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// دالة لتوليد غلاف الكتاب باستخدام Stability AI
async function generateBookCover(
  bookTitle: string, 
  coverDescription: string, 
  bookType: string, 
  _language: string,
  authorName: string
): Promise<string> {
  try {
    const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;
    
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Classic black and white book cover titled "${bookTitle}"
      By: ${authorName}
      Book type: ${bookTypeName}
      ${coverDescription}
      
      Specifications:
      - Elegant classic black and white design
      - Clear Arabic fonts for title and author name
      - Simple decorative frame around the cover
      - Vintage elegant appearance suitable for print books
      - Enough space for book title and author name
      - 2:3 aspect ratio
      - No colors, only grayscale
      - High quality suitable for publishing
    `;

    // استخدام Stability AI v2beta مع multipart/form-data
    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('output_format', 'jpeg');
    formData.append('model', 'sd3');
    formData.append('mode', 'text-to-image');
    formData.append('aspect_ratio', '2:3');
    formData.append('seed', '0');
    formData.append('steps', '30');
    formData.append('cfg_scale', '7');
    formData.append('style_preset', 'enhance');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability AI API error:", errorText);
      throw new Error('Failed to generate book cover');
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;

  } catch (error) {
    console.error('Book cover generation error:', error);
    throw new Error('Failed to generate book cover');
  }
}

// دالة لتوليد صورة الفصل باستخدام Stability AI
async function generateChapterImage(
  chapterTitle: string,
  chapterDescription: string,
  chapterImageDescription: string,
  bookTitle: string,
  bookType: string,
  _language: string
): Promise<string> {
  try {
    const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;
    
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Black and white illustration for chapter: "${chapterTitle}"
      From book: "${bookTitle}"
      Book type: ${bookTypeName}
      Chapter description: ${chapterDescription}
      ${chapterImageDescription ? `Image description: ${chapterImageDescription}` : ''}
      
      Specifications:
      - Elegant black and white drawing
      - Simple and clear design
      - No text included
      - 1:1 aspect ratio
      - Grayscale only
      - High quality suitable for publishing
    `;

    // استخدام Stability AI v2beta مع multipart/form-data
    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('output_format', 'jpeg');
    formData.append('model', 'sd3');
    formData.append('mode', 'text-to-image');
    formData.append('aspect_ratio', '1:1');
    formData.append('seed', '0');
    formData.append('steps', '25');
    formData.append('cfg_scale', '6');
    formData.append('style_preset', 'line-art');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability AI API error:", errorText);
      throw new Error('Failed to generate chapter image');
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;

  } catch (error) {
    console.error('Chapter image generation error:', error);
    throw new Error('Failed to generate chapter image');
  }
}

// دالة لحفظ الكتاب في قاعدة البيانات
async function saveBookToDatabase(
  userId: string,
  title: string,
  description: string,
  bookType: string,
  language: string,
  chapters: GeneratedChapter[],
  totalTokens?: number,
  totalWords?: number,
  coverUrl?: string
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
        imageUrl: chapter.imageUrl,
        tokens: chapter.tokens,
        wordCount: chapter.wordCount
      })),
      totalTokens,
      totalWords,
      coverUrl,
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
    const cookieStore = cookies();
    const tokenCookie = (await cookieStore).get("token");
    const token = tokenCookie?.value;
    
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
      authorStyle = 'professional',
      saveToLibrary = true,
      coverDescription = "",
      generateChapterImages = false,
      authorName = ""
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

    // التحقق من وجود مفتاح Stability AI API
    if (!process.env.STABILITY_API_KEY && (coverDescription || generateChapterImages)) {
      console.warn('STABILITY_API_KEY not found, image generation will be disabled');
    }

    // توليد غلاف الكتاب إذا تم تقديم وصف
    let coverUrl: string | null = null;
    if (coverDescription && coverDescription.trim() && process.env.STABILITY_API_KEY) {
      try {
        coverUrl = await generateBookCover(title, coverDescription, bookType, bookLanguage, authorName);
      } catch (error) {
        console.error('Cover generation failed, continuing without cover:', error);
      }
    }

    const results: GeneratedChapter[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 دقيقة للمحتوى الطويل

    try {
      // تخزين محتوى الفصول السابقة لضمان الاستمرارية
      const previousChaptersContent: string[] = [];

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
          previousChaptersContent,
          authorStyle
        );

        // استخدام نموذج متوفر من Groq
        const requestBody = {
          model: "llama-3.1-8b-instant", // نموذج متوفر ومضمون
          messages: [
            {
              role: "system",
              content: bookLanguage === 'ar' 
                ? `أنت كاتب محترف متخصص في ${BOOK_TYPES[bookType as BookType] || bookType}. 
                   مهمتك هي كتابة محتوى غني ومفصل لا يقل عن 3000 كلمة لكل فصل.
                   استخدم لغة عربية فصحى سليمة، وأسلوباً أدبياً راقياً، وتعمق في التحليل.`
                : `You are a professional writer specialized in ${bookType}. 
                   Your task is to write rich, detailed content of at least 3000 words per chapter.`
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 32000,
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
          console.error("Groq API error:", errorText);
          throw new Error(bookLanguage === 'ar' 
            ? "فشل في توليد المحتوى باستخدام الذكاء الاصطناعي" 
            : "Failed to generate content using AI");
        }

        const data = await aiRes.json();
        let content = data.choices?.[0]?.message?.content || "";
        
        // تخزين محتوى هذا الفصل للفصول القادمة
        previousChaptersContent.push(content);

        // توليد صورة الفصل إذا طلب المستخدم ذلك وكان المفتاح متوفراً
        let chapterImageUrl: string | null = null;
        if (generateChapterImages && process.env.STABILITY_API_KEY) {
          try {
            chapterImageUrl = await generateChapterImage(
              chapter.title,
              chapter.description,
              chapter.imageDescription || "",
              title,
              bookType,
              bookLanguage
            );
          } catch (error) {
            console.error('Chapter image generation failed:', error);
            // نستمر بدون صورة الفصل في حالة الفشل
          }
        }

        results.push({
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.description,
          content,
          imageUrl: chapterImageUrl || undefined,
          tokens: data.usage?.total_tokens,
          wordCount: countWords(content)
        });

        // تحديث التقدم
        const progress = Math.round((results.length / chapters.length) * 100);
        console.log(`Progress: ${progress}% - Chapter ${results.length} of ${chapters.length} - ${countWords(content)} words`);

        // تأخير بين الفصول لتجنب تجاوز معدل الطلبات
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      clearTimeout(timeoutId);

      // حساب إجمالي الكلمات
      const totalWords = results.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);

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
          results.reduce((sum, chapter) => sum + (chapter.tokens || 0), 0),
          totalWords,
          coverUrl || undefined
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
          totalWords,
          bookId: bookId || undefined,
          coverUrl: coverUrl || undefined
        },
        chapters: results,
        totalTokens: results.reduce((sum, chapter) => sum + (chapter.tokens || 0), 0),
        totalWords
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
        { error: error.message || (bookLanguage === 'ar' ? "فشل في الاتصال بخدمة الذكاء الاصطناعي" : "Failed to connect to AI service") },
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
    const cookieStore = cookies();
    const tokenCookie = (await cookieStore).get("token");
    const token = tokenCookie?.value;
    
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      
      await connectToDB();
      
      const books = await Book.find({ userId: decoded.id })
        .sort({ createdAt: -1 })
        .select('title description type language createdAt totalChapters totalWords coverUrl');
      
      return NextResponse.json({ books });
    } catch (error) {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }
  }
  
  // إرجاع أنواع الكتب المتاحة
  return NextResponse.json({ 
    bookTypes: BOOK_TYPES,
    writingStyles: ['professional', 'academic', 'creative', 'conversational', 'formal'],
    status: 'success'
  });
}