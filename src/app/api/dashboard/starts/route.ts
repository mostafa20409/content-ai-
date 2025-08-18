import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {connectToDB} from "../../../../lib/connectToDB";
import User from "../../../../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// نوع بيانات الإحصائيات المعادة
interface StatsResponse {
  adsUsedThisMonth: number;
  keywordsUsedThisMonth: number;
  contentUsedThisMonth: number;
  booksUsedThisMonth: number;
  subscription: "free" | "pro" | "premium";
}

export async function GET(req: Request) {
  try {
    // قراءة توكن التوثيق من الهيدر Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token missing" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // تحقق من التوكن
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // تأكد من الاتصال بقاعدة البيانات
    await connectToDB();

    // جلب بيانات المستخدم (باستثناء كلمة المرور)
    const user = await User.findById(decoded.id).select(
      "adsUsedThisMonth keywordsUsedThisMonth contentUsedThisMonth booksUsedThisMonth subscription"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // بناء الإحصائيات المراد إرسالها
    const stats: StatsResponse = {
      adsUsedThisMonth: user.adsUsedThisMonth || 0,
      keywordsUsedThisMonth: user.keywordsUsedThisMonth || 0,
      contentUsedThisMonth: user.contentUsedThisMonth || 0,
      booksUsedThisMonth: user.booksUsedThisMonth || 0,
      subscription: user.subscription,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
