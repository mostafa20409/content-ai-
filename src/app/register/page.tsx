"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// تعريف نوع البيانات للنموذج
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

// تعريف نوع الأخطاء
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  submit?: string;
}

const locales = {
  en: {
    registerTitle: "Create a New Account",
    name: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    phone: "Phone (Optional)",
    submit: "Create Account",
    languageToggle: "عربي",
    requiredField: "This field is required.",
    invalidEmail: "Please enter a valid email.",
    passwordMismatch: "Passwords do not match.",
    minPassword: "Password must be at least 8 characters.",
    nameMinLength: "Name must be at least 2 characters.",
    invalidPhone: "Invalid phone number format.",
    loginText: "Already have an account?",
    loginLink: "Sign In",
    loading: "Creating account...",
    namePlaceholder: "Enter your full name",
    emailPlaceholder: "example@email.com",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordPlaceholder: "Re-enter password",
    phonePlaceholder: "+1234567890",
    timeoutError: "Request timeout. Please try again.",
    serverError: "Server connection error",
  },
  ar: {
    registerTitle: "إنشاء حساب جديد",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    phone: "رقم الهاتف (اختياري)",
    submit: "إنشاء حساب",
    languageToggle: "English",
    requiredField: "هذا الحقل مطلوب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    minPassword: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
    nameMinLength: "الاسم يجب أن يكون على الأقل حرفين.",
    invalidPhone: "صيغة رقم الهاتف غير صحيحة.",
    loginText: "لديك حساب بالفعل؟",
    loginLink: "تسجيل الدخول",
    loading: "جاري إنشاء الحساب...",
    namePlaceholder: "أدخل اسمك الكامل",
    emailPlaceholder: "example@email.com",
    passwordPlaceholder: "8 أحرف على الأقل",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    phonePlaceholder: "+1234567890",
    timeoutError: "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.",
    serverError: "حدث خطأ في الاتصال بالخادم",
  },
};

export default function RegisterPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = locales[lang];
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  // تنظيف الـ AbortController عند unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // مسح الخطأ عند البدء في الكتابة
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t.requiredField;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t.nameMinLength;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t.requiredField;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }
    
    if (!formData.password) {
      newErrors.password = t.requiredField;
    } else if (formData.password.length < 8) {
      newErrors.password = t.minPassword;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordMismatch;
    }
    
    // التحقق من رقم الهاتف إذا تم إدخاله
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = t.invalidPhone;
      }
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

    // إلغاء أي طلب سابق
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      timeoutId = setTimeout(() => {
        if (controllerRef.current) {
          controllerRef.current.abort();
        }
      }, 15000); // 15 ثانية timeout

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone ? formData.phone.trim() : undefined
        }),
        signal: controllerRef.current.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        router.push(data.redirect || "/dashboard");
      } else {
        throw new Error(data.error || "Unexpected error occurred");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrors({ submit: t.timeoutError });
      } else {
        setErrors({ submit: error.message || t.serverError });
      }
    } finally {
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
      controllerRef.current = null;
    }
  };

  return (
    <div className="container">
      <button
        className="lang-toggle"
        aria-label="Toggle Language"
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        type="button"
      >
        {t.languageToggle}
      </button>

      <form onSubmit={handleSubmit} className="signup-form">
        <h2 className="signup-title">
          {t.registerTitle}
        </h2>

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t.name}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder={t.namePlaceholder}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">{t.email}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder={t.emailPlaceholder}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">{t.password}</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder={t.passwordPlaceholder}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password"
              aria-label={showPassword ? (lang === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (lang === "ar" ? "إظهار كلمة المرور" : "Show password")}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">{t.confirmPassword}</label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder={t.confirmPasswordPlaceholder}
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            {t.phone}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder={t.phonePlaceholder}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? t.loading : t.submit}
        </button>

        <div className="login-link">
          <span>{t.loginText} </span>
          <Link href="/login" className="link">
            {t.loginLink}
          </Link>
        </div>
      </form>

      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          direction: ${lang === "ar" ? "rtl" : "ltr"};
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .lang-toggle {
          position: absolute;
          top: 20px;
          ${lang === "ar" ? "left: 20px;" : "right: 20px;"}
          background: transparent;
          border: none;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          user-select: none;
          transition: color 0.3s ease;
          z-index: 10;
        }
        
        .lang-toggle:hover {
          color: #ddd;
        }
        
        .signup-form {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 450px;
          position: relative;
        }
        
        .signup-title {
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
          font-size: 1.8rem;
          font-weight: 700;
        }
        
        .error-message {
          padding: 10px;
          background: #ffebee;
          color: #c62828;
          border-radius: 6px;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 600;
        }
        
        .form-group {
          margin-bottom: 1.2rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 8px;
          border: 2px solid #ddd;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 6px rgba(0,112,243,0.4);
        }
        
        .form-input.error {
          border-color: #d32f2f;
        }
        
        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .error-text {
          color: #d32f2f;
          font-size: 0.85rem;
          display: block;
          margin-top: 0.25rem;
          font-weight: 600;
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
        
        .submit-button {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          background: #0070f3;
          color: #fff;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
          margin-bottom: 1rem;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .submit-button:disabled {
          background: #aaa;
          cursor: not-allowed;
        }
        
        .login-link {
          text-align: center;
        }
        
        .login-link span {
          color: #666;
        }
        
        .link {
          color: #0070f3;
          text-decoration: none;
          font-weight: 500;
        }
        
        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}