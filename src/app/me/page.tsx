"use client";

import { useEffect, useState } from "react";

export default function MePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          throw new Error("غير مصرح بالدخول أو لم يتم العثور على الحساب");
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 shadow-lg rounded-lg w-full max-w-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-teal-400 border-b border-gray-700 pb-2">
          👤 بيانات الحساب
        </h1>

        {/* حالة التحميل */}
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400"></div>
          </div>
        )}

        {/* حالة الخطأ */}
        {!loading && error && (
          <div className="bg-red-600 p-3 rounded mb-4 text-center font-semibold">
            {error}
          </div>
        )}

        {/* عرض البيانات */}
        {!loading && user && (
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">الاسم</p>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">البريد الإلكتروني</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">تاريخ الانضمام</p>
              <p className="text-lg font-semibold">
                {new Date(user.createdAt).toLocaleDateString("ar-EG")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}