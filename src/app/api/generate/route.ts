// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { createHmac } from 'crypto';

// ========== 🔐 إعدادات السرية ==========
if (!process.env.SECRET_KEY) throw new Error('❌ SECRET_KEY غير مضبوط في البيئة');
if (!process.env.DEEPSEEK_API_KEY) throw new Error('❌ DEEPSEEK_API_KEY غير مضبوط في البيئة');

const SECRET_KEY = process.env.SECRET_KEY;

// 1. 🔥 نظام Rate Limit متطور
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'gen-api'
});

// 2. 📌 تحقق من صحة البيانات مع Zod
const requestSchema = z.object({
  topic: z.string().min(3).max(100).regex(/^[^<>&]*$/, '🚫 لا يُسمح بـ XSS!'),
  language: z.enum(['ar', 'en']).default('ar'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  isPremium: z.boolean().optional().default(false)
});

export async function POST(req: Request) {
  try {
    // 3. 🔍 استخراج عنوان الـ IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    // 4. ⏳ تطبيق Rate Limiting
    const { success, limit, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: '🚀 لقد تجاوزت الحد المسموح! حاول بعد قليل.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      );
    }

    // 5. 📦 تحليل وتحقق من البيانات
    const rawData = await req.json();
    const { topic, language, length, isPremium } = requestSchema.parse(rawData);

    // 6. 💎 تحقق من صلاحية المستخدم (نظام Premium)
    if (length === 'long' && !isPremium) {
      return NextResponse.json(
        {
          error: language === 'ar' 
            ? '🔒 تحتاج إلى اشتراك Premium لاستخدام هذه الميزة!' 
            : '🔒 Premium subscription required to use this feature!',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    // 7. 🎭 إضافة بصمة سرية
    const contentFingerprint = createHmac('sha256', SECRET_KEY)
      .update(topic + language)
      .digest('hex')
      .slice(0, 8);

    // 8. ✍ توليد المحتوى باستخدام DeepSeek API
    const lengthMap = {
      short: language === 'ar' ? 'مختصر' : 'short',
      medium: language === 'ar' ? 'متوسط' : 'medium',
      long: language === 'ar' ? 'طويل' : 'long'
    };

    // ✅ استخدام النموذج الصحيح
    const model = 'deepseek-chat'; // أو 'deepseek-reasoner' حسب الحاجة

    // ✅ نقطة النهاية الصحيحة
    const apiUrl = 'https://api.deepseek.com/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: language === 'ar'
              ? `أنت كاتب محترف. اكتب محتوى مفيد وقيِّم. البصمة: ${contentFingerprint}`
              : `You're a professional writer. Create valuable content. Fingerprint: ${contentFingerprint}`
          },
          {
            role: 'user',
            content: language === 'ar'
              ? `اكتب محتوى ${lengthMap[length]} عن: ${topic}`
              : `Write a ${lengthMap[length]} piece of content about: ${topic}`
          }
        ],
        temperature: 0.7,
        max_tokens: length === 'short' ? 300 : length === 'medium' ? 600 : 1000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 9. 🔎 التحقق من المحتوى المُولد
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('🤖 لم يتم توليد أي محتوى!');
    }

    // 10. 📤 إرجاع النتيجة
    return NextResponse.json({
      success: true,
      data: {
        content,
        fingerprint: contentFingerprint,
        model: data.model,
        tokens: data.usage?.total_tokens,
        length
      }
    });

  } catch (error) {
    // 11. 🚨 معالجة الأخطاء
    console.error('🔥 خطأ في API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '📛 بيانات غير صالحة',
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: '💥 حدث خطأ في الخادم',
        hint: process.env.NODE_ENV === 'development' ? (error as Error).message : 'تفاصيل الخطأ متاحة فقط في وضع التطوير'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: '🟢 تعمل',
    message: 'استخدم POST مع { topic: "موضوعك هنا" }',
    features: {
      languages: ['ar', 'en'],
      lengths: ['short', 'medium', 'long']
    }
  });
}