"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    // تحقق من الصحة على جانب العميل
    if (!email) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "حدث خطأ");

      setMessage(data.message);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 24, textAlign: "center" }}>نسيت كلمة المرور</h2>
      
      <p style={{ marginBottom: 20, textAlign: "center", color: "#666" }}>
        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
      </p>

      <label htmlFor="email" style={{ display: "block", marginBottom: 6 }}>
        البريد الإلكتروني:
      </label>
      <input
        id="email"
        type="email"
        placeholder="أدخل بريدك الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }}
        disabled={loading}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          backgroundColor: loading ? "#999" : "#0070f3",
          color: "#fff",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
        aria-label={loading ? "جاري الإرسال" : "إرسال رابط إعادة التعيين"}
      >
        {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
      </button>

      {message && (
        <div style={{ 
          color: "green", 
          textAlign: "center", 
          padding: 10, 
          backgroundColor: "#f0fff0", 
          borderRadius: 6,
          marginBottom: 12
        }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ 
          color: "red", 
          textAlign: "center", 
          padding: 10, 
          backgroundColor: "#fff0f0", 
          borderRadius: 6,
          marginBottom: 12
        }}>
          {error}
        </div>
      )}
    </div>
  );
}