"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const locales = {
  en: {
    loginTitle: "Login to Your Account",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",
    createAccount: "Create New Account",
    submit: "Sign In",
    languageToggle: "عربي",
    showPassword: "Show Password",
    hidePassword: "Hide Password",
    invalidEmail: "Please enter a valid email.",
    requiredField: "This field is required.",
    networkError: "Network error. Please check your connection and try again.",
    serverError: "Server error. Please try again later.",
    tooManyRequests: "Too many attempts. Please try again later.",
  },
  ar: {
    loginTitle: "تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    createAccount: "إنشاء حساب جديد",
    submit: "تسجيل الدخول",
    languageToggle: "English",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    requiredField: "هذا الحقل مطلوب.",
    networkError: "خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
    serverError: "خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.",
    tooManyRequests: "تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة مرة أخرى لاحقاً.",
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = locales[lang];
  const router = useRouter();

  const [email, setEmail] = useState("test@example.com"); // إضافة قيمة افتراضية للتجربة
  const [password, setPassword] = useState("password"); // إضافة قيمة افتراضية للتجربة
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  // إصلاح مشكلة localStorage مع SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  useEffect(() => {
    if (email && typeof window !== "undefined") {
      localStorage.setItem("email", email);
    }
  }, [email]);

  const validate = () => {
    let valid = true;
    const errs: typeof error = {};

    if (!email.trim()) {
      errs.email = t.requiredField;
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = t.invalidEmail;
      valid = false;
    }

    if (!password.trim()) {
      errs.password = t.requiredField;
      valid = false;
    }

    setError(errs);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setError({});

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // التحقق من حالة الرد
      if (res.status === 429) {
        setError({ general: t.tooManyRequests });
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        setError({ general: t.serverError });
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError({ general: data.error || data.message || t.serverError });
        setLoading(false);
        return;
      }

      if (data.success) {
        router.push(data.redirect || "/dashboard");
      } else {
        setError({ general: data.error || "Login failed" });
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError({ general: t.networkError });
      setLoading(false);
    }
  };

  return (
    <div style={{
      boxSizing: 'border-box',
      margin: 0, 
      padding: 0, 
      background: '#f0f2f5',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        margin: '60px auto',
        background: '#fff',
        padding: '32px 28px 40px 28px',
        borderRadius: '14px',
        boxShadow: '0 12px 25px rgba(0,0,0,0.1)',
        direction: lang === "ar" ? "rtl" : "ltr",
        position: 'relative'
      }}>
        <button
          style={{
            position: 'absolute',
            top: '18px',
            right: lang === "ar" ? 'auto' : '20px',
            left: lang === "ar" ? '20px' : 'auto',
            background: 'transparent',
            border: 'none',
            fontWeight: 700,
            color: '#0070f3',
            cursor: 'pointer',
            fontSize: '14px',
            userSelect: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#005bb5'}
          onMouseOut={(e) => e.currentTarget.style.color = '#0070f3'}
          aria-label="Toggle Language"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          type="button"
        >
          {t.languageToggle}
        </button>

        <h2 style={{
          marginBottom: '28px',
          fontWeight: 700,
          fontSize: '26px',
          color: '#222',
          textAlign: 'center'
        }}>
          {t.loginTitle}
        </h2>

        <label htmlFor="email" style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
          color: '#333'
        }}>
          {t.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '10px',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0070f3';
            e.target.style.boxShadow = '0 0 6px rgba(0,112,243,0.4)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ddd';
            e.target.style.boxShadow = 'none';
          }}
          placeholder={t.email}
          disabled={loading}
        />
        <div style={{
          color: '#d93025',
          fontSize: '13px',
          marginTop: '6px',
          marginBottom: '12px',
          minHeight: '18px',
          fontWeight: 600,
          userSelect: 'none'
        }}>
          {error.email || "\u00A0"}
        </div>

        <label htmlFor="password" style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
          color: '#333'
        }}>
          {t.password}
        </label>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '10px',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
              paddingRight: lang === "ar" ? '16px' : '50px',
              paddingLeft: lang === "ar" ? '50px' : '16px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0070f3';
              e.target.style.boxShadow = '0 0 6px rgba(0,112,243,0.4)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ddd';
              e.target.style.boxShadow = 'none';
            }}
            placeholder={t.password}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: '#0070f3',
              background: 'none',
              border: 'none',
              userSelect: 'none',
              transition: 'color 0.3s ease',
              right: lang === "ar" ? 'auto' : '16px',
              left: lang === "ar" ? '16px' : 'auto'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#005bb5'}
            onMouseOut={(e) => e.currentTarget.style.color = '#0070f3'}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            disabled={loading}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        <div style={{
          color: '#d93025',
          fontSize: '13px',
          marginTop: '6px',
          marginBottom: '12px',
          minHeight: '18px',
          fontWeight: 600,
          userSelect: 'none'
        }}>
          {error.password || "\u00A0"}
        </div>

        <button
          style={{
            width: '100%',
            padding: '14px 0',
            marginTop: '16px',
            background: loading ? '#999' : '#0070f3',
            color: '#fff',
            fontWeight: 700,
            fontSize: '18px',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            userSelect: 'none'
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.background = '#005bb5';
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.background = '#0070f3';
          }}
          onClick={handleLogin}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (lang === "ar" ? "جاري تسجيل الدخول..." : "Signing in...") : t.submit}
        </button>

        {error.general && (
          <div style={{
            marginTop: '12px',
            color: '#d93025',
            fontWeight: 700,
            textAlign: 'center',
            userSelect: 'none',
            padding: '10px',
            background: '#ffebee',
            borderRadius: '6px'
          }}>
            {error.general}
            <br />
            <small style={{ fontSize: "12px" }}>
              {lang === "ar" ? "تحقق من console للمزيد من التفاصيل" : "Check console for details"}
            </small>
          </div>
        )}

        <div style={{
          marginTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px'
        }}>
          <a href="/forgot-password" style={{
            color: '#0070f3',
            textDecoration: 'none',
            userSelect: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#005bb5'}
          onMouseOut={(e) => e.currentTarget.style.color = '#0070f3'}
          >
            {t.forgotPassword}
          </a>
          <a href="/register" style={{
            color: '#0070f3',
            textDecoration: 'none',
            userSelect: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#005bb5'}
          onMouseOut={(e) => e.currentTarget.style.color = '#0070f3'}
          >
            {t.createAccount}
          </a>
        </div>

        {/* إضافة معلومات للمساعدة في التصحيح */}
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: '#f5f5f5',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>لتجربة الدخول:</strong><br />
          البريد: test@example.com<br />
          كلمة المرور: password
        </div>
      </div>
    </div>
  );
}