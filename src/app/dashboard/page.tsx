// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "../../untils/token";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

type TokenPayload = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export default async function DashboardPage() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return redirect("/login");

    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded?.id) return redirect("/login");

    // تحويل decoded إلى النوع User الكامل
    const user = {
      id: decoded.id,
      name: decoded.name || "User",
      email: decoded.email,
      role: decoded.role,
    };

    // تمرير إشعارات فارغة حالياً
    return <DashboardClient user={user} notifications={[]} />;
  } catch (err) {
    console.error("خطأ في التحقق من التوكن:", err);
    return redirect("/login");
  }
}
