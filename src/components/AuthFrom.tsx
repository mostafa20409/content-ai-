'use client';

import { useState } from 'react';

export default function AuthForm({
  type = 'login',
  onSubmit,
}: {
  type?: 'login' | 'register';
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {type === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
      </h2>
      <div className="mb-4">
        <label className="block mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">كلمة المرور</label>
        <input
          type="password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {type === 'login' ? 'دخول' : 'تسجيل'}
      </button>
    </form>
  );
}