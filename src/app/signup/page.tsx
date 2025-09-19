// app/signup/page.tsx
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

export default function SignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
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
      newErrors.name = "الاسم مطلوب";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "الاسم يجب أن يكون على الأقل حرفين";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    
    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون على الأقل 8 أحرف";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    }
    
    // التحقق من رقم الهاتف إذا تم إدخاله
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "رقم الهاتف غير صحيح";
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
        throw new Error(errorData.error || `خطأ في الخادم: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        router.push(data.redirect || "/dashboard");
      } else {
        throw new Error(data.error || "حدث خطأ غير متوقع");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrors({ submit: "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى." });
      } else {
        setErrors({ submit: error.message || "حدث خطأ في الاتصال بالخادم" });
      }
    } finally {
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
      controllerRef.current = null;
    }
  };

  return (
    <div className="signup-container">
      <form
        onSubmit={handleSubmit}
        className="signup-form"
      >
        <h2 className="signup-title">
          إنشاء حساب جديد
        </h2>

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">الاسم الكامل</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="أدخل اسمك الكامل"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">البريد الإلكتروني</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="example@email.com"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">كلمة المرور</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="8 أحرف على الأقل"
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">تأكيد كلمة المرور</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="أعد إدخال كلمة المرور"
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            رقم الهاتف (اختياري)
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="+1234567890"
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </button>

        <div className="login-link">
          <span>لديك حساب بالفعل؟ </span>
          <Link href="/login" className="link">
            تسجيل الدخول
          </Link>
        </div>
      </form>

      <style jsx>{`
        .signup-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .signup-form {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 450px;
        }
        
        .signup-title {
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
          font-size: 1.8rem;
        }
        
        .error-message {
          padding: 10px;
          background: #ffebee;
          color: #c62828;
          border-radius: 6px;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 1.2rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #0070f3;
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
        }
        
        .submit-button {
          width: 100%;
          padding: 12px;
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