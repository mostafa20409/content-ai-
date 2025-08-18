"use client";

import { useState, useEffect } from "react";

const locales = {
  en: {
    registerTitle: "Create a New Account",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    submit: "Register",
    languageToggle: "عربي",
    requiredField: "This field is required.",
    invalidEmail: "Please enter a valid email.",
    passwordMismatch: "Passwords do not match.",
    minPassword: "Password must be at least 8 characters.",
  },
  ar: {
    registerTitle: "إنشاء حساب جديد",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    submit: "تسجيل",
    languageToggle: "English",
    requiredField: "هذا الحقل مطلوب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    minPassword: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
  },
};

export default function RegisterPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = locales[lang];

  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("email") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("email", email);
  }, [email]);

  const validate = () => {
    let valid = true;
    const errs: typeof error = {};

    if (!name.trim()) {
      errs.name = t.requiredField;
      valid = false;
    } else if (name.trim().length < 3) {
      errs.name = lang === "ar" ? "يجب أن يحتوي الاسم على 3 أحرف على الأقل." : "Name must be at least 3 characters.";
      valid = false;
    }

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
    } else if (password.length < 8) {
      errs.password = t.minPassword;
      valid = false;
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = t.requiredField;
      valid = false;
    } else if (password !== confirmPassword) {
      errs.confirmPassword = t.passwordMismatch;
      valid = false;
    }

    setError(errs);
    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setError({});

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ general: data.error || "Registration failed" });
        setLoading(false);
        return;
      }

      alert(lang === "ar" ? "تم التسجيل بنجاح!" : "Registration successful!");
      // ممكن تعمل إعادة توجيه بعد التسجيل مثلاً للـ login page

    } catch (err) {
      setError({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .container {
          max-width: 420px;
          margin: 60px auto;
          background: #fff;
          padding: 32px 28px 40px 28px;
          border-radius: 14px;
          box-shadow: 0 12px 25px rgba(0,0,0,0.1);
          direction: ${lang === "ar" ? "rtl" : "ltr"};
          position: relative;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        input[type="text"], input[type="email"], input[type="password"] {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 10px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          outline: none;
          margin-bottom: 12px;
        }
        input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus {
          border-color: #0070f3;
          box-shadow: 0 0 6px rgba(0,112,243,0.4);
        }
        .error-text {
          color: #d93025;
          font-size: 13px;
          margin-top: -10px;
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
          margin-top: 8px;
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
        .general-error {
          margin-top: 16px;
          color: #d93025;
          font-weight: 700;
          text-align: center;
          user-select: none;
        }
      `}</style>

      <div className="container" role="main" aria-labelledby="register-title">
        <button
          className="lang-toggle"
          aria-label="Toggle Language"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          type="button"
        >
          {t.languageToggle}
        </button>

        <h2 id="register-title">{t.registerTitle}</h2>

        <label htmlFor="name">{t.name}</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error.name}
          aria-describedby={error.name ? "name-error" : undefined}
          placeholder={t.name}
        />
        <div id="name-error" className="error-text" role="alert">
          {error.name || "\u00A0"}
        </div>

        <label htmlFor="email">{t.email}</label>
        <input
          id="email"
          type="email"
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
            aria-label={showPassword ? t.password : t.password}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        <div id="password-error" className="error-text" role="alert">
          {error.password || "\u00A0"}
        </div>

        <label htmlFor="confirmPassword">{t.confirmPassword}</label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={!!error.confirmPassword}
          aria-describedby={error.confirmPassword ? "confirmPassword-error" : undefined}
          placeholder={t.confirmPassword}
        />
        <div id="confirmPassword-error" className="error-text" role="alert">
          {error.confirmPassword || "\u00A0"}
        </div>

        <button
          className="submit-btn"
          onClick={handleRegister}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (lang === "ar" ? "جاري التسجيل..." : "Registering...") : t.submit}
        </button>

        {error.general && <p className="general-error" role="alert">{error.general}</p>}
      </div>
    </>
  );
}