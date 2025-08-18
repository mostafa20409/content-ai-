"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  motion,
  AnimatePresence,
  Variants,
} from "framer-motion";

import {
  Moon,
  Sun,
  Sparkles,
  Loader2,
  Check,
  Copy,
  Download,
  Settings,
  X,
  ChevronDown,
} from "lucide-react";

import "./content.css";

/* ----------------------------------------------------------------
   Types
----------------------------------------------------------------- */
type Lang = "ar" | "en";
type Length = "short" | "medium" | "long";
type Tone = "professional" | "casual" | "friendly" | "academic";
type Stage = "idle" | "researching" | "writing" | "polishing";

/* ----------------------------------------------------------------
   Animation Variants (Framer Motion)
   NOTE:
   - استبدلنا ease string بـ cubic-bezier tuple (مقبول تايبًا)
----------------------------------------------------------------- */
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] as [number, number, number, number] },
  },
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] as [number, number, number, number] },
  },
};

const buttonHover: Variants = {
  hover: { scale: 1.03, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  tap: { scale: 0.98 },
};

/* ----------------------------------------------------------------
   Floating Background Animations
   NOTE مهم:
   - عرّفنا أنواع واضحة لضمان عدم تحوّل المصفوفات إلى readonly
   - استخدمنا tuple لـ ease بدل string
----------------------------------------------------------------- */
type FloatAnim = {
  y: number[];
  rotate: number[];
  transition: {
    duration: number;
    repeat: number;
    ease: [number, number, number, number];
    delay?: number;
  };
};

const floatingAnimation: {
  float1: FloatAnim;
  float2: FloatAnim;
  float3: FloatAnim;
} = {
  float1: {
    y: [0, 15, 0] as number[],
    rotate: [0, 5, -5, 0] as number[],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
    },
  },
  float2: {
    y: [0, -20, 0] as number[],
    rotate: [0, -8, 8, 0] as number[],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
      delay: 1,
    },
  },
  float3: {
    y: [0, 25, 0] as number[],
    rotate: [0, 10, -10, 0] as number[],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
      delay: 2,
    },
  },
};

/* ----------------------------------------------------------------
   Content Tips
----------------------------------------------------------------- */
const tips: Record<Lang, string[]> = {
  ar: [
    "💡 استخدم أمثلة محددة لتحسين جودة المحتوى",
    "🌟 ابدأ بمقدمة جذابة لشد انتباه القارئ",
    "📝 قسم المحتوى إلى نقاط واضحة وسهلة المتابعة",
    "🔍 ركز على حل مشكلة محددة للقارئ",
    "🎯 اختر عناوين فرعية واضحة ومعبرة",
  ],
  en: [
    "💡 Use specific examples to improve content quality",
    "🌟 Start with an engaging introduction to capture attention",
    "📝 Break content into clear, easy-to-follow points",
    "🔍 Focus on solving a specific reader problem",
    "🎯 Choose clear and expressive subheadings",
  ],
};

/* ----------------------------------------------------------------
   Main Component
----------------------------------------------------------------- */
export default function ContentGenerator() {
  /* --------------------------------------------
     State
  --------------------------------------------- */
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Lang>("ar");
  const [length, setLength] = useState<Length>("medium");
  const [tone, setTone] = useState<Tone>("professional");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const [currentTip, setCurrentTip] = useState(0);

  /* --------------------------------------------
     Memoized dictionaries (stage text, options)
  --------------------------------------------- */
  const stageText = useMemo(
    () => ({
      ar: {
        idle: "جاهز",
        researching: "جاري البحث...",
        writing: "جاري الكتابة...",
        polishing: "جاري التنسيق...",
      },
      en: {
        idle: "Ready",
        researching: "Researching...",
        writing: "Writing...",
        polishing: "Polishing...",
      },
    }),
    []
  );

  const lengthOptions = useMemo(
    () => ({
      ar: {
        short: "قصير (150 كلمة)",
        medium: "متوسط (300 كلمة)",
        long: "طويل (500+ كلمة)",
      },
      en: {
        short: "Short (150 words)",
        medium: "Medium (300 words)",
        long: "Long (500+ words)",
      },
    }),
    []
  );

  const toneOptions = useMemo(
    () => ({
      ar: {
        professional: "احترافي",
        casual: "عامي",
        friendly: "ودي",
        academic: "أكاديمي",
      },
      en: {
        professional: "Professional",
        casual: "Casual",
        friendly: "Friendly",
        academic: "Academic",
      },
    }),
    []
  );

  /* --------------------------------------------
     Load settings from localStorage
  --------------------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("scg-settings");
      const settings = raw ? JSON.parse(raw) : {};
      if (typeof settings.darkMode === "boolean") setDarkMode(settings.darkMode);
      if (settings.language) setLanguage(settings.language as Lang);
      if (settings.length) setLength(settings.length as Length);
      if (settings.tone) setTone(settings.tone as Tone);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  /* --------------------------------------------
     Apply & persist settings (theme + dir)
  --------------------------------------------- */
  useEffect(() => {
    // theme
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    // direction
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");

    try {
      localStorage.setItem(
        "scg-settings",
        JSON.stringify({ darkMode, language, length, tone })
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [darkMode, language, length, tone]);

  /* --------------------------------------------
     Tips rotator
  --------------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips[language].length);
    }, 8000);
    return () => clearInterval(interval);
  }, [language]);

  /* --------------------------------------------
     Notifications helper
  --------------------------------------------- */
  const notify = useCallback((message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  /* --------------------------------------------
     Generate content (API)
     - شيلنا أي template literal مكسور
     - رسائل الخطأ مضبوطه
  --------------------------------------------- */
  const generateContent = useCallback(async () => {
    if (!topic.trim()) {
      notify(language === "ar" ? "⚠ يرجى إدخال موضوع أولاً" : "⚠ Please enter a topic first");
      return;
    }

    setLoading(true);
    setResult("");
    setStage("researching");
    setCopied(false);

    try {
      // simulate research stage
      await new Promise((r) => setTimeout(r, 800));
      setStage("writing");

      // API request
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify({
          topic,
          language,
          length,
          tone,
        }),
      });

      // simulate polishing stage
      await new Promise((r) => setTimeout(r, 600));
      setStage("polishing");

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      const content: string | undefined = data?.content ?? data?.data?.content;

      if (!content) {
        throw new Error("No content generated");
      }

      setResult(content.trim());
      notify(language === "ar" ? "✅ تم توليد المحتوى بنجاح" : "✅ Content generated successfully");
    } catch (error) {
      console.error("Generation error:", error);
      setResult(language === "ar" ? "❌ حدث خطأ أثناء توليد المحتوى" : "❌ Failed to generate content");
      notify(language === "ar" ? "⚠ فشل في توليد المحتوى" : "⚠ Content generation failed");
    } finally {
      setStage("idle");
      setLoading(false);
    }
  }, [topic, language, length, tone, notify]);

  /* --------------------------------------------
     Copy to clipboard
  --------------------------------------------- */
  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      notify(language === "ar" ? "📋 تم نسخ المحتوى" : "📋 Content copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(language === "ar" ? "⚠ فشل في النسخ" : "⚠ Copy failed");
    }
  };

  /* --------------------------------------------
     Save as file
     - اسم الملف باستخدام template literal الصحيح
  --------------------------------------------- */
  const saveAsFile = () => {
    if (!result) return;

    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `content-${topic.slice(0, 20) || "generated"}-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    a.click();

    URL.revokeObjectURL(url);

    notify(language === "ar" ? "💾 تم حفظ الملف" : "💾 File saved");
  };

  /* --------------------------------------------
     Toggle theme
  --------------------------------------------- */
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    notify(
      !darkMode
        ? language === "ar"
          ? "🌙 تم تفعيل الوضع المظلم"
          : "🌙 Dark mode enabled"
        : language === "ar"
        ? "☀ تم تفعيل الوضع الفاتح"
        : "☀ Light mode enabled"
    );
  };

  /* --------------------------------------------
     Render
  --------------------------------------------- */
  return (
    <div className="scg-app">
      {/* ----------------------------------------------------
          Floating background elements
      ----------------------------------------------------- */}
      <div className="scg-background">
        <motion.div
          className="shape shape-1"
          animate={floatingAnimation.float1}
        />
        <motion.div
          className="shape shape-2"
          animate={floatingAnimation.float2}
        />
        <motion.div
          className="shape shape-3"
          animate={floatingAnimation.float3}
        />
      </div>

      {/* ----------------------------------------------------
          Notifications
      ----------------------------------------------------- */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="notification"
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------
          Main container
      ----------------------------------------------------- */}
      <motion.main
        className="scg-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* ----------------------------------------------------
            Header
        ----------------------------------------------------- */}
        <motion.header
          className="scg-header"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="scg-header-left">
            <h1 className="scg-title">
              <Sparkles className="icon-title" />
              {language === "ar"
                ? "مولد المحتوى الذكي"
                : "Smart Content Generator"}
            </h1>

            <p className="scg-subtitle">
              {language === "ar"
                ? "أداة متقدمة لإنشاء محتوى احترافي"
                : "Advanced tool for professional content creation"}
            </p>
          </div>

          <div className="scg-header-right">
            <motion.button
              onClick={toggleDarkMode}
              aria-label={
                language === "ar" ? "تبديل الوضع المظلم" : "Toggle dark mode"
              }
              className="icon-button"
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              aria-label={language === "ar" ? "الإعدادات" : "Settings"}
              className="icon-button"
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
            >
              <Settings size={20} />
            </motion.button>

            <div className="language-selector" style={{ position: "relative" }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Lang)}
                className="select-input"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>
        </motion.header>

        {/* ----------------------------------------------------
            Settings panel
        ----------------------------------------------------- */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="settings-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="settings-header">
                <h3>{language === "ar" ? "الإعدادات" : "Settings"}</h3>

                <button
                  onClick={() => setShowSettings(false)}
                  className="close-button"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="settings-grid">
                {/* Length */}
                <div className="setting-group">
                  <label>
                    {language === "ar"
                      ? "طول المحتوى"
                      : "Content Length"}
                  </label>

                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as Length)}
                    className="select-input"
                  >
                    {Object.entries(lengthOptions[language]).map(
                      ([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Tone */}
                <div className="setting-group">
                  <label>{language === "ar" ? "النبرة" : "Tone"}</label>

                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="select-input"
                  >
                    {Object.entries(toneOptions[language]).map(
                      ([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------
            Content area (Input + Output)
        ----------------------------------------------------- */}
        <div className="scg-content">
          {/* --------------------------------------------
              Input panel
          --------------------------------------------- */}
          <motion.section
            className="input-panel"
            variants={slideIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div className="panel-header">
              <h2>{language === "ar" ? "إدخال الموضوع" : "Topic Input"}</h2>

              <div className={`status-indicator ${stage}`}>
                <div className="status-dot" />
                <span>{stageText[language][stage]}</span>
              </div>
            </div>

            <div className="input-group">
              <label>
                {language === "ar" ? "الموضوع الرئيسي" : "Main Topic"}
              </label>

              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "مثال: استراتيجيات التسويق الرقمي"
                    : "e.g. Digital marketing strategies"
                }
                disabled={loading}
                className="text-input"
                onKeyDown={(e) => e.key === "Enter" && generateContent()}
              />
            </div>

            <motion.div
              className="tip-box"
              key={`tip-${currentTip}-${language}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {tips[language][currentTip]}
            </motion.div>

            <div
              className="action-buttons"
              style={{ display: "flex", gap: 10, marginTop: 12 }}
            >
              <motion.button
                onClick={generateContent}
                disabled={loading || !topic.trim()}
                className={`primary-button ${loading ? "loading" : ""}`}
                variants={buttonHover}
                whileHover={!loading ? "hover" : undefined}
                whileTap={!loading ? "tap" : undefined}
              >
                {loading ? (
                  <>
                    <Loader2 className="spinner" />
                    {language === "ar" ? "جاري التوليد..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles />
                    {language === "ar"
                      ? "توليد المحتوى"
                      : "Generate Content"}
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => {
                  setTopic("");
                  setResult("");
                }}
                disabled={loading}
                className="secondary-button"
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
              >
                {language === "ar" ? "مسح الكل" : "Clear All"}
              </motion.button>
            </div>
          </motion.section>

          {/* --------------------------------------------
              Output panel
          --------------------------------------------- */}
          <motion.section
            className="output-panel"
            variants={slideIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="panel-header">
              <h2>{language === "ar" ? "النتيجة" : "Result"}</h2>

            <div className="output-actions">
                <motion.button
                  onClick={copyToClipboard}
                  disabled={!result}
                  className={`icon-button ${copied ? "copied" : ""}`}
                  variants={buttonHover}
                  whileHover={result ? "hover" : undefined}
                  whileTap={result ? "tap" : undefined}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span>
                    {copied
                      ? language === "ar"
                        ? "تم النسخ!"
                        : "Copied!"
                      : language === "ar"
                      ? "نسخ"
                      : "Copy"}
                  </span>
                </motion.button>

                <motion.button
                  onClick={saveAsFile}
                  disabled={!result}
                  className="icon-button"
                  variants={buttonHover}
                  whileHover={result ? "hover" : undefined}
                  whileTap={result ? "tap" : undefined}
                >
                  <Download size={18} />
                  <span>{language === "ar" ? "حفظ" : "Save"}</span>
                </motion.button>
              </div>
            </div>

            <div className="result-container">
              {result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="generated-content"
                >
                  <pre>{result}</pre>
                </motion.div>
              ) : (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkles size={40} className="icon" />
                  <p>
                    {language === "ar"
                      ? "سيظهر المحتوى المُولد هنا بعد الانتهاء من العملية"
                      : "Generated content will appear here when ready"}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>
        </div>

        {/* ----------------------------------------------------
            Footer
        ----------------------------------------------------- */}
        <motion.footer
          className="scg-footer"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          style={{ marginTop: 32 }}
        >
          <p>
            {language === "ar"
              ? "© 2025 مولّد المحتوى الذكي - جميع الحقوق محفوظة"
              : "© 2025 Smart Content Generator - All rights reserved"}
          </p>
        </motion.footer>
      </motion.main>
    </div>
  );
}
