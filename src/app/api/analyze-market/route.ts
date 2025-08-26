import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/connectToDB';
import Analysis from '@/models/Analysis';

// استبدل useCallback بدالة عادية غير مرتبطة بـ React Hooks
async function analyzeMarket(_input: string, lang: string = 'ar') {
  try {
    // محاكاة لتحليل السوق
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      data: {
        trend: lang === 'ar' ? 'اتجاه صاعد' : 'Upward trend',
        recommendation: lang === 'ar' ? 'شراء مقترح' : 'Buy recommended',
        confidence: 0.85
      }
    };
  } catch (error) {
    console.error('Market analysis error:', error);
    return {
      success: false,
      error: lang === 'ar' ? 'فشل في تحليل السوق' : 'Market analysis failed'
    };
  }
}

export async function POST(request: Request) {
  try {
    const { input, lang = 'ar' } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: lang === 'ar' ? 'المدخلات مطلوبة' : 'Input is required' },
        { status: 400 }
      );
    }

    await connectToDB();
    
    // استخدام الدالة العادية بدلاً من useCallback
    const analysisResult = await analyzeMarket(input, lang);
    
    if (!analysisResult.success) {
      return NextResponse.json(
        { error: analysisResult.error },
        { status: 500 }
      );
    }

    // حفظ التحليل في قاعدة البيانات
    const newAnalysis = new Analysis({
      input,
      result: analysisResult.data,
      language: lang,
      createdAt: new Date()
    });

    await newAnalysis.save();

    return NextResponse.json({
      success: true,
      data: analysisResult.data,
      id: newAnalysis._id
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST method to analyze market' },
    { status: 200 }
  );
}