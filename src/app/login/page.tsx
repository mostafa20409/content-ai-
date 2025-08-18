"use client";

import { useState, useEffect } from "react";

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
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = locales[lang];

  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("email") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("email", email);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ general: data.error || "Login failed" });
        setLoading(false);
        return;
      }

      // TODO: تخزين التوكن أو إعادة التوجيه بعد تسجيل الدخول بنجاح
      alert(t.submit + " successful!");
    } catch (err) {
      setError({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0; padding: 0; background: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .container {
          max-width: 420px;
          margin: 60px auto;
          background: #fff;
          padding: 32px 28px 40px 28px;
          border-radius: 14px;
          box-shadow: 0 12px 25px rgba(0,0,0,0.1);
          direction: ${lang === "ar" ? "rtl" : "ltr"};
          position: relative;
        }
        .lang-toggle {
          position: absolute;
          top: 18px;
          ${lang === "ar" ? "left: 20px;" : "right: 20px;"}
          background: transparent;
          border: none;
          font-weight: 700;
          color: #0070f3;
          cursor: pointer;
          font-size: 14px;
          user-select: none;
          transition: color 0.3s ease;
        }
        .lang-toggle:hover {
          color: #005bb5;
        }
        h2 {
          margin-bottom: 28px;
          font-weight: 700;
          font-size: 26px;
          color: #222;
          text-align: center;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        input[type="email"], input[type="password"] {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 10px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          outline: none;
        }
        input[type="email"]:focus, input[type="password"]:focus {
          border-color: #0070f3;
          box-shadow: 0 0 6px rgba(0,112,243,0.4);
        }
        .error-text {
          color: #d93025;
          font-size: 13px;
          margin-top: 6px;
          margin-bottom: 12px;
          min-height: 18px;
          font-weight: 600;
          user-select: none;
        }
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .toggle-password {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #0070f3;
          background: none;
          border: none;
          user-select: none;
          transition: color 0.3s ease;
          ${lang === "ar" ? "left: 16px;" : "right: 16px;"}
        }
        .toggle-password:hover {
          color: #005bb5;
        }
        button.submit-btn {
          width: 100%;
          padding: 14px 0;
          margin-top: 16px;
          background: #0070f3;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          user-select: none;
        }
        button.submit-btn:hover:not(:disabled) {
          background: #005bb5;
        }
        button.submit-btn:disabled {
          background: #999;
          cursor: not-allowed;
        }
        .links {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .links a {
          color: #0070f3;
          text-decoration: none;
          user-select: none;
          transition: color 0.3s ease;
        }
        .links a:hover {
          text-decoration: underline;
          color: #005bb5;
        }
        .general-error {
          margin-top: 12px;
          color: #d93025;
          font-weight: 700;
          text-align: center;
          user-select: none;
        }
      `}</style>

      <div className="container" role="main" aria-labelledby="login-title">
        <button
          className="lang-toggle"
          aria-label="Toggle Language"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          type="button"
        >
          {t.languageToggle}
        </button>

        <h2 id="login-title">{t.loginTitle}</h2>

        <label htmlFor="email">{t.email}</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error.email}
          aria-describedby={error.email ? "email-error" : undefined}
          placeholder={t.email}
        />
        <div id="email-error" className="error-text" role="alert">
          {error.email || "\u00A0"}
        </div>

        <label htmlFor="password">{t.password}</label>
        <div className="password-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error.password}
            aria-describedby={error.password ? "password-error" : undefined}
            placeholder={t.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        <div id="password-error" className="error-text" role="alert">
          {error.password || "\u00A0"}
        </div>

        <button
          className="submit-btn"
          onClick={handleLogin}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (lang === "ar" ? "جاري تسجيل الدخول..." : "Signing in...") : t.submit}
        </button>

        {error.general && <p className="general-error" role="alert">{error.general}</p>}

        <div className="links">
          <a href="/forgot-password">{t.forgotPassword}</a>
          <a href="/register">{t.createAccount}</a>
        </div>
      </div>
    </>
  );
}