// lib/memoryMonitor.ts
export class MemoryMonitor {
  static checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    if (usedMB > 800) { // تحذير عند الاقتراب من الحد
      console.warn(`🚨 استخدام عالي للذاكرة: ${usedMB}MB / ${totalMB}MB`);
    }
    
    return { usedMB, totalMB };
  }
}

// استخدامه في النقاط الحرجة
// MemoryMonitor.checkMemoryUsage();