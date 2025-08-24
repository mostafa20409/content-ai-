// app/api/books/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDB } from '../../../lib/connectToDB';
import Book from '../../../models/Book';
import User from '../../../models/User';


export async function POST(req: Request) {
  try {
    
    
    // قراءة التوكن من الكوكيز
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح، سجل الدخول أولاً' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET غير معرف في البيئة');
    }

    // التحقق من التوكن
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'التوكن غير صالح أو انتهت صلاحيته' }, { status: 401 });
    }

    // الاتصال بقاعدة البيانات
    await connectToDB();

    // التأكد من وجود المستخدم
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // قراءة البيانات المرسلة
    const body = await req.json();
    const { title, chapters, language } = body;

    if (!title || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'الكتاب أو الفصول غير صحيحة' }, { status: 400 });
    }

    // إنشاء كتاب جديد
    const newBook = new Book({
      title,
      chapters,
      language: language || 'ar',
      author: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      createdAt: new Date(),
    });

    await newBook.save();

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الكتاب بنجاح',
      bookId: newBook._id,
    });
  } catch (error: any) {
    console.error('Book save error:', error);

    if (error.type === 'limit') {
      return NextResponse.json(
        { error: 'لقد تجاوزت الحد المسموح به من المحاولات، حاول لاحقاً' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء حفظ الكتاب',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(_req: Request) {
  try {
    // التحقق من التوكن
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET غير معرف');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'التوكن غير صالح' }, { status: 401 });
    }

    await connectToDB();

    // جلب الكتب الخاصة بالمستخدم
    const books = await Book.find({ 'author.id': decoded.id }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    console.error('Get books error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الكتب' },
      { status: 500 }
    );
  }
}