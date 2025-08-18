// lib/errorHandler.ts
export const errorHandler = (error: unknown, message?: string) => {
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : "❌ An unknown error occurred");

  console.error("🔥 ErrorHandler Log:", error);

  return {
    success: false,
    error: errorMessage,
  };
};

// ✅ أضفنا default export عشان أي طريقة استيراد تشتغل
export default errorHandler;