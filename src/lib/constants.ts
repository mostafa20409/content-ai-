// lib/constants.ts
export const ERROR_MESSAGES = {
  INVALID_CONTENT_TYPE: "يجب أن يكون نوع المحتوى application/json",
  INVALID_DATA: "بيانات الطلب غير صحيحة",
  MISSING_FIELDS: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
  INVALID_EMAIL: "صيغة البريد الإلكتروني غير صحيحة",
  WEAK_PASSWORD: "كلمة المرور ضعيفة",
  EMAIL_EXISTS: "هذا البريد الإلكتروني مسجل بالفعل",
  PHONE_EXISTS: "رقم الهاتف مسجل بالفعل",
  RATE_LIMIT_EXCEEDED: "تم تجاوز عدد المحاولات المسموحة",
  SERVER_ERROR: "حدث خطأ غير متوقع في الخادم",
  PASSWORDS_NOT_MATCH: "كلمتا المرور غير متطابقتين",
  INVALID_NAME: "الاسم غير صحيح",
  INVALID_PHONE: "رقم الهاتف غير صحيح",
};

export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: "تم إنشاء الحساب بنجاح",
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 8,
  PHONE_MAX_LENGTH: 15,
};