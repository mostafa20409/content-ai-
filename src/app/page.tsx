// app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiLoader, FiCopy, FiDownload, FiTrash2, FiClock, FiSun, FiMoon, FiGlobe } from "react-icons/fi";

/**
 * Landing / Home page (client)
 * - Auto-save (localStorage) for inputs, language, settings, and history
 * - Demo modal with fake generation (no server)
 * - Options: tone, length, content type
 * - History list (view / copy / download / delete)
 * - RTL/LTR handled by dir prop based on language
 *
 * Drop into app/page.tsx (Next.js app router). Make sure react-icons installed.
 */

// -------------------------------
// Constants & Types
// -------------------------------
type Lang = "ar" | "en";
type Tone = "formal" | "friendly" | "persuasive" | "humorous";
type LengthOption = "short" | "medium" | "long";
type ContentKind = "article" | "ad-generator" | "book-intro" | "summary";

const LOCAL_TOKEN_KEY = "token";
const LS_UI_DARK = "ui:dark";
const LS_UI_LANG = "ui:lang";
const LS_DEMO_PROMPT = "demo:prompt";
const LS_DEMO_SETTINGS = "demo:settings";
const LS_DEMO_HISTORY = "demo:history";

type DemoSettings = {
  tone: Tone;
  length: LengthOption;
  kind: ContentKind;
};

type HistoryItem = {
  id: string;
  timestamp: number;
  lang: Lang;
  prompt: string;
  settings: DemoSettings;
  result: string;
};

// -------------------------------
// Helpers
// -------------------------------
function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function clampHistory(history: HistoryItem[], max = 50) {
  return history.slice(0, max);
}

// -------------------------------
// LocalStorage Helpers (safe)
// -------------------------------
const safeGet = (key: string) => {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemove = (key: string) => {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {}
};

// -------------------------------
// Small presentational components
// -------------------------------
function IconButton({
  title,
  onClick,
  children,
  disabled,
  variant = "default"
}: {
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const variantClasses = {
    default: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200",
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-2 p-2 rounded-md border transition ${variantClasses[variant]} ${
        disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-sm"
      }`}
    >
      {children}
    </button>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="flex flex-col text-sm">
      {label && <span className="mb-1 text-xs opacity-80">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoaderInline({ size = 16 }: { size?: number }) {
  return <FiLoader className="animate-spin" style={{ width: size, height: size }} />;
}

// -------------------------------
// Demo Modal (internal component)
// -------------------------------
function DemoModal({
  lang,
  darkMode,
  initialPrompt,
  initialSettings,
  onClose,
  onSaveToHistory,
}: {
  lang: Lang;
  darkMode: boolean;
  initialPrompt?: string;
  initialSettings?: DemoSettings;
  onClose: () => void;
  onSaveToHistory: (item: HistoryItem) => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [settings, setSettings] = useState<DemoSettings>(
    initialSettings ?? { tone: "friendly", length: "medium", kind: "article" }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Auto-save prompt & settings to localStorage debounce
  useEffect(() => {
    safeSet(LS_DEMO_PROMPT, prompt);
  }, [prompt]);

  useEffect(() => {
    safeSet(LS_DEMO_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const run = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);

    // fake latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));

    // build deterministic-but-varied fake output
    const base = lang === "ar" ? `${prompt.trim()}` : `${prompt.trim()}`;
    const toneLabel =
      settings.tone === "formal"
        ? lang === "ar"
          ? "بأسلوب رسمي"
          : "in a formal tone"
        : settings.tone === "persuasive"
        ? lang === "ar"
          ? "بأسلوب إقناعي"
          : "in a persuasive tone"
        : settings.tone === "humorous"
        ? lang === "ar"
          ? "بأسلوب مرح"
          : "in a humorous tone"
        : lang === "ar"
        ? "بأسلوب ودي"
        : "in a friendly tone";

    const lengthFactor = settings.length === "short" ? 1 : settings.length === "medium" ? 2 : 4;

    // content kind variants
    let blocks: string[] = [];
    if (lang === "ar") {
      if (settings.kind === "article") {
        blocks = [
          `${base} — مقدمة سريعة ${toneLabel} تشرح النظرية العامة.`,
          `نقطة 1: شرح موجز يوضح أهمية ${base}.`,
          `نقطة 2: خطوات عملية للبدء في ${base}.`,
          `خاتمة: خلاصة ودعوة للتطبيق.`,
        ];
      } else if (settings.kind === "ad-generator") {
        blocks = [
          `${base} — إعلان مختصر يجذب الانتباه.`,
          `عرض محدود: جرب الآن واحصل على نتائج سريعة.`,
          `نداء للعمل: سجّل اليوم!`,
        ];
      } else if (settings.kind === "book-intro") {
        blocks = [
          `مقدمة للكتاب حول ${base} — توضيح الفكرة المركزية.`,
          `لماذا هذا الموضوع مهم الآن؟`,
          `مخطط الفصول: نقاط رئيسية ستُغطى.`,
        ];
      } else {
        blocks = [
          `ملخص عن ${base} — نقاط رئيسية.`,
          `خلاصة: النقاط التي يجب تذكّرها.`,
        ];
      }
    } else {
      // English
      if (settings.kind === "article") {
        blocks = [
          `${base} — a short intro ${toneLabel} that hooks the reader.`,
          `Point 1: Brief explanation of why ${base} matters.`,
          `Point 2: Practical steps to get started with ${base}.`,
          `Conclusion: summary and call to action.`,
        ];
      } else if (settings.kind === "ad-generator") {
        blocks = [
          `${base} — short ad headline with urgency.`,
          `Limited offer: try now and see quick results.`,
          `Call to action: Sign up today!`,
        ];
      } else if (settings.kind === "book-intro") {
        blocks = [
          `Book intro on ${base} — the core idea explained.`,
          `Why this topic is relevant today.`,
          `Chapter outline: main topics to be covered.`,
        ];
      } else {
        blocks = [
          `${base} — a concise summary of the topic.`,
          `Key takeaways: what to remember.`,
        ];
      }
    }

    // scale result length by lengthFactor
    let built = "";
    for (let i = 0; i < lengthFactor; i++) {
      built += blocks.map((b, _idx) => `${i > 0 ? "" : ""}${b}`).join("\n\n");
      if (i < lengthFactor - 1) built += "\n\n";
    }

    // append meta line
    built += `\n\n---\n${lang === "ar" ? "مولد تجريبي •" : "Demo generated •"} ${new Date().toLocaleString()}`;

    setResult(built);
    setIsGenerating(false);

    // save to history
    const item: HistoryItem = {
      id: uid("h_"),
      timestamp: Date.now(),
      lang,
      prompt: prompt.trim(),
      settings,
      result: built,
    };
    onSaveToHistory(item);
  };

  const clearAll = () => {
    setPrompt("");
    setResult(null);
    safeRemove(LS_DEMO_PROMPT);
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      // tiny feedback: browser-level; you may prefer toast
      alert(lang === "ar" ? "تم نسخ المحتوى!" : "Result copied!");
    } catch {
      // ignore
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const filename = `demo_${lang}_${new Date().toISOString()}.txt`;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl shadow-2xl p-6 ${
          darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">{lang === "ar" ? "ديمو فوري متقدم" : "Advanced Instant Demo"}</h3>
          <div className="flex gap-2 items-center">
            <IconButton onClick={copyResult} title={lang === "ar" ? "نسخ" : "Copy"} disabled={!result}>
              <FiCopy />
              <span className="hidden sm:inline">{lang === "ar" ? "نسخ" : "Copy"}</span>
            </IconButton>

            <IconButton onClick={downloadResult} title={lang === "ar" ? "تنزيل" : "Download"} disabled={!result}>
              <FiDownload />
              <span className="hidden sm:inline">{lang === "ar" ? "تنزيل" : "Download"}</span>
            </IconButton>

            <IconButton onClick={clearAll} title={lang === "ar" ? "مسح" : "Clear"} variant="danger">
              <FiTrash2 />
              <span className="hidden sm:inline">{lang === "ar" ? "مسح" : "Clear"}</span>
            </IconButton>

            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
            >
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            placeholder={lang === "ar" ? "اكتب موضوعًا للديمو..." : "Type a demo topic..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className={`w-full p-3 rounded-lg resize-vertical border ${
              darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
            }`}
          />

          <div className="flex gap-4 flex-wrap">
            <Select
              label={lang === "ar" ? "النبرة" : "Tone"}
              value={settings.tone}
              onChange={(v) => setSettings((s) => ({ ...s, tone: v as Tone }))}
              options={[
                { value: "friendly", label: lang === "ar" ? "ودي" : "Friendly" },
                { value: "formal", label: lang === "ar" ? "رسمي" : "Formal" },
                { value: "persuasive", label: lang === "ar" ? "إقناعي" : "Persuasive" },
                { value: "humorous", label: lang === "ar" ? "مرح" : "Humorous" },
              ]}
            />

            <Select
              label={lang === "ar" ? "الطول" : "Length"}
              value={settings.length}
              onChange={(v) => setSettings((s) => ({ ...s, length: v as LengthOption }))}
              options={[
                { value: "short", label: lang === "ar" ? "قصير" : "Short" },
                { value: "medium", label: lang === "ar" ? "متوسط" : "Medium" },
                { value: "long", label: lang === "ar" ? "طويل" : "Long" },
              ]}
            />

            <Select
              label={lang === "ar" ? "نوع المحتوى" : "Content type"}
              value={settings.kind}
              onChange={(v) => setSettings((s) => ({ ...s, kind: v as ContentKind }))}
              options={[
                { value: "article", label: lang === "ar" ? "مقال" : "Article" },
                { value: "ad-generator", label: lang === "ar" ? "إعلان" : "Ad" },
                { value: "book-intro", label: lang === "ar" ? "مقدمة كتاب" : "Book Intro" },
                { value: "summary", label: lang === "ar" ? "ملخص" : "Summary" },
              ]}
            />
          </div>

          <div className="flex gap-3 items-center">
            <button
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={run}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <LoaderInline />
                  <span>{lang === "ar" ? "جاري التوليد..." : "Generating..."}</span>
                </>
              ) : (
                <>
                  <span>{lang === "ar" ? "توليد" : "Generate"}</span>
                  <FiArrowRight />
                </>
              )}
            </button>

            <button 
              onClick={() => { setPrompt(""); setResult(null); }} 
              className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
            >
              {lang === "ar" ? "مسح الحقول" : "Clear fields"}
            </button>

            <div className="ml-auto flex gap-2 items-center text-sm opacity-70">
              <FiClock />
              <span>{lang === "ar" ? "هذا توليد تجريبي" : "Demo generator"}</span>
            </div>
          </div>

          <div>
            {result ? (
              <pre className={`whitespace-pre-wrap p-4 rounded-lg border ${
                darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"
              }`}>
                {result}
              </pre>
            ) : (
              <div className={`p-4 rounded-lg text-center ${
                darkMode ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-50"
              }`}>
                {lang === "ar" ? "أدخل موضوعًا واضغط توليد لمشاهدة مثال فوري." : "Enter a topic and press Generate to see an instant example."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------
// History List Component
// -------------------------------
function HistoryList({
  items,
  lang,
  onDelete,
  onCopy,
  onDownload,
}: {
  items: HistoryItem[];
  lang: Lang;
  onDelete: (id: string) => void;
  onCopy: (text: string) => Promise<void>;
  onDownload: (text: string, filename?: string) => void;
}) {
  if (!items.length) {
    return <div className="p-3 text-center opacity-75">{lang === "ar" ? "لا توجد محاولات سابقة." : "No previous attempts."}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((h) => (
        <div key={h.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-3 items-center justify-between flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{h.prompt}</div>
              <div className="text-sm opacity-70">{new Date(h.timestamp).toLocaleString()}</div>
            </div>

            <div className="flex gap-2">
              <IconButton
                onClick={() => onCopy(h.result)}
                title={lang === "ar" ? "نسخ النتيجة" : "Copy result"}
              >
                <FiCopy />
              </IconButton>

              <IconButton
                onClick={() => onDownload(h.result, `history_${h.id}.txt`)}
                title={lang === "ar" ? "تنزيل" : "Download"}
              >
                <FiDownload />
              </IconButton>

              <IconButton
                onClick={() => onDelete(h.id)}
                title={lang === "ar" ? "حذف" : "Delete"}
                variant="danger"
              >
                <FiTrash2 />
              </IconButton>
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-500 dark:text-blue-400">
              {lang === "ar" ? "عرض النتيجة" : "View result"}
            </summary>
            <pre className="whitespace-pre-wrap mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              {h.result}
            </pre>
          </details>
        </div>
      ))}
    </div>
  );
}

// -------------------------------
// Main Component
// -------------------------------
export default function LandingPage() {
  const router = useRouter();

  // ui state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      return (localStorage.getItem(LS_UI_DARK) ?? "false") === "true";
    } catch {
      return false;
    }
  });
  const [lang, setLang] = useState<Lang>(() => {
    try {
      if (typeof window === "undefined") return "ar";
      return (localStorage.getItem(LS_UI_LANG) as Lang) || "ar";
    } catch {
      return "ar";
    }
  });

  // demo modal
  const [showDemo, setShowDemo] = useState(false);

  // history
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = safeGet(LS_DEMO_HISTORY);
      if (!raw) return [];
      const parsed: HistoryItem[] = JSON.parse(raw);
      return parsed;
    } catch {
      return [];
    }
  });

  // effect: persist dark & lang to localStorage
  useEffect(() => {
    try {
      safeSet(LS_UI_DARK, darkMode ? "true" : "false");
      if (darkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [darkMode]);

  useEffect(() => {
    try {
      safeSet(LS_UI_LANG, lang);
    } catch {}
  }, [lang]);

  // auth check + redirect to dashboard if token exists
  useEffect(() => {
    try {
      const cookieToken =
        typeof document !== "undefined"
          ? document.cookie
              .split(";")
              .map((s) => s.trim())
              .find((s) => s.startsWith(`${LOCAL_TOKEN_KEY}=`))
          : null;
      const tokenFromCookie = cookieToken ? cookieToken.split("=")[1] : null;
      const tokenFromStorage = typeof window !== "undefined" ? localStorage.getItem(LOCAL_TOKEN_KEY) : null;
      const token = tokenFromCookie || tokenFromStorage || null;

      if (token) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // تم إضافة router إلى dependencies

  // helpers to update history (persist)
  const saveHistoryItem = (item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev];
      const clamped = clampHistory(next, 50);
      try {
        safeSet(LS_DEMO_HISTORY, JSON.stringify(clamped));
      } catch {}
      return clamped;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        safeSet(LS_DEMO_HISTORY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // small UX feedback
      alert(lang === "ar" ? "تم النسخ!" : "Copied!");
    } catch {
      // ignore
    }
  };

  const downloadText = (text: string, filename = `demo_${nowISO()}.txt`) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const clearAllHistory = () => {
    if (!confirm(lang === "ar" ? "مسح كل السجل؟" : "Clear all history?")) return;
    setHistory([]);
    safeRemove(LS_DEMO_HISTORY);
  };

  // UI text
  const t = useMemo(
    () => ({
      ar: {
        welcome: "مرحبًا بك في Content AI",
        desc: "أنشئ محتوى، إعلانات، وكتب كاملة بالذكاء الاصطناعي بسهولة.",
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        demo: "جرب الديمو",
        tools: "الأدوات",
        content: "توليد المحتوى",
        books: "كتابة الكتب",
        ads: "توليد الإعلانات",
        aboutShort: "أدوات ذكية لتوليد محتوى سريع وعملي.",
        demoPlaceholder: "اكتب موضوعًا للديمو (مثال: مقدمة عن التسويق الرقمي)",
        generate: "توليد",
        close: "إغلاق",
        historyTitle: "سجل التوليدات",
        clearHistory: "مسح السجل",
      },
      en: {
        welcome: "Welcome to Content AI",
        desc: "Create content, ads, and full books with AI — fast & simple.",
        login: "Login",
        signup: "Sign Up",
        demo: "Try Demo",
        tools: "Tools",
        content: "Content Generator",
        books: "Book Writer",
        ads: "Ads Generator",
        aboutShort: "Smart tools to generate content quickly.",
        demoPlaceholder: "Type a demo topic (eg. Intro to digital marketing)",
        generate: "Generate",
        close: "Close",
        historyTitle: "Generation history",
        clearHistory: "Clear history",
      },
    }),
    []
  );

  const L = t[lang];

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex gap-3 items-center">
          <strong className="text-lg">{L.welcome}</strong>
          <span className="opacity-70 hidden md:inline">{L.desc}</span>
        </div>

        <div className="flex gap-2 items-center">
          <IconButton
            onClick={() => setDarkMode((d) => !d)}
            title={lang === "ar" ? "تبديل الوضع" : "Toggle theme"}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </IconButton>

          <IconButton
            onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
            title="toggle-language"
          >
            <FiGlobe />
            <span className="text-sm">{lang === "ar" ? "EN" : "AR"}</span>
          </IconButton>
        </div>
      </header>

      {/* Main */}
      <main className="p-5 max-w-6xl mx-auto">
        {/* Hero */}
        <section className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{L.welcome}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{L.desc}</p>

          <div className="flex gap-4 justify-center flex-wrap mb-4">
            <button 
              onClick={() => router.push("/login")} 
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              {L.login}
            </button>
            <button 
              onClick={() => router.push("/signup")} 
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              {L.signup}
            </button>
            <button 
              onClick={() => setShowDemo(true)} 
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
            >
              {L.demo}
            </button>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => router.push("/content")} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
            >
              {L.content}
            </button>
            <button 
              onClick={() => router.push("/books")} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
            >
              {L.books}
            </button>
            <button 
              onClick={() => router.push("/ads")} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
            >
              {L.ads}
            </button>
          </div>
        </section>

        {/* Features & History layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: tools / about */}
          <div className="lg:col-span-2">
            <section className="mb-6">
              <h2 className="text-2xl font-bold mb-4">{lang === "ar" ? "الأدوات" : "Tools"}</h2>
              <div className="space-y-4">
                <article className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-3xl">✍</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{L.content}</h3>
                      <p className="opacity-75">{lang === "ar" ? "أنشئ مقالات ونصوص بسرعة." : "Generate articles & short-form copy fast."}</p>
                    </div>
                    <div>
                      <button 
                        onClick={() => router.push("/content")} 
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                      >
                        {L.demo}
                      </button>
                    </div>
                  </div>
                </article>

                <article className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-3xl">📚</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{L.books}</h3>
                      <p className="opacity-75">{lang === "ar" ? "بناء الفصول وملخصات الكتب بسهولة." : "Create book drafts & chapters with structure."}</p>
                    </div>
                    <div>
                      <button 
                        onClick={() => router.push("/books")} 
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                      >
                        {L.demo}
                      </button>
                    </div>
                  </div>
                </article>

                <article className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-3xl">📢</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{L.ads}</h3>
                      <p className="opacity-75">{lang === "ar" ? "انشاء نصوص إعلانات فعالة." : "Generate high-converting ad copy."}</p>
                    </div>
                    <div>
                      <button 
                        onClick={() => router.push("/ads")} 
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                      >
                        {L.demo}
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-xl font-semibold mb-3">{lang === "ar" ? "عن المنصة" : "About"}</h3>
              <p className="text-gray-600 dark:text-gray-300">{L.aboutShort}</p>
            </section>
          </div>

          {/* Right column: history */}
          <aside className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">{L.historyTitle}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowDemo(true)} 
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
                  title={lang === "ar" ? "جديد" : "New"}
                >
                  {lang === "ar" ? "جديد" : "New"}
                </button>
                <button 
                  onClick={clearAllHistory} 
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                  title={L.clearHistory}
                >
                  {lang === "ar" ? "مسح" : "Clear"}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto pr-2">
              <HistoryList
                items={history}
                lang={lang}
                onDelete={deleteHistoryItem}
                onCopy={copyToClipboard}
                onDownload={downloadText}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400">
        {lang === "ar" ? "© 2023 Content AI. جميع الحقوق محفوظة." : "© 2023 Content AI. All rights reserved."}
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <DemoModal
          lang={lang}
          darkMode={darkMode}
          initialPrompt={safeGet(LS_DEMO_PROMPT) ?? ""}
          initialSettings={
            safeGet(LS_DEMO_SETTINGS)
              ? JSON.parse(safeGet(LS_DEMO_SETTINGS)!)
              : undefined
          }
          onClose={() => setShowDemo(false)}
          onSaveToHistory={saveHistoryItem}
        />
      )}
    </div>
  );
}