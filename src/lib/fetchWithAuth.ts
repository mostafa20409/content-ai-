// lib/fetchWithAuth.ts
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // محاولة تجديد التوكن
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // إعادة المحاولة بالطلب الأصلي
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } else {
      // إذا فشل التجديد، توجيه إلى Login
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  return response;
};