import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  id: string;
  role?: string;
  email?: string;
}

export interface DecodeResult {
  success: boolean;
  data?: DecodedToken;
  error?: string;
}

/**
 * يفك التوكن JWT ويرجع بيانات المستخدم أو الخطأ.
 * @param token - توكن JWT
 * @param options - خيارات التحقق من JWT (اختياري)
 * @returns نتيجة تحتوي على البيانات أو الخطأ
 */
export function decodeUserIdFromToken(
  token: string,
  options?: VerifyOptions
): DecodeResult {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined");

    const decoded = jwt.verify(token, process.env.JWT_SECRET, options) as DecodedToken;

    if (!decoded.id) {
      return { success: false, error: "Token does not contain user id" };
    }

    return { success: true, data: decoded };
  } catch (error: any) {
    return { success: false, error: error.message || "Invalid token" };
  }
}