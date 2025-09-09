// app/api/books/generate-chapter-images/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDB";
import Book from "@/models/Book";

// واجهة للكتاب لتجنب أخطاء TypeScript
interface IBook {
  _id: string;
  title: string;
  type: string;
  chapters: Array<{
    title: string;
    content: string;
    imageUrl?: string;
    description?: string;
  }>;
  save(): Promise<any>;
}

// دالة لتوليد صورة الفصل باستخدام Stability AI
async function generateChapterImage(
  chapterTitle: string,
  chapterDescription: string,
  bookTitle: string,
  bookType: string
): Promise<string> {
  try {
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `
      Black and white illustration for chapter: "${chapterTitle}"
      From book: "${bookTitle}"
      Book type: ${bookType}
      Chapter description: ${chapterDescription}
      
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

    const { bookId, chapterIndex } = body;

    if (!bookId || chapterIndex === undefined) {
      return NextResponse.json(
        { error: "معرف الكتاب وفهرس الفصل مطلوبان" },
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

    if (!book.chapters || !book.chapters[chapterIndex]) {
      return NextResponse.json(
        { error: "الفصل غير موجود" },
        { status: 404 }
      );
    }

    const chapter = book.chapters[chapterIndex];
    
    // التحقق من وجود الحقول المطلوبة
    if (!book.title || !chapter.title || !book.type) {
      return NextResponse.json(
        { error: "بيانات غير كافية لتوليد الصورة" },
        { status: 400 }
      );
    }

    // التحقق من وجود مفتاح Stability AI API
    if (!process.env.STABILITY_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح Stability AI غير موجود" },
        { status: 500 }
      );
    }

    let imageUrl;
    try {
      imageUrl = await generateChapterImage(
        chapter.title,
        chapter.description || "",
        book.title,
        book.type
      );
    } catch (aiError) {
      console.error("AI Image Generation Error:", aiError);
      return NextResponse.json(
        { error: "فشل في توليد صور الفصول" },
        { status: 500 }
      );
    }

    // تحديث حقل imageUrl بدلاً من image
    book.chapters[chapterIndex].imageUrl = imageUrl;
    await book.save();

    return NextResponse.json({
      success: true,
      message: "تم توليد صورة الفصل بنجاح",
      imageUrl: imageUrl
    });

  } catch (error: any) {
    console.error("❌ Error in generate chapter images:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد صور الفصول: " + error.message },
      { status: 500 }
    );
  }
}