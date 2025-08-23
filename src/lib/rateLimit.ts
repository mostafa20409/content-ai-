// lib/rateLimit.ts
interface RateLimitStore {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitStore>;
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 دقيقة
    blockDurationMs: number = 30 * 60 * 1000 // 30 دقيقة
  ) {
    this.store = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime?: number } {
    const now = Date.now();
    const record = this.store.get(key);

    // إذا كان ممنوعاً مؤقتاً
    if (record?.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil
      };
    }

    // إذا انتهى وقت المنع أو أول محاولة
    if (!record || now - record.lastAttempt > this.windowMs) {
      this.store.set(key, { count: 1, lastAttempt: now });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1
      };
    }

    // إذا تجاوز الحد المسموح
    if (record.count >= this.maxAttempts) {
      this.store.set(key, {
        ...record,
        blockedUntil: now + this.blockDurationMs
      });
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + this.blockDurationMs
      };
    }

    // زيادة العداد
    this.store.set(key, {
      count: record.count + 1,
      lastAttempt: now
    });

    return {
      allowed: true,
      remaining: this.maxAttempts - (record.count + 1)
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // تنظيف التخزين تلقائياً (اختياري)
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.lastAttempt > this.windowMs * 2 && !record.blockedUntil) {
        this.store.delete(key);
      }
    }
  }
}

// إنشاء مثيلات منفصلة لكل نوع
export const ipRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_BLOCK_MS || '1800000')
);

export const emailRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_BLOCK_MS || '1800000')
);

// دالة مساعدة للتحقق من Rate Limit
export function checkRateLimit(identifier: string, type: 'ip' | 'email' = 'ip') {
  if (type === 'ip') {
    return ipRateLimiter.check(identifier);
  } else {
    return emailRateLimiter.check(identifier);
  }
}
