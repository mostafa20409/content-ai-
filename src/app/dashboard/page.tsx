// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "../../untils/token";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { connectToDB } from "../../lib/connectToDB";
import User from "../../models/User";
import Content from "../../models/Content";
import Book from "../../models/Book";
import Ad from "../../models/Ad";
import { DashboardUser, ContentItem, BookItem, AdItem } from "../../types/dashboard";

type TokenPayload = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

// دالة مساعدة لتحويل بيانات MongoDB إلى النوع المطلوب
function mapUserToDashboardUser(user: any, decoded: TokenPayload, contentCount: number, booksCount: number, adsCount: number): DashboardUser {
  return {
    id: decoded.id,
    name: user?.name || decoded.name || "User",
    email: user?.email || decoded.email || "",
    role: user?.role || decoded.role || "user",
    subscription: user?.subscription || "free",
    usage: {
      ads: user?.adsUsedThisMonth || 0,
      keywords: user?.keywordsUsedThisMonth || 0,
      content: user?.contentUsedThisMonth || 0,
      books: user?.booksUsedThisMonth || 0,
    },
    contentCount,
    booksCount,
    adsCount,
    createdAt: user?.createdAt || new Date(),
    lastUpdated: user?.updatedAt || new Date()
  };
}

export default async function DashboardPage() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return redirect("/login");

    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded?.id) return redirect("/login");

    // الاتصال بقاعدة البيانات وجلب البيانات الحقيقية
    await connectToDB();
    
    // جلب بيانات المستخدم باستخدام any لتجنب مشاكل TypeScript
    const user = await User.findById(decoded.id).lean() as any;
    if (!user) return redirect("/login");

    // جلب المحتوى الحقيقي للمستخدم
    const contentItems = await Content.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(6).lean() as unknown as ContentItem[];
    const bookItems = await Book.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(6).lean() as unknown as BookItem[];
    const adItems = await Ad.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(6).lean() as unknown as AdItem[];

    // جلب الإحصائيات الحقيقية
    const contentCount = await Content.countDocuments({ userId: decoded.id });
    const booksCount = await Book.countDocuments({ userId: decoded.id });
    const adsCount = await Ad.countDocuments({ userId: decoded.id });

    // تحويل البيانات إلى النوع المطلوب
    const userWithStats = mapUserToDashboardUser(user, decoded, contentCount, booksCount, adsCount);

    // تمرير البيانات الحقيقية إلى المكون
    return <DashboardClient 
      user={userWithStats} 
      notifications={[]} 
      contentItems={contentItems}
      bookItems={bookItems}
      adItems={adItems}
    />;
  } catch (err) {
    console.error("خطأ في التحقق من التوكن:", err);
    return redirect("/login");
  }
}