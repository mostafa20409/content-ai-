// app/api/books/generate-cover/route.ts
import { NextResponse } from "next/server";
import { arabicToEnglishDescription } from "@/lib/utils";

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

// دالة لتوليد غلاف الكتاب باستخدام Stability AI
async function generateBookCover(
  bookTitle: string, 
  coverDescription: string, 
  bookType: string, 
  language: string,
  authorName: string = "مؤلف الكتاب"
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
      - Modern and attractive design
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
    console.error('Book cover generation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate book cover');
  }
}

export async function POST(req: Request) {
  try {
    const { title, coverDescription, bookType, language, authorName } = await req.json();

    // التحقق من الحقول المطلوبة
    if (!title || !coverDescription) {
      return NextResponse.json(
        { error: "عنوان الكتاب ووصف الغلاف مطلوبان" },
        { status: 400 }
      );
    }

    // التحقق من طول وصف الغلاف
    const wordCount = coverDescription.trim().split(/\s+/).length;
    if (wordCount > 40) {
      return NextResponse.json(
        { error: "وصف الغلاف يجب ألا يتجاوز 40 كلمة" },
        { status: 400 }
      );
    }

    // التحقق من وجود مفتاح API
    if (!process.env.STABILITY_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح Stability AI غير مضبوط" },
        { status: 500 }
      );
    }

    const coverUrl = await generateBookCover(
      title, 
      coverDescription, 
      bookType || "LITERARY", 
      language || "ar",
      authorName || "مؤلف الكتاب"
    );

    return NextResponse.json({
      success: true,
      coverUrl,
      message: "تم توليد غلاف الكتاب بنجاح"
    });

  } catch (error: any) {
    console.error("Cover generation error:", error);
    
    // رسائل خطأ أكثر وصفية
    let errorMessage = "فشل في توليد الغلاف";
    if (error.message.includes("API")) {
      errorMessage = "خطأ في اتصال خدمة الذكاء الاصطناعي";
    } else if (error.message.includes("key")) {
      errorMessage = "مفتاح API غير صالح أو منتهي الصلاحية";
    }
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// دعم طريقة GET لعرض معلومات عن الخدمة
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'ar';
  
  const isArabic = lang === 'ar';
  
  return NextResponse.json({
    service: isArabic ? "توليد أغلفة الكتب" : "Book Cover Generation",
    provider: "Stability AI v2beta",
    features: isArabic ? [
      "أغلفة كتب عالية الجودة",
      "تصميم احترافي",
      "دعم النص العربي",
      "جودة عالية 300 DPI",
      "تصميم قابل للتخصيص"
    ] : [
      "High quality book covers",
      "Professional design",
      "Arabic text support",
      "300 DPI high quality",
      "Customizable design"
    ],
    requirements: isArabic ? {
      title: "عنوان الكتاب (مطلوب)",
      coverDescription: "وصف الغلاف (مطلوب، 40 كلمة كحد أقصى)",
      bookType: "نوع الكتاب (اختياري)",
      authorName: "اسم المؤلف (اختياري)"
    } : {
      title: "Book title (required)",
      coverDescription: "Cover description (required, max 40 words)",
      bookType: "Book type (optional)",
      authorName: "Author name (optional)"
    },
    bookTypes: BOOK_TYPES,
    status: "active"
  });
}