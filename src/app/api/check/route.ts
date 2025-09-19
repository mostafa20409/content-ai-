// app/api/generate/check/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

const CONTENT_TYPE_COST = {
  article: 1,
  video_script: 0.8,
  social_media: 0.3,
  email: 0.4,
  blog_post: 1.2,
  summary: 0.5
};

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    await connectToDB();
    
    const user = await User.findOne({ email: (decoded as any).email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { contentType } = await req.json();
    const estimatedLength = 800; // تقدير متوسط للطول
    
    // التحقق من الحدود
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (!user.monthlyUsage || user.monthlyUsage.month !== currentMonth || user.monthlyUsage.year !== currentYear) {
      user.monthlyUsage = {
        month: currentMonth,
        year: currentYear,
        contentGenerated: 0,
        contentWords: 0,
        lastReset: new Date()
      };
    }

    const contentCost = Math.ceil(estimatedLength / 100) * CONTENT_TYPE_COST[contentType as keyof typeof CONTENT_TYPE_COST];
    const limits = user.subscriptionLimits || {
      monthlyRequests: 10,
      contentLimitPerMonth: 2000
    };

    if (user.subscription === "free" || user.subscription === "pro") {
      if (user.monthlyUsage.contentWords + contentCost > limits.contentLimitPerMonth) {
        return NextResponse.json(
          { error: 'SUBSCRIPTION_LIMIT_EXCEEDED' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({ allowed: true });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}