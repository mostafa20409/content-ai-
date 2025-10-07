// app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectToDB();

    // الحصول على الكوكيز من headers إذا كان Request عادي
    const cookieHeader = req.headers.get('cookie');
    let token: string | undefined;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['token'];
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    try {
      // التحقق من التوكن الحالي
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // البحث عن المستخدم
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // إنشاء توكن جديد
      const newToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );

      const response = NextResponse.json({
        success: true,
        message: 'Token refreshed successfully'
      });

      // تعيين التوكن الجديد في الكوكيز
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 // 24 ساعة
      });

      return response;

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}