// app/api/books/generate-cover/route.ts
import { NextResponse } from "next/server";

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
  _language: string,
  authorName: string = "مؤلف الكتاب"
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

export async function POST(req: Request) {
  try {
    const { title, coverDescription, bookType, language, authorName } = await req.json();

    if (!title || !coverDescription) {
      return NextResponse.json(
        { error: "Title and cover description are required" },
        { status: 400 }
      );
    }

    if (!process.env.STABILITY_API_KEY) {
      return NextResponse.json(
        { error: "Stability API key not configured" },
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
      coverUrl
    });

  } catch (error: any) {
    console.error("Cover generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate cover" },
      { status: 500 }
    );
  }
}

// دعم طريقة GET لعرض معلومات عن الخدمة
export async function GET() {
  return NextResponse.json({
    service: "Book Cover Generation",
    provider: "Stability AI v2beta",
    features: [
      "Black and white book covers",
      "Classic design",
      "Arabic text support",
      "High quality JPEG output",
      "Customizable size and style"
    ],
    required_fields: ["title", "coverDescription"],
    optional_fields: ["bookType", "language", "authorName"]
  });
}