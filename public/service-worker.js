// public/service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// معالجة الطلبات بشكل أساسي فقط
self.addEventListener('fetch', (event) => {
  // يمكنك إضافة منطق التخزين المؤقت هنا إذا لزم الأمر
  // لكن حالياً سنتركه فارغاً لتجنب المشاكل
});

// إضافة هذا للتعامل مع الرسائل بشكل صحيح
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});