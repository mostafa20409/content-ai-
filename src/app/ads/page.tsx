// app/ads/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/ad-generator');
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f5f5f5'
    }}>
      <h2>جاري التوجيه إلى صفحة مولد الإعلانات...</h2>
    </div>
  );
}