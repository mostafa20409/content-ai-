// app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiLoader, FiCopy, FiDownload, FiTrash2, FiClock } from "react-icons/fi";

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
}: {
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border transition ${
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
        className="px-3 py-2 rounded-lg border"
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
      // eslint-disable-next-line no-alert
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
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1000px, 98%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: darkMode ? "#071427" : "#fff",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(2,6,23,0.3)",
          color: darkMode ? "#e6eef8" : "#0b1220",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ margin: 0 }}>{lang === "ar" ? "ديمو فوري متقدم" : "Advanced Instant Demo"}</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <IconButton onClick={copyResult} title={lang === "ar" ? "نسخ" : "Copy"} disabled={!result}>
              <FiCopy />
              <span className="hidden sm:inline">{lang === "ar" ? "نسخ" : "Copy"}</span>
            </IconButton>

            <IconButton onClick={downloadResult} title={lang === "ar" ? "تنزيل" : "Download"} disabled={!result}>
              <FiDownload />
              <span className="hidden sm:inline">{lang === "ar" ? "تنزيل" : "Download"}</span>
            </IconButton>

            <IconButton onClick={clearAll} title={lang === "ar" ? "مسح" : "Clear"}>
              <FiTrash2 />
              <span className="hidden sm:inline">{lang === "ar" ? "مسح" : "Clear"}</span>
            </IconButton>

            <button onClick={onClose} style={{ padding: 6 }}>
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <textarea
            placeholder={lang === "ar" ? "اكتب موضوعًا للديمو..." : "Type a demo topic..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              resize: "vertical",
              border: "1px solid #e6e9ee",
              background: darkMode ? "#071427" : "#fff",
              color: darkMode ? "#e6eef8" : "#111",
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                { value: "ad", label: lang === "ar" ? "إعلان" : "Ad" },
                { value: "book-intro", label: lang === "ar" ? "مقدمة كتاب" : "Book Intro" },
                { value: "summary", label: lang === "ar" ? "ملخص" : "Summary" },
              ]}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="primary"
              onClick={run}
              disabled={isGenerating || !prompt.trim()}
              style={{ padding: "10px 16px", display: "inline-flex", gap: 8, alignItems: "center" }}
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

            <button onClick={() => { setPrompt(""); setResult(null); }} style={{ padding: 8 }}>
              {lang === "ar" ? "مسح الحقول" : "Clear fields"}
            </button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <FiClock />
              <small style={{ opacity: 0.8 }}>{lang === "ar" ? "هذا توليد تجريبي" : "Demo generator"}</small>
            </div>
          </div>

          <div>
            {result ? (
              <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, background: darkMode ? "#071827" : "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e6e9ee", color: darkMode ? "#e6eef8" : "#111" }}>
                {result}
              </pre>
            ) : (
              <div style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
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
    return <div style={{ padding: 12, opacity: 0.75 }}>{lang === "ar" ? "لا توجد محاولات سابقة." : "No previous attempts."}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((h) => (
        <div key={h.id} style={{ padding: 12, borderRadius: 8, border: "1px solid #e6e9ee", background: "#fff" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{h.prompt}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(h.timestamp).toLocaleString()}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onCopy(h.result)}
                title={lang === "ar" ? "نسخ النتيجة" : "Copy result"}
                className="inline-flex items-center gap-2 px-2 py-1 rounded"
              >
                <FiCopy />
              </button>

              <button
                onClick={() => onDownload(h.result, `history_${h.id}.txt`)}
                title={lang === "ar" ? "تنزيل" : "Download"}
                className="inline-flex items-center gap-2 px-2 py-1 rounded"
              >
                <FiDownload />
              </button>

              <button
                onClick={() => onDelete(h.id)}
                title={lang === "ar" ? "حذف" : "Delete"}
                className="inline-flex items-center gap-2 px-2 py-1 rounded"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>

          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>{lang === "ar" ? "عرض النتيجة" : "View result"}</summary>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{h.result}</pre>
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
      if (darkMode) document.documentElement.classList.add("dark-mode");
      else document.documentElement.classList.remove("dark-mode");
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
  }, []);

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
      // eslint-disable-next-line no-alert
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
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={darkMode ? "dark-mode" : ""}>
      {/* Header */}
      <header style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>{L.welcome}</strong>
          <span style={{ opacity: 0.7, marginLeft: 8 }}>{L.desc}</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setDarkMode((d) => !d)}
            title={lang === "ar" ? "تبديل الوضع" : "Toggle theme"}
            style={{ padding: 8 }}
          >
            {darkMode ? "☀" : "🌙"}
          </button>

          <button
            onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
            title="toggle-language"
            style={{ padding: 8 }}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero */}
        <section style={{ padding: 20, borderRadius: 12, background: darkMode ? "#071427" : "#fff", boxShadow: "0 6px 20px rgba(2,6,23,0.06)" }}>
          <h1 style={{ margin: 0, fontSize: 28, textAlign: "center" }}>{L.welcome}</h1>
          <p style={{ textAlign: "center", color: darkMode ? "#cbd5e1" : "#374151", marginTop: 8 }}>{L.desc}</p>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/login")} className="primary" style={{ padding: "10px 16px" }}>{L.login}</button>
            <button onClick={() => router.push("/signup")} className="accent" style={{ padding: "10px 16px" }}>{L.signup}</button>
            <button onClick={() => setShowDemo(true)} style={{ padding: "10px 16px" }}>{L.demo}</button>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/content")} className="tool-link">{L.content}</button>
            <button onClick={() => router.push("/books")} className="tool-link">{L.books}</button>
            <button onClick={() => router.push("/ads")} className="tool-link">{L.ads}</button>
          </div>
        </section>

        {/* Features & History layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, marginTop: 18 }}>
          {/* Left column: tools / about */}
          <div>
            <section style={{ marginBottom: 18 }}>
              <h2 style={{ marginTop: 0 }}>{lang === "ar" ? "الأدوات" : "Tools"}</h2>
              <div style={{ display: "grid", gap: 12 }}>
                <article style={{ padding: 14, borderRadius: 8, border: "1px solid #e6e9ee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 26 }}>✍</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{L.content}</h3>
                      <p style={{ margin: 0, opacity: 0.75 }}>{lang === "ar" ? "أنشئ مقالات ونصوص بسرعة." : "Generate articles & short-form copy fast."}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <button onClick={() => router.push("/content")} className="primary">{L.demo}</button>
                    </div>
                  </div>
                </article>

                <article style={{ padding: 14, borderRadius: 8, border: "1px solid #e6e9ee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 26 }}>📚</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{L.books}</h3>
                      <p style={{ margin: 0, opacity: 0.75 }}>{lang === "ar" ? "بناء الفصول وملخصات الكتب بسهولة." : "Create book drafts & chapters with structure."}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <button onClick={() => router.push("/books")} className="primary">{L.demo}</button>
                    </div>
                  </div>
                </article>

                <article style={{ padding: 14, borderRadius: 8, border: "1px solid #e6e9ee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 26 }}>📢</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{L.ads}</h3>
                      <p style={{ margin: 0, opacity: 0.75 }}>{lang === "ar" ? "انشاء نصوص إعلانات فعالة." : "Generate high-converting ad copy."}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <button onClick={() => router.push("/ads")} className="primary">{L.demo}</button>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section style={{ marginTop: 6 }}>
              <h3>{lang === "ar" ? "عن المنصة" : "About"}</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>{L.aboutShort}</p>
            </section>
          </div>

          {/* Right column: history */}
          <aside style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>{L.historyTitle}</h4>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowDemo(true)} title={lang === "ar" ? "جديد" : "New"}>{lang === "ar" ? "جديد" : "New"}</button>
                <button onClick={clearAllHistory} title={L.clearHistory}>{lang === "ar" ? "مسح" : "Clear"}</button>
              </div>
            </div>

            <div style={{ maxHeight: 420, overflow: "auto", paddingRight: 8 }}>
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

        {/* Footer */}
        <footer style={{ marginTop: 20, textAlign: "center", color: darkMode ? "#94a3b8" : "#6b7280" }}>
          <small>© {new Date().getFullYear()} Content AI</small>
        </footer>
      </main>

      {/* Demo modal */}
      {showDemo && (
        <DemoModal
          lang={lang}
          darkMode={darkMode}
          initialPrompt={safeGet(LS_DEMO_PROMPT) ?? ""}
          initialSettings={((): DemoSettings | undefined => {
            try {
              const raw = safeGet(LS_DEMO_SETTINGS);
              if (!raw) return undefined;
              return JSON.parse(raw) as DemoSettings;
            } catch {
              return undefined;
            }
          })()}
          onClose={() => setShowDemo(false)}
          onSaveToHistory={(item) => saveHistoryItem(item)}
        />
      )}
    </div>
  );
}
