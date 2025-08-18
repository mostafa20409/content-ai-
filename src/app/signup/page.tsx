"use client";
import { useState } from "react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // هنا المفروض تبعت البيانات لـ API بتاع التسجيل
    console.log({ name, email, password });

    alert("تم تسجيل الحساب بنجاح (ديمو) 🎉");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f9f9f9"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px"
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>إنشاء حساب</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label>الاسم</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>الإيميل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#0070f3",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          تسجيل
        </button>
      </form>
    </div>
  );
}