// app/api/books/generate-chapter-images/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDB";
import Book from "@/models/Book";
import { arabicToEnglishDescription } from "@/lib/utils";

// واجهة للكتاب لتجنب أخطاء TypeScript
interface IBook {
  _id: string;
  title: string;
  type: string;
  language: string;
  chapters: Array<{
    title: string;
    description: string;
    content: string;
    imageUrl?: string;
    imageDescription?: string;
  }>;
  save(): Promise<any>;
}

// واجهة لنتيجة توليد الصورة
interface IImageGenerationResult {
  chapterIndex: number;
  success: boolean;
  imageUrl?: string;
  error?: string;
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
    const bookTypeName = BOOK_TYPES[bookType as keyof typeof BOOK_TYPES] || bookType;
    
    // تحويل الوصف العربي إلى إنجليزي إذا لزم الأمر
    let processedDescription = chapterImageDescription;
    if (language === 'ar') {
      processedDescription = arabicToEnglishDescription(chapterImageDescription);
    }
    
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Black and white illustration for chapter: "${chapterTitle}"
      From book: "${bookTitle}"
      Book type: ${bookTypeName}
      Chapter description: ${chapterDescription}
      ${processedDescription ? `Image description: ${processedDescription}` : ''}
      
      Specifications:
      - Elegant black and white drawing
      - Simple and clear design
      - No text included
      - 1:1 aspect ratio
      - Grayscale only
      - High quality suitable for publishing
    `.trim();

    // التحقق من وجود مفتاح API
    if (!process.env.STABILITY_API_KEY) {
      throw new Error('Stability API key not configured');
    }

    // استخدام Stability AI v2beta مع multipart/form-data
    const formData = new FormData();
    formData.append('prompt', prompt);
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
      console.error("Stability AI API error:", response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid API key for Stability AI');
      } else if (response.status === 402) {
        throw new Error('Insufficient balance for Stability AI');
      } else if (response.status === 404) {
        throw new Error('Stability AI model not found');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded for Stability AI');
      } else {
        throw new Error(`Stability AI error: ${response.status} ${errorText}`);
      }
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;

  } catch (error) {
    console.error('Chapter image generation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate chapter image');
  }
}

export async function POST(req: Request) {
  try {
    await connectToDB();

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "تنسيق JSON غير صالح" },
        { status: 400 }
      );
    }

    const { bookId, chapterIndexes, language = "ar" } = body;

    if (!bookId || !chapterIndexes || !Array.isArray(chapterIndexes)) {
      return NextResponse.json(
        { error: "معرف الكتاب ومصفوفة فهارس الفصول مطلوبة" },
        { status: 400 }
      );
    }

    const book = await Book.findById(bookId) as unknown as IBook;
    if (!book) {
      return NextResponse.json(
        { error: "الكتاب غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من وجود مفتاح Stability AI API
    if (!process.env.STABILITY_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح Stability AI غير موجود" },
        { status: 500 }
      );
    }

    const results: IImageGenerationResult[] = [];
    
    for (const chapterIndex of chapterIndexes) {
      if (!book.chapters || !book.chapters[chapterIndex]) {
        results.push({
          chapterIndex,
          success: false,
          error: "الفصل غير موجود"
        });
        continue;
      }

      const chapter = book.chapters[chapterIndex];
      
      // التحقق من وجود الحقول المطلوبة
      if (!book.title || !chapter.title || !book.type) {
        results.push({
          chapterIndex,
          success: false,
          error: "بيانات غير كافية لتوليد الصورة"
        });
        continue;
      }

      try {
        const imageUrl = await generateChapterImage(
          chapter.title,
          chapter.description || "",
          chapter.imageDescription || "",
          book.title,
          book.type,
          language
        );

        // تحديث حقل imageUrl للفصل
        book.chapters[chapterIndex].imageUrl = imageUrl;
        results.push({
          chapterIndex,
          success: true,
          imageUrl: imageUrl
        });

      } catch (aiError) {
        console.error(`AI Image Generation Error for chapter ${chapterIndex}:`, aiError);
        results.push({
          chapterIndex,
          success: false,
          error: "فشل في توليد الصورة"
        });
      }

      // تأخير بين الطلبات لتجنب تجاوز معدل الطلبات
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // حفظ التغييرات في قاعدة البيانات
    await book.save();

    return NextResponse.json({
      success: true,
      message: "تم معالجة طلبات توليد الصور",
      result: results
    });

  } catch (error: any) {
    console.error("❌ Error in generate chapter images:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد صور الفصول: " + error.message },
      { status: 500 }
    );
  }
}

// دعم طريقة GET لاسترجاع معلومات الكتاب
export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { error: "معرف الكتاب مطلوب" },
        { status: 400 }
      );
    }

    const book = await Book.findById(bookId) as unknown as IBook;
    if (!book) {
      return NextResponse.json(
        { error: "الكتاب غير موجود" },
        { status: 404 }
      );
    }

    // إرجاع معلومات الفصول فقط
    const chaptersInfo = book.chapters.map((chapter, index) => ({
      index,
      title: chapter.title,
      description: chapter.description,
      hasImage: !!chapter.imageUrl,
      imageDescription: chapter.imageDescription || ""
    }));

    return NextResponse.json({
      success: true,
      bookTitle: book.title,
      bookType: book.type,
      chapters: chaptersInfo
    });

  } catch (error: any) {
    console.error("❌ Error fetching book chapters:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب معلومات الفصول: " + error.message },
      { status: 500 }
    );
  }
}