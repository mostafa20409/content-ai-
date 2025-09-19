// src/components/ServiceWorkerRegistration.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // تنظيف الـ Service Workers القديمة أولاً
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          
          // تسجيل Service Worker جديد
          const registration = await navigator.serviceWorker.register(
            '/service-worker.js', 
            { scope: '/' }
          );
          
          console.log('✅ Service Worker registered: ', registration);
        } catch (registrationError) {
          console.log('❌ Service Worker registration failed: ', registrationError);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}