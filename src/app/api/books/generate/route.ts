// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';
import Book from '@/models/Book';
import { arabicToEnglishDescription } from '@/lib/utils';

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

// دالة للتحقق من خطة المستخدم وتحديد جودة المحتوى
function getUserContentQuality(user: any): {
  minWords: number;
  maxWords: number;
  temperature: number;
  modelPriority: string[];
  canGenerateImages: boolean;
  canGenerateCover: boolean;
} {
  const plan = user.subscription || 'free';
  
  // تعريف الحدود لكل خطة
  const defaultLimits = {
    'free': {
      minWords: 1800,
      maxWords: 2500,
      temperature: 0.7,
      modelPriority: ['llama-3.1-8b-instant', 'gemma2-9b-it'],
      canGenerateImages: false,
      canGenerateCover: false
    },
    'pro': {
      minWords: 2200,
      maxWords: 3200,
      temperature: 0.75,
      modelPriority: ['llama-3.2-3b-preview', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
      canGenerateImages: true,
      canGenerateCover: true
    },
    'premium': {
      minWords: 2800,
      maxWords: 3800,
      temperature: 0.8,
      modelPriority: ['llama-3.2-90b-vision-preview', 'llama-3.3-70b-versatile', 'llama-3.2-3b-preview'],
      canGenerateImages: true,
      canGenerateCover: true
    }
  };

  // الحصول على التكوين الأساسي للخطة
  const baseConfig = defaultLimits[plan] || defaultLimits.free;
  
  // التحقق من الحدود الفعلية للمستخدم
  const canGenerateImages = user.subscriptionLimits?.imageGeneration !== undefined 
    ? user.subscriptionLimits.imageGeneration > 0 || user.subscriptionLimits.imageGeneration === -1
    : baseConfig.canGenerateImages;
    
  const canGenerateCover = user.subscriptionLimits?.coverGeneration !== undefined 
    ? user.subscriptionLimits.coverGeneration > 0 || user.subscriptionLimits.coverGeneration === -1
    : baseConfig.canGenerateCover;

  // إرجاع التكوين النهائي
  return {
    ...baseConfig,
    canGenerateImages,
    canGenerateCover
  };
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
  authorStyle: string = 'professional',
  minWords: number = 2500
): string {
  
  const isArabic = language === 'ar';
  const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;

  // بناء محتوى الفصول السابقة للاستمرارية
  let previousContentSummary = '';
  if (previousChaptersContent.length > 0) {
    previousContentSummary = isArabic ? 
      `## محتوى الفصول السابقة (للحفاظ على الاستمرارية):
${previousChaptersContent.map((content, index) => `الفصل ${index + 1}: ${content.substring(0, 300)}...`).join('\n')}`
      : 
      `## Previous Chapters Content (for continuity):
${previousChaptersContent.map((content, index) => `Chapter ${index + 1}: ${content.substring(0, 300)}...`).join('\n')}`;
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
    - الحد الأدنى للكلمات: ${minWords} كلمة

    ${previousContentSummary}

    ## متطلبات المحتوى الأساسية (إلزامية):
    - الطول: ${minWords}+ كلمة (محتوى غني ومفصل جداً)
    - لا تقل عن ${minWords} كلمة تحت أي ظرف
    - المحتوى يجب أن يكون غنياً بالتفاصيل والحبكة
    - أضف حوارات بين الشخصيات إذا كان النوع مناسباً
    - وصف مشاهد تفصيلية
    - تطوير شخصيات عميق
    - حبكة قوية ومثيرة

    ## الهيكل المطلوب:
    - مقدمة شاملة (15%): تقديم الشخصيات والحدث الرئيسي
    - تطوير الأحداث (60%): حبكة مفصلة، تطور الشخصيات، صراعات
    - ذروة الأحداث (15%): نقطة التحول الرئيسية
    - خاتمة وتحضير للفصل التالي (10%)

    ## تعليمات صارمة:
    1. لا تقل عن ${minWords} كلمة بأي حال من الأحوال
    2. المحتوى يجب أن يكون غنياً بالتفاصيل والحوارات
    3. استخدم لغة عربية فصحى سليمة ولكن بأسلوب سلس
    4. حافظ على الاستمرارية مع الفصول السابقة
    5. أضف عنصر التشويق والإثارة
    6. طور الشخصيات بشكل عميق
    7. لا تكرر المحتوى السابق
    8. اجعل النهاية تترك القارئ متشوقاً للفصل التالي

    ## أمثلة للتفاصيل المطلوبة:
    - وصف المشاهد: الأماكن، الأجواء، الأزمنة
    - الحوارات: محادثات واقعية بين الشخصيات
    - المشاعر: وصف المشاعر الداخلية للشخصيات
    - الأحداث: تسلسل الأحداث بطريقة منطقية ومثيرة
    - الرموز: استخدام الرموز والإيحاءات المناسبة للنوع
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
    - Minimum words: ${minWords} words

    ${previousContentSummary}

    ## Mandatory Requirements:
    - Length: ${minWords}+ words (rich and detailed content)
    - Minimum ${minWords} words under any circumstances
    - Content must be rich in details and plot
    - Add character dialogues if genre-appropriate
    - Detailed scene descriptions
    - Deep character development
    - Strong and exciting plot

    ## Required Structure:
    - Comprehensive introduction (15%): Introduce characters and main event
    - Event development (60%): Detailed plot, character development, conflicts
    - Climax (15%): Main turning point
    - Conclusion and setup for next chapter (10%)

    ## Strict Instructions:
    1. Do not write less than ${minWords} words under any circumstances
    2. Content must be rich in details and dialogues
    3. Use professional language with smooth flow
    4. Maintain continuity with previous chapters
    5. Add elements of suspense and excitement
    6. Develop characters deeply
    7. Do not repeat previous content
    8. Make the ending leave the reader eager for the next chapter

    ## Examples of required details:
    - Scene descriptions: places, atmospheres, times
    - Dialogues: realistic conversations between characters
    - Emotions: description of characters' internal feelings
    - Events: logical and exciting sequence of events
    - Symbols: use of appropriate symbols and suggestions for the genre
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

// قائمة بالنماذج البديلة بالترتيب (نماذج Groq المتاحة حالياً)
const AVAILABLE_GROQ_MODELS = [
  "llama-3.1-8b-instant",           // النموذج الأساسي
  "llama-3.2-3b-preview",           // جديد
  "gemma2-9b-it",                   // بديل جيد
  "mixtral-8x7b-32768"              // احتياطي
];

// دالة محسنة لتوليد المحتوى مع fallback
async function generateChapterContentWithFallback(
  prompt: string, 
  bookLanguage: string, 
  bookType: string,
  userConfig: any
): Promise<{content: string, tokens: number}> {
  let lastError;
  
  // استخدام النماذج المفضلة حسب خطة المستخدم
  for (const model of userConfig.modelPriority) {
    try {
      console.log(`Trying model: ${model} for ${userConfig.minWords}-${userConfig.maxWords} words`);
      return await generateChapterContentWithModel(prompt, bookLanguage, bookType, model, userConfig);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
      continue;
    }
  }
  
  // إذا فشلت جميع النماذج المفضلة، جرب النماذج الاحتياطية
  const fallbackModels = AVAILABLE_GROQ_MODELS.filter(model => !userConfig.modelPriority.includes(model));
  for (const model of fallbackModels) {
    try {
      console.log(`Trying fallback model: ${model}`);
      return await generateChapterContentWithModel(prompt, bookLanguage, bookType, model, userConfig);
    } catch (error) {
      lastError = error;
      console.warn(`Fallback model ${model} failed:`, error.message);
      continue;
    }
  }
  
  throw lastError || new Error(bookLanguage === 'ar' 
    ? "فشل في توليد المحتوى باستخدام جميع النماذج المتاحة" 
    : "Failed to generate content using all available models");
}

// دالة لتوليد محتوى الفصل باستخدام نموذج محدد
async function generateChapterContentWithModel(
  prompt: string, 
  bookLanguage: string, 
  bookType: string,
  model: string,
  userConfig: any
): Promise<{content: string, tokens: number}> {
  try {
    const requestBody = {
      model: model,
      messages: [
        {
          role: "system",
          content: bookLanguage === 'ar' 
            ? `أنت كاتب محترف متخصص في ${BOOK_TYPES[bookType as BookType] || bookType}. 
               مهمتك هي كتابة محتوى غني ومفصل لا يقل عن ${userConfig.minWords} كلمة لكل فصل.
               استخدم لغة عربية فصحى سليمة، وأسلوباً أدبياً راقياً، وتعمق في التحليل.
               قدم محتوى ذا قيمة حقيقية، مع أمثلة عملية وتفاصيل دقيقة.
               حافظ على الاستمرارية مع الفصول السابقة واهتم بتطوير الأحداث والشخصيات.
               المحتوى يجب أن يكون غنياً بالحبكة والشخصيات والحوارات.`
            : `You are a professional writer specialized in ${bookType}. 
               Your task is to write rich, detailed content of at least ${userConfig.minWords} words per chapter.
               Use professional language with deep analysis and practical examples.
               Maintain continuity with previous chapters and focus on character and plot development.
               Content must be rich in plot, characters, and dialogues.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 32000,
      temperature: userConfig.temperature,
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
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("Groq API error:", errorText);
      throw new Error(bookLanguage === 'ar' 
        ? "فشل في توليد المحتوى باستخدام الذكاء الاصطناعي" 
        : "Failed to generate content using AI");
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "";
    const tokens = data.usage?.total_tokens || 0;
    
    // التحقق من عدد الكلمات
    const actualWordCount = countWords(content);
    if (actualWordCount < userConfig.minWords) {
      console.warn(`Warning: Generated only ${actualWordCount} words, minimum required is ${userConfig.minWords}`);
    }
    
    return { content, tokens };
  } catch (error) {
    console.error("Error in generateChapterContentWithModel:", error);
    throw error;
  }
}

// دالة لتوليد غلاف الكتاب باستخدام Stability AI
async function generateBookCover(
  bookTitle: string, 
  coverDescription: string, 
  bookType: string, 
  language: string,
  authorName: string
): Promise<string> {
  try {
    const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;
    
    // تحويل الوصف العربي إلى إنجليزي إذا لزم الأمر
    let processedDescription = coverDescription;
    if (language === 'ar') {
      processedDescription = arabicToEnglishDescription(coverDescription);
    }
    
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Professional book cover titled "${bookTitle}"
      Author: ${authorName}
      Genre: ${bookTypeName}
      ${processedDescription}
      
      Specifications:
      - Clear display of book title and author name
      - Professional design suitable for publishing
      - High contrast for readability
      - Elegant typography for title and author name
      - 2:3 aspect ratio
      - High quality 300 DPI
      - Include decorative elements related to the book's genre
    `;

    // استخدام Stability AI v2beta مع multipart/form-data
    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('output_format', 'jpeg');
    formData.append('model', 'sd3');
    formData.append('mode', 'text-to-image');
    formData.append('aspect_ratio', '2:3');
    formData.append('seed', '0');
    formData.append('steps', '40');
    formData.append('cfg_scale', '8');
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
  language: string
): Promise<string> {
  try {
    const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;
    
    // تحويل الوصف العربي إلى إنجليزي إذا لزم الأمر
    let processedDescription = chapterImageDescription;
    if (language === 'ar') {
      processedDescription = arabicToEnglishDescription(chapterImageDescription);
    }
    
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Illustration for chapter: "${chapterTitle}"
      From book: "${bookTitle}"
      Book type: ${bookTypeName}
      Chapter description: ${chapterDescription}
      ${processedDescription ? `Image description: ${processedDescription}` : ''}
      
      Specifications:
      - Black and white illustration
      - Simple and clear design
      - No text included
      - 1:1 aspect ratio
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
    formData.append('steps', '30');
    formData.append('cfg_scale', '7');
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

    // الحصول على إعدادات جودة المحتوى بناء على خطة المستخدم
    const userQualityConfig = getUserContentQuality(user);

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

    // التحقق من صلاحية المستخدم لتوليد الأغلفة والصور حسب خطته
    const canGenerateCover = coverDescription && userQualityConfig.canGenerateCover;
    const canGenerateChapterImages = generateChapterImages && userQualityConfig.canGenerateImages;

    // توليد غلاف الكتاب إذا كان مسموحاً للمستخدم
    let coverUrl: string | null = null;
    if (canGenerateCover && process.env.STABILITY_API_KEY) {
      try {
        coverUrl = await generateBookCover(title, coverDescription, bookType, bookLanguage, authorName);
        
        // تحديث عدد المرات المتبقية للمستخدم
        if (user.subscriptionLimits.coverGeneration > 0) {
          user.subscriptionLimits.coverGeneration -= 1;
          await user.save();
        }
      } catch (error) {
        console.error('Cover generation failed, continuing without cover:', error);
      }
    }

    const results: GeneratedChapter[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 دقيقة للمحتوى الطويل

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
          authorStyle,
          userQualityConfig.minWords
        );

        const { content, tokens } = await generateChapterContentWithFallback(
          prompt,
          bookLanguage,
          bookType,
          userQualityConfig
        );
        
        // تخزين محتوى هذا الفصل للفصول القادمة
        previousChaptersContent.push(content);

        // توليد صورة الفصل إذا كان مسموحاً للمستخدم
        let chapterImageUrl: string | null = null;
        if (canGenerateChapterImages && process.env.STABILITY_API_KEY) {
          try {
            chapterImageUrl = await generateChapterImage(
              chapter.title,
              chapter.description,
              chapter.imageDescription || "",
              title,
              bookType,
              bookLanguage
            );
            
            // تحديث عدد المرات المتبقية للمستخدم
            if (user.subscriptionLimits.imageGeneration > 0) {
              user.subscriptionLimits.imageGeneration -= 1;
              await user.save();
            }
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
          tokens: tokens,
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
        totalWords,
        userPlan: user.subscription
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