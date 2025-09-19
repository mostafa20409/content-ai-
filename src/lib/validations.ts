// lib/validations.ts

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { valid: false, message: "البريد الإلكتروني مطلوب" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "صيغة البريد الإلكتروني غير صحيحة" };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { valid: false, message: "كلمة المرور مطلوبة" };
  }
  
  if (password.length < 8) {
    return { valid: false, message: "يجب أن تكون كلمة المرور على الأقل 8 أحرف" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل" };
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, message: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل" };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (!@#$%^&*...)" };
  }
  
  // التحقق من كلمات المرور الشائعة أو الضعيفة
  const weakPasswords = [
    'password', '12345678', 'qwertyui', 'asdfghjk', 'zxcvbnm',
    'abcdefgh', '11111111', '00000000', '98765432'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: "كلمة المرور ضعيفة جدًا يرجى اختيار كلمة مرور أقوى" };
  }
  
  return { valid: true };
};

export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { valid: false, message: "الاسم مطلوب" };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, message: "يجب أن يكون الاسم على الأقل حرفين" };
  }
  
  if (name.trim().length > 50) {
    return { valid: false, message: "يجب أن لا يتجاوز الاسم 50 حرفًا" };
  }
  
  // التحقق من أن الاسم لا يحتوي على رموز خاصة
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, message: "يجب أن يحتوي الاسم على أحرف فقط" };
  }
  
  return { valid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { valid: false, message: "رقم الهاتف مطلوب" };
  }
  
  // إزالة أي مسافات أو شرطات من رقم الهاتف
  const cleanedPhone = phone.replace(/\s+|-/g, '');
  
  // التحقق من أن رقم الهاتف يحتوي على أرقام فقط
  if (!/^\d+$/.test(cleanedPhone)) {
    return { valid: false, message: "يجب أن يحتوي رقم الهاتف على أرقام فقط" };
  }
  
  // التحقق من طول رقم الهاتف (عادة بين 8 إلى 15 رقم)
  if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
    return { valid: false, message: "رقم الهاتف غير صحيح" };
  }
  
  return { valid: true };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { valid: false, message: "كلمتا المرور غير متطابقتين" };
  }
  
  return { valid: true };
};

// دالة للتحقق من جميع الحقول مرة واحدة
export const validateAllFields = (fields: { [key: string]: any }): ValidationResult => {
  if (fields.email) {
    const emailValidation = validateEmail(fields.email);
    if (!emailValidation.valid) return emailValidation;
  }
  
  if (fields.password) {
    const passwordValidation = validatePassword(fields.password);
    if (!passwordValidation.valid) return passwordValidation;
  }
  
  if (fields.name) {
    const nameValidation = validateName(fields.name);
    if (!nameValidation.valid) return nameValidation;
  }
  
  if (fields.phone) {
    const phoneValidation = validatePhone(fields.phone);
    if (!phoneValidation.valid) return phoneValidation;
  }
  
  if (fields.password && fields.confirmPassword) {
    const confirmValidation = validateConfirmPassword(fields.password, fields.confirmPassword);
    if (!confirmValidation.valid) return confirmValidation;
  }
  
  return { valid: true };
};