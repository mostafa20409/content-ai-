"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState("جاري تسجيل الخروج...");

  useEffect(() => {
    async function handleLogout() {
      try {
        const res = await fetch("/api/logout", { method: "POST" });

        if (res.ok) {
          setStatus("تم تسجيل الخروج بنجاح ✅");
          setTimeout(() => {
            router.push("/login");
          }, 1500); // انتظار 1.5 ثانية قبل التوجيه
        } else {
          setStatus("فشل تسجيل الخروج ❌");
        }
      } catch (error) {
        console.error("Logout error:", error);
        setStatus("حدث خطأ أثناء تسجيل الخروج ❌");
      }
    }

    handleLogout();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{status}</p>
    </div>
  );
}