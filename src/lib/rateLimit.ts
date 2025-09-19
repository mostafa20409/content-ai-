// lib/rateLimit.ts
interface RateLimitStore {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
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

    // تنظيف دوري للتخزين كل 5 دقائق
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(key: string): RateLimitResult {
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
      const blockedUntil = now + this.blockDurationMs;
      this.store.set(key, {
        ...record,
        blockedUntil
      });
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil
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

  // تنظيف التخزين تلقائياً
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      // حذف السجلات القديمة التي انتهى وقتها
      if ((now - record.lastAttempt > this.windowMs * 2) && 
          (!record.blockedUntil || now > record.blockedUntil)) {
        this.store.delete(key);
      }
    }
  }
}

// إنشاء مثيلات منفصلة لكل نوع
export const ipRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_IP_MAX_ATTEMPTS || '10'),
  parseInt(process.env.RATE_LIMIT_IP_WINDOW_MS || '900000'), // 15 دقيقة
  parseInt(process.env.RATE_LIMIT_IP_BLOCK_MS || '1800000') // 30 دقيقة
);

export const emailRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_EMAIL_MAX_ATTEMPTS || '5'),
  parseInt(process.env.RATE_LIMIT_EMAIL_WINDOW_MS || '3600000'), // ساعة
  parseInt(process.env.RATE_LIMIT_EMAIL_BLOCK_MS || '7200000') // ساعتين
);

// دالة مساعدة للتحقق من Rate Limit متوافقة مع route.ts
export function checkRateLimit(identifier: string, type: 'ip' | 'email' = 'ip'): {
  allowed: boolean;
  resetTime?: number;
  retryAfter?: number;
} {
  let result: RateLimitResult;
  
  if (type === 'ip') {
    result = ipRateLimiter.check(identifier);
  } else {
    result = emailRateLimiter.check(identifier);
  }

  return {
    allowed: result.allowed,
    resetTime: result.resetTime,
    retryAfter: result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : undefined
  };
}

// دالة مساعدة للحصول على معلومات Rate Limit
export function getRateLimitInfo(identifier: string, type: 'ip' | 'email' = 'ip'): {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
  retryAfter?: number;
} {
  let result: RateLimitResult;
  
  if (type === 'ip') {
    result = ipRateLimiter.check(identifier);
  } else {
    result = emailRateLimiter.check(identifier);
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : undefined
  };
}

// دالة لمسح Rate Limit (للاستخدام في الاختبارات أو الإدارة)
export function resetRateLimit(identifier: string, type: 'ip' | 'email' = 'ip'): void {
  if (type === 'ip') {
    ipRateLimiter.reset(identifier);
  } else {
    emailRateLimiter.reset(identifier);
  }
}

// دالة للحصول على إحصائيات Rate Limit (للاستخدام في المراقبة)
export function getRateLimitStats(): {
  ipCount: number;
  emailCount: number;
  totalCount: number;
} {
  return {
    ipCount: Array.from(ipRateLimiter['store'].keys()).length,
    emailCount: Array.from(emailRateLimiter['store'].keys()).length,
    totalCount: Array.from(ipRateLimiter['store'].keys()).length + 
               Array.from(emailRateLimiter['store'].keys()).length
  };
}