// app/signup/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// تعريف نوع البيانات للنموذج
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// تعريف نوع الأخطاء
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function SignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // مسح الخطأ عند البدء في الكتابة
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    
    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون على الأقل 6 أحرف";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // إذا نجح التسجيل، توجيه إلى Dashboard مباشرة
        router.push("/dashboard");
      } else {
        setErrors({ submit: data.error || "حدث خطأ أثناء التسجيل" });
      }
    } catch (error) {
      setErrors({ submit: "حدث خطأ في الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "450px"
        }}
      >
        <h2 style={{ 
          marginBottom: "1.5rem", 
          textAlign: "center", 
          color: "#333",
          fontSize: "1.8rem"
        }}>
          إنشاء حساب جديد
        </h2>

        {errors.submit && (
          <div style={{
            padding: "10px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "6px",
            marginBottom: "1rem",
            textAlign: "center"
          }}>
            {errors.submit}
          </div>
        )}

        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>الاسم الكامل</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: errors.name ? "1px solid #d32f2f" : "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.name && <span style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{errors.name}</span>}
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>البريد الإلكتروني</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: errors.email ? "1px solid #d32f2f" : "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.email && <span style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{errors.email}</span>}
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>كلمة المرور</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: errors.password ? "1px solid #d32f2f" : "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.password && <span style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{errors.password}</span>}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>تأكيد كلمة المرور</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: errors.confirmPassword ? "1px solid #d32f2f" : "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.confirmPassword && <span style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#aaa" : "#0070f3",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s",
            marginBottom: "1rem"
          }}
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </button>

        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#666" }}>لديك حساب بالفعل؟ </span>
          <Link href="/login" style={{ color: "#0070f3", textDecoration: "none" }}>
            تسجيل الدخول
          </Link>
        </div>
      </form>
    </div>
  );
}