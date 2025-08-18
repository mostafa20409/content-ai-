import mongoose from "mongoose";
import { NextResponse } from "next/server";

// كاش الاتصال لمنع إعادة الاتصال كل مرة
let isConnected = false;

const connectToDB = async () => {
  if (isConnected) {
    console.log("✅ تم استخدام الاتصال الحالي بـ MongoDB");
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ متغير البيئة MONGODB_URI غير موجود");

  try {
    await mongoose.connect(uri, {
      dbName: "content-ai", // اسم قاعدة البيانات (غيّره حسب ما تريد)
    });
    isConnected = true;
    console.log("✅ تم الاتصال بـ MongoDB بنجاح");
  } catch (error) {
    console.error("❌ فشل الاتصال بـ MongoDB:", error);
    throw new Error("فشل الاتصال بـ MongoDB");
  }
};

export async function GET() {
  try {
    await connectToDB();
    return NextResponse.json(
      { success: true, message: "✅ الاتصال بقاعدة البيانات تم بنجاح" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "❌ حدث خطأ أثناء الاتصال بقاعدة البيانات",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}