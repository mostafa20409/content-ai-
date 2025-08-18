// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "../../../lib/connectToDB";
import User, { IUser } from "../../../models/User";

interface DecodedJWT {
  id?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const CACHE_TTL = parseInt(process.env.USER_CACHE_TTL || "300", 10); // ثواني
const RATE_LIMIT_WINDOW = 60; // ثانية
const RATE_LIMIT_MAX = 60; // طلب لكل IP

// --- كاش + Rate Limit (In-Memory) ---
const g: any = globalThis as any;
g._USER_CACHE = g._USER_CACHE || new Map<string, { data: any; exp: number }>();
g._RATE_MAP = g._RATE_MAP || new Map<string, { count: number; resetAt: number }>();

function getCachedUser(email: string) {
  const entry = g._USER_CACHE.get(email);
  if (!entry || Date.now() > entry.exp) {
    g._USER_CACHE.delete(email);
    return null;
  }
  return entry.data;
}

function setCachedUser(email: string, data: any, ttl = CACHE_TTL) {
  g._USER_CACHE.set(email, { data, exp: Date.now() + ttl * 1000 });
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW * 1000;
  const rec = g._RATE_MAP.get(ip);

  if (!rec || now > rec.resetAt) {
    g._RATE_MAP.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (rec.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  }

  rec.count += 1;
  return { ok: true, remaining: RATE_LIMIT_MAX - rec.count };
}

function sanitizeUser(user: Partial<IUser>) {
  const { password, __v, passwordResetToken, passwordResetExpires, ...safe } = user;
  return safe;
}

export async function GET(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local") as string;
  const start = Date.now();

  try {
    // --- Rate Limit ---
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, code: "RATE_LIMIT", message: "تم تجاوز حد الطلبات", retryAfter: rl.retryAfter },
        { status: 429 }
      );
    }

    // --- جلب التوكن ---
    let token = (await cookies()).get("token")?.value;
    if (!token) {
      const auth = req.headers.get("authorization") || "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, code: "NO_TOKEN", message: "يجب تسجيل الدخول" }, { status: 401 });
    }

    // --- التحقق من JWT ---
    let decoded: DecodedJWT;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedJWT;
    } catch {
      return NextResponse.json({ success: false, code: "INVALID_TOKEN", message: "التوكن غير صالح" }, { status: 403 });
    }

    if (!decoded?.email) {
      return NextResponse.json({ success: false, code: "INVALID_PAYLOAD", message: "محتوى التوكن غير صحيح" }, { status: 403 });
    }

    // --- الكاش ---
    const cached = getCachedUser(decoded.email);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached, meta: { cached: true, tookMs: Date.now() - start } },
        { status: 200 }
      );
    }

    // --- الاتصال بقاعدة البيانات ---
    await connectToDB();
    const user = (await User.findOne({ email: decoded.email }).lean()) as IUser | null;
    if (!user) {
      return NextResponse.json({ success: false, code: "NOT_FOUND", message: "المستخدم غير موجود" }, { status: 404 });
    }

    // --- تجهيز الرد ---
    const safeUser = sanitizeUser(user);
    const subscription = (user.subscription || "free").toLowerCase();
    const resp = {
      email: safeUser.email,
      name: safeUser.name,
      subscription,
      usage: {
        ads: user.adsUsedThisMonth || 0,
        keywords: user.keywordsUsedThisMonth || 0,
        content: user.contentUsedThisMonth || 0,
        books: user.booksUsedThisMonth || 0,
      },
      createdAt: safeUser.createdAt,
      lastActivityAt: user.updatedAt ?? user.createdAt,
      meta: {
        subscription,
        isPro: ["pro", "premium"].includes(subscription),
      },
    };

    setCachedUser(decoded.email, resp);

    return NextResponse.json(
      { success: true, data: resp, meta: { cached: false, tookMs: Date.now() - start } },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/me] Error:", err);
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message: "حدث خطأ داخلي" }, { status: 500 });
  }
}