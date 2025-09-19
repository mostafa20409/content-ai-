// components/SignupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
          confirmPassword: formData.get('confirmPassword'),
          phone: formData.get('phone'),
        }),
        // إضافة signal لإمكانية إلغاء الطلب
        signal: AbortSignal.timeout(30000), // 30 ثانية timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء الحساب');
      }

      const data = await response.json();
      router.push(data.redirect || '/dashboard');
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.');
      } else {
        setError(error.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* حقول التسجيل */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
      </button>
    </form>
  );
}