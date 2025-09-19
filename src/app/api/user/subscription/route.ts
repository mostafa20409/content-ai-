// app/api/user/subscription/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

export async function GET() {
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

    // إرجاع معلومات الاشتراك
    return NextResponse.json({
      type: user.subscription || 'free',
      limits: user.subscriptionLimits || {
        monthlyRequests: 10,
        contentLimitPerMonth: 2000
      },
      usage: {
        contentUsedThisMonth: user.monthlyUsage?.contentWords || 0,
        contentGenerated: user.monthlyUsage?.contentGenerated || 0
      }
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}