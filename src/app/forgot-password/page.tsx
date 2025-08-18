"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
      >
        {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
      </button>

      {message && <p style={{ color: "green", textAlign: "center" }}>{message}</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
    </div>
  );
}