// app/api/generate/check/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

// تكوين التوليد
const GENERATION_CONFIG = {
  maxTokens: {
    short: 500,
    medium: 1000,
    long: 2000
  }
};

// تكلفة كل نوع محتوى
const CONTENT_TYPE_COST = {
  article: 1,
  video_script: 0.8,
  social_media: 0.3,
  email: 0.4,
  blog_post: 1.2,
  summary: 0.5
};

// دالة للتحقق من حدود الاشتراك
async function checkSubscriptionLimits(user: any, contentType: string, contentLength: number) {
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

  const contentCost = Math.ceil(contentLength / 100) * CONTENT_TYPE_COST[contentType as keyof typeof CONTENT_TYPE_COST];
  const limits = user.subscriptionLimits || {
    monthlyRequests: 10,
    contentLimitPerMonth: 2000
  };

  if (user.subscription === "free" || user.subscription === "pro") {
    if (user.monthlyUsage.contentWords + contentCost > limits.contentLimitPerMonth) {
      return { allowed: false, error: "SUBSCRIPTION_LIMIT_EXCEEDED" };
    }
  }

  return { allowed: true, contentCost };
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid token'
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { contentType } = body;

    if (!contentType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Content type is required'
        },
        { status: 400 }
      );
    }

    const estimatedLength = GENERATION_CONFIG.maxTokens.medium;
    const subscriptionCheck = await checkSubscriptionLimits(user, contentType, estimatedLength);

    if (!subscriptionCheck.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
          message: 'Monthly limit exceeded'
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      subscription: user.subscription,
      limits: user.subscriptionLimits,
      usage: user.monthlyUsage,
      remaining: Math.max(0, ((user.subscriptionLimits?.contentLimitPerMonth || 2000) - (user.monthlyUsage?.contentWords || 0)))
    });

  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}