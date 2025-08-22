// app/api/books/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from '../../../../lib/connectToDB';
import User from '../../../../models/User';
import rateLimit from '../../../../lib/rateLimit';

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 دقيقة
  uniqueTokenPerInterval: 500,
});

// ✅ التصحيح: استخدام base_url الصحيح
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEEPSEEK_CHAT_ENDPOINT = '/chat/completions'; // المسار الصحيح

// دالة للتحقق من صحة DeepSeek API
async function validateDeepSeekAPI(apiKey: string): Promise<boolean> {
  try {
    // ✅ التصحيح: استخدام endpoint صحيح للتحقق
    const response = await fetch(`${DEEPSEEK_API_BASE}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('❌ DeepSeek API validation failed:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await limiter.check(10, ip);

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

    const { title, description, language, chapterNumber, totalChapters } = await req.json();
    if (!title || !description || !language) {
      return NextResponse.json({ error: "كل الحقول مطلوبة" }, { status: 400 });
    }

    // التحقق من وجود مفتاح DeepSeek API
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح DeepSeek API غير موجود في البيئة" },
        { status: 500 }
      );
    }

    // ✅ التحقق من صحة API
    const isAPIValid = await validateDeepSeekAPI(process.env.DEEPSEEK_API_KEY);
    if (!isAPIValid) {
      return NextResponse.json(
        { error: "مشكلة في اتصال DeepSeek API. يرجى التحقق من المفتاح." },
        { status: 500 }
      );
    }

    // إعداد prompt للذكاء الاصطناعي
    const prompt = language === 'ar' 
      ? `
        أنت كاتب محترف متخصص في تأليف الكتب. 
        اكتب الفصل ${chapterNumber} من ${totalChapters} لكتاب بعنوان "${title}".
        
        وصف الكتاب: ${description}
        
        المتطلبات:
        - اللغة: العربية الفصحى
        - المحتوى: مفصل، جذاب، ومناسب للقارئ العربي
        - الأسلوب: احترافي وسلس
        - الهيكل: مقدمة، محتوى رئيسي، خاتمة
        - الطول: حوالي 1000-1500 كلمة
        
        قدم محتوى غنياً ذا قيمة حقيقية للقارئ.
      `
      : `
        You are a professional book writer.
        Write chapter ${chapterNumber} of ${totalChapters} for a book titled "${title}".
        
        Book description: ${description}
        
        Requirements:
        - Language: Professional English
        - Content: Detailed, engaging, and suitable for the target audience
        - Style: Professional and smooth
        - Structure: Introduction, main content, conclusion
        - Length: Approximately 1000-1500 words
        
        Provide rich content with real value for the reader.
      `;

    // ✅ استخدام DeepSeek API مع endpoint الصحيح
    const apiUrl = `${DEEPSEEK_API_BASE}${DEEPSEEK_CHAT_ENDPOINT}`;
    
    console.log("📡 Sending request to DeepSeek API...");
    console.log("🔑 API Key exists:", !!process.env.DEEPSEEK_API_KEY);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 ثانية timeout

    try {
      const requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: language === 'ar' 
              ? "أنت كاتب محترف متخصص في تأليف الكتب. قدم محتوى قيماً وجذاباً بطريقة إبداعية."
              : "You are a professional book writer. Provide valuable and engaging content in a creative way."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.8, // زيادة قليلاً للإبداع
        stream: false,
        frequency_penalty: 0.2, // تقليل التكرار
        presence_penalty: 0.1    // تشجيع التنوع
      };

      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

      const aiRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log("📥 API Response status:", aiRes.status);
      
      if (!aiRes.ok) {
        const errorText = await aiRes.text();
        console.error("❌ DeepSeek API error:", aiRes.status, errorText);
        
        let errorMessage = "خطأ في توليد المحتوى";
        let errorDetails = {};
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorText;
          errorDetails = errorData.error || {};
        } catch {
          errorMessage = errorText;
        }

        return NextResponse.json(
          { 
            error: errorMessage,
            status: aiRes.status,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
          },
          { status: aiRes.status }
        );
      }

      const data = await aiRes.json();
      console.log("✅ DeepSeek API response received");
      console.log("🤖 Model used:", data.model);
      console.log("🔢 Tokens used:", data.usage?.total_tokens);
      
      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        console.warn("⚠️ No content generated from API");
        return NextResponse.json(
          { error: "لم يتم توليد محتوى، يرجى المحاولة مرة أخرى" },
          { status: 500 }
        );
      }

      console.log("📝 Content length:", content.length, "characters");

      return NextResponse.json({
        success: true,
        chapter: chapterNumber,
        content,
        model: data.model,
        tokens: data.usage?.total_tokens,
        completion: data.choices?.[0]?.finish_reason
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error("⏰ API request timeout");
        return NextResponse.json(
          { error: "انتهت مهلة الاتصال بـ DeepSeek API. حاول مرة أخرى." },
          { status: 408 }
        );
      }
      
      console.error("🔥 Unexpected error:", error);
      throw error;
    }

  } catch (error: any) {
    if (error?.type === "limit") {
      return NextResponse.json(
        { error: "لقد تجاوزت عدد المحاولات المسموح بها" },
        { status: 429 }
      );
    }

    console.error("❌ Book generation error:", error);
    
    return NextResponse.json(
      { 
        error: "حدث خطأ في الخادم",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// نقطة نهاية اختبارية
export async function GET() {
  // اختبار اتصال بسيط
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({
      status: '🔴 غير متصل',
      error: 'مفتاح API غير موجود',
      message: 'يرجى إضافة DEEPSEEK_API_KEY في ملف .env.local'
    });
  }

  try {
    const testResponse = await fetch('https://api.deepseek.com/models', {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    });

    return NextResponse.json({
      status: testResponse.ok ? '🟢 متصل' : '🔴 غير متصل',
      apiStatus: testResponse.status,
      message: testResponse.ok ? 
        'الاتصال بـ DeepSeek API يعمل بشكل صحيح' : 
        'فشل الاتصال بـ DeepSeek API',
      provider: 'DeepSeek API',
      modelsEndpoint: testResponse.ok ? 'يعمل' : 'لا يعمل'
    });
  } catch (error) {
    return NextResponse.json({
      status: '🔴 غير متصل',
      error: 'فشل الاتصال بـ DeepSeek API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}