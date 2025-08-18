"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiLoader } from "react-icons/fi";

export default function DemoPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  const t = {
    ar: {
      title: "🎉 مرحبًا بك في النسخة التجريبية!",
      description:
        "هنا يمكنك تجربة الأداة بسرعة دون الحاجة لتسجيل الدخول. الميزات الكاملة ستكون متاحة بعد التسجيل 🔑",
      placeholder: "اكتب جملة أو موضوع للتجربة...",
      generateButton: "جرّب الآن",
      signupPrompt: "أعجبك المحتوى؟",
      signupButton: "أنشئ حسابًا الآن",
      features: [
        "إنشاء محتوى كامل",
        "تعديل النتائج حسب احتياجك",
        "حفظ المحتوى وتصديره",
      ],
      generatedTitle: "النتيجة:",
    },
    en: {
      title: "🎉 Welcome to the Demo!",
      description:
        "Here you can try the tool quickly without logging in. Full features will be available after signing up 🔑",
      placeholder: "Write a sentence or topic to try...",
      generateButton: "Try Now",
      signupPrompt: "Like what you see?",
      signupButton: "Sign Up Now",
      features: [
        "Generate complete content",
        "Edit results as needed",
        "Save and export content",
      ],
      generatedTitle: "Result:",
    },
  };

  const text = t[language];

  const handleGenerate = () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedContent(
        language === "ar"
          ? `بناءً على طلبك حول "${inputText}"، إليك محتوى مقترح:\n\nهذا مثال على المحتوى الذي يمكن للأداة إنشاؤه. النص الفعلي سيكون أطول وأكثر تفصيلاً بناءً على موضوعك. يمكنك تعديل النتائج حسب احتياجاتك الخاصة.`
          : `Based on your request about "${inputText}", here's suggested content:\n\nThis is an example of content the tool can generate. The actual text would be longer and more detailed based on your topic. You can edit the results to fit your specific needs.`
      );
      setIsGenerating(false);
    }, 1500);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md"
        >
          {language === "ar" ? "EN" : "AR"}
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          {text.title}
        </h1>

        <p className="max-w-md text-center mb-6 mx-auto">{text.description}</p>

        <div className="mb-6">
          <textarea
            dir={language === "ar" ? "rtl" : "ltr"}
            className="w-full h-32 p-3 border dark:border-gray-600 rounded-lg mb-4 text-gray-800 dark:text-gray-200 dark:bg-gray-700"
            placeholder={text.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className={`px-6 py-2 flex items-center justify-center gap-2 w-full md:w-auto ${
              isGenerating || !inputText.trim()
                ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg transition-colors`}
          >
            {isGenerating ? (
              <>
                <FiLoader className="animate-spin" />
                {language === "ar" ? "جاري المعالجة..." : "Processing..."}
              </>
            ) : (
              <>
                {text.generateButton}
                <FiArrowRight />
              </>
            )}
          </button>
        </div>

        {generatedContent && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">
              {text.generatedTitle}
            </h3>
            <div
              dir="auto"
              className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-pre-line"
            >
              {generatedContent}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">
            {language === "ar"
              ? "ماذا تحصل مع الحساب الكامل؟"
              : "What do you get with a full account?"}
          </h3>
          <ul className="space-y-2 mb-4">
            {text.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-center sm:text-start">{text.signupPrompt}</p>
            <button
              onClick={() => router.push("/signup")}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {text.signupButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
