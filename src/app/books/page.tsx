"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./BooksPage.css";

/* ---------- الأنواع والواجهات ---------- */
type Chapter = { id: string; title: string; content: string };
type PlanLimits = { adsPerMonth: number; booksPerMonth: number; wordsPerMonth: number };
type LangKey = "ar" | "en";
type BookState = {
  title: string;
  subtitle: string;
  description: string;
  chapters: Chapter[];
  chaptersCount: number;
  lang: LangKey;
  darkMode: boolean;
  plan: "free" | "pro" | "premium";
  generating: boolean;
  progressPercent: number;
  error: string | null;
  notice: string | null;
  editingChapter: Chapter | null;
  autoSaveStatus: "idle" | "saving" | "saved";
};

/* ---------- القيم الافتراضية والمساعدات ---------- */
const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  free: { adsPerMonth: 5, booksPerMonth: 1, wordsPerMonth: 30000 },
  pro: { adsPerMonth: 100, booksPerMonth: 12, wordsPerMonth: 500000 },
  premium: { adsPerMonth: 9999, booksPerMonth: 9999, wordsPerMonth: 9999999 },
};

const generateId = (prefix = "c") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const countWords = (text?: string) => (text ? (text.trim().match(/\S+/g) || []).length : 0);

const safeFilename = (name = "book") => name.replace(/[^a-z0-9-.]/gi, "");

/* ---------- الترجمات ---------- */
const TRANSLATIONS = {
  ar: {
    brand: "كتاب.آي",
    tagline: "مولد الكتب الذكي — ابدأ رحلتك في التأليف",
    titleLabel: "عنوان الكتاب",
    subtitleLabel: "العنوان الفرعي (اختياري)",
    descriptionLabel: "وصف قصير (فكرة الكتاب - اكتب سطرين)",
    languageLabel: "اللغة",
    chaptersLabel: "عدد الفصول",
    generateBtn: "توليد الكتاب",
    createEmptyBtn: "إنشاء فصول فارغة",
    downloadBtn: "تحميل TXT",
    saveFinalBtn: "حفظ نهائي",
    emptyState: "لا يوجد محتوى حتى الآن — ابدأ بتوليد كتابك",
    darkMode: "وضع داكن",
    lightMode: "وضع فاتح",
    planLabel: "الخطة",
    draftStatus: "المسودة",
    wordsLabel: "كلمات الكتاب",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل تريد حذف هذا الفصل؟",
    saveChapter: "حفظ الفصل",
    close: "إغلاق",
    generating: "جاري التوليد...",
    genError: "حدث خطأ أثناء التوليد",
    saveError: "حدث خطأ أثناء الحفظ",
    savedSuccess: "تم الحفظ بنجاح",
    downloadPromptTitle: "تحميل كتاب كملف نصي",
    downloadPromptMsg: "سيتم تنزيل ملف TXT يحتوي على محتوى الكتاب.",
    previewTitle: "عرض سريع",
  },
  en: {
    brand: "Book.AI",
    tagline: "Smart book generator — start your authoring journey",
    titleLabel: "Book Title",
    subtitleLabel: "Subtitle (optional)",
    descriptionLabel: "Short description (two lines describing the idea)",
    languageLabel: "Language",
    chaptersLabel: "Number of Chapters",
    generateBtn: "Generate Book",
    createEmptyBtn: "Create Empty Chapters",
    downloadBtn: "Download TXT",
    saveFinalBtn: "Save Final",
    emptyState: "No content yet — start generating your book",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    planLabel: "Plan",
    draftStatus: "Draft",
    wordsLabel: "Book words",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this chapter?",
    saveChapter: "Save Chapter",
    close: "Close",
    generating: "Generating...",
    genError: "Error while generating",
    saveError: "Error while saving",
    savedSuccess: "Saved successfully",
    downloadPromptTitle: "Download book as TXT",
    downloadPromptMsg: "A TXT file containing the book content will be downloaded.",
    previewTitle: "Quick preview",
  },
} as const;

/* ---------- المكون الرئيسي ---------- */
export default function BooksPage() {
  // الحالة الرئيسية
  const [state, setState] = useState<BookState>({
    title: "",
    subtitle: "",
    description: "",
    chapters: [],
    chaptersCount: 8,
    lang: "ar",
    darkMode: false,
    plan: "free",
    generating: false,
    progressPercent: 0,
    error: null,
    notice: null,
    editingChapter: null,
    autoSaveStatus: "idle",
  });

  const limits = DEFAULT_LIMITS[state.plan];
  const genCancelRef = useRef<{ cancelled?: boolean }>({ cancelled: false });
  const autosaveTimer = useRef<number | null>(null);

  // حساب عدد الكلمات
  const wordCount = useMemo(() => {
    let count = countWords(state.title) + countWords(state.subtitle) + countWords(state.description);
    state.chapters.forEach(ch => {
      count += countWords(ch.title) + countWords(ch.content);
    });
    return count;
  }, [state.title, state.subtitle, state.description, state.chapters]);

  // الترجمة الحالية
  const t = useMemo(() => TRANSLATIONS[state.lang], [state.lang]);

  // تحميل البيانات المحفوظة عند التهيئة
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSavedData = () => {
      try {
        const lang = (localStorage.getItem("ui:lang") as LangKey) || "ar";
        const darkMode = localStorage.getItem("ui:theme") === "dark";
        const plan = (localStorage.getItem("ui:plan") || "free") as "free" | "pro" | "premium";
        
        const draft = localStorage.getItem("book:draft:v3");
        if (draft) {
          const parsed = JSON.parse(draft);
          setState(prev => ({
            ...prev,
            ...parsed,
            lang,
            darkMode,
            plan,
            generating: false,
            progressPercent: 0,
            error: null,
            notice: null,
            editingChapter: null,
            autoSaveStatus: "idle"
          }));
        } else {
          setState(prev => ({ ...prev, lang, darkMode, plan }));
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    };

    loadSavedData();
  }, []);

  // تطبيق إعدادات اللغة والوضع الداكن
  useEffect(() => {
    document.documentElement.setAttribute("dir", state.lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("data-theme", state.darkMode ? "dark" : "light");
  }, [state.lang, state.darkMode]);

  // الحفظ التلقائي
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    setState(prev => ({ ...prev, autoSaveStatus: "saving" }));

    autosaveTimer.current = window.setTimeout(() => {
      try {
        const { generating, progressPercent, error, notice, editingChapter, autoSaveStatus, ...toSave } = state;
        localStorage.setItem("book:draft:v3", JSON.stringify(toSave));
        setState(prev => ({ ...prev, autoSaveStatus: "saved" }));
        setTimeout(() => setState(prev => ({ ...prev, autoSaveStatus: "idle" })), 900);
      } catch (e) {
        console.error("Autosave failed", e);
        setState(prev => ({ ...prev, autoSaveStatus: "idle" }));
      }
    }, 1000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [state]);

  /* ---------- دوال إدارة الفصول ---------- */
  const createEmptyChapters = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      title: `${state.lang === "ar" ? "الفصل" : "Chapter"} ${i + 1}`,
      content: "",
    }));
  };

  const updateChapter = (id: string, updates: Partial<Chapter>) => {
    setState(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => (ch.id === id ? { ...ch, ...updates } : ch))
    }));
  };

  const deleteChapter = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setState(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== id)
    }));
  };

  /* ---------- توليد المحتوى ---------- */
  const generateChapterContent = (index: number, total: number, titleText: string, desc: string, lang: LangKey) => {
    const heading = lang === "ar" ? `مقدمة عن ${titleText || "الموضوع"}` : `Introduction to ${titleText || "the topic"}`;
    const paragraphs = [
      `${heading}. ${desc}.`,
      lang === "ar"
        ? `في هذا الفصل سنستكشف الأفكار الأساسية وسنبني جزءًا عمليًا يساعد القارئ على فهم السياق. الفصل رقم ${index} من ${total}.`
        : `In this chapter we will explore the core ideas and build practical sections that help the reader understand the context. Chapter ${index} of ${total}.`,
      lang === "ar"
        ? "أمثلة وتطبيقات مختصرة، ومخطط مبسط للنقاط الرئيسة التي ينبغي تغطيتها."
        : "Short examples and practical tips, plus a concise outline of the main points to cover.",
    ];
    return paragraphs.join("\n\n");
  };

  const handleGenerateBook = async () => {
    if (!state.title.trim()) {
      setState(prev => ({ ...prev, error: t.titleLabel + (state.lang === "ar" ? " مطلوب" : " is required") }));
      return;
    }
    if (!state.description.trim()) {
      setState(prev => ({ ...prev, error: t.descriptionLabel + (state.lang === "ar" ? " مطلوب" : " is required") }));
      return;
    }
    if (state.chaptersCount < 1 || state.chaptersCount > 60) {
      setState(prev => ({ ...prev, error: state.lang === "ar" ? "عدد الفصول يجب أن يكون بين 1 و 60" : "Chapters must be between 1 and 60" }));
      return;
    }

    setState(prev => ({
      ...prev,
      generating: true,
      chapters: [],
      progressPercent: 0,
      error: null,
      notice: null
    }));
    genCancelRef.current.cancelled = false;

    try {
      for (let i = 1; i <= state.chaptersCount; i++) {
        if (genCancelRef.current.cancelled) throw new Error("cancelled");

        setState(prev => ({
          ...prev,
          progressPercent: Math.round(((i - 1) / state.chaptersCount) * 100)
        }));

        // محاكاة استدعاء API
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        
        const simulatedTitle = `${state.lang === "ar" ? "الفصل" : "Chapter"} ${i} — ${(state.title.split(" ")[0] || "").trim()}`;
        const simulatedContent = generateChapterContent(i, state.chaptersCount, state.title, state.description, state.lang);

        const newChapter: Chapter = { 
          id: generateId(), 
          title: simulatedTitle, 
          content: simulatedContent 
        };

        setState(prev => ({
          ...prev,
          chapters: [...prev.chapters, newChapter]
        }));

        await new Promise(r => setTimeout(r, 120));
      }

      setState(prev => ({
        ...prev,
        progressPercent: 100,
        notice: state.lang === "ar" ? "تم توليد الكتاب بنجاح" : "Book generated successfully"
      }));
    } catch (err) {
      if ((err as Error).message === "cancelled") {
        setState(prev => ({
          ...prev,
          notice: state.lang === "ar" ? "تم إلغاء التوليد" : "Generation cancelled"
        }));
      } else {
        console.error(err);
        setState(prev => ({
          ...prev,
          error: t.genError
        }));
      }
    } finally {
      setState(prev => ({
        ...prev,
        generating: false
      }));
      setTimeout(() => setState(prev => ({ ...prev, progressPercent: 0 })), 800);
    }
  };

  const cancelGeneration = () => {
    genCancelRef.current.cancelled = true;
    setState(prev => ({ ...prev, generating: false }));
  };

  /* ---------- إدارة الملفات ---------- */
  const handleDownloadTXT = () => {
    if (!state.title.trim()) {
      alert(state.lang === "ar" ? "الرجاء إدخال عنوان لحفظ الملف" : "Please enter a title to save the file");
      return;
    }

    const contentParts = [
      state.title,
      state.subtitle,
      "",
      state.description,
      "",
      ...state.chapters.flatMap((ch, i) => [`## ${i + 1} - ${ch.title}`, ch.content || "", ""])
    ];

    const blob = new Blob([contentParts.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFilename(state.title || "book")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveFinal = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: state.title,
          subtitle: state.subtitle,
          description: state.description,
          language: state.lang,
          chapters: state.chapters,
        }),
      });

      const data = await res.json().catch(() => ({ error: t.saveError }));
      if (!res.ok) throw new Error(data.error || t.saveError);

      setState(prev => ({
        ...prev,
        notice: t.savedSuccess
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        error: (err as Error).message || t.saveError
      }));
    }
  };

  /* ---------- إدارة المحرر ---------- */
  const openEditor = (chapter: Chapter) => {
    setState(prev => ({ ...prev, editingChapter: chapter }));
  };

  const closeEditor = () => {
    setState(prev => ({ ...prev, editingChapter: null }));
  };

  const saveEditor = (updates: Partial<Chapter>) => {
    if (!state.editingChapter) return;
    updateChapter(state.editingChapter.id, updates);
    closeEditor();
  };

  /* ---------- واجهة المستخدم ---------- */
  return (
    <div className="bookai-root">
      {/* الشريط العلوي */}
      <header className="topbar">
        <div className="brand">
          <div className="logo-mark">📚</div>
          <div className="brand-text">
            <div className="brand-title">{t.brand}</div>
            <div className="brand-sub">{t.tagline}</div>
          </div>
        </div>

        <div className="top-actions">
          <div className="plan-select">
            <label className="sr-only">{t.planLabel}</label>
            <select 
              value={state.plan} 
              onChange={(e) => setState(prev => ({
                ...prev,
                plan: e.target.value as "free" | "pro" | "premium"
              }))}
              aria-label={t.planLabel}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="lang-toggle" role="group" aria-label="language">
            <button
              onClick={() => {
                const newLang = state.lang === "ar" ? "en" : "ar";
                setState(prev => ({ ...prev, lang: newLang }));
                if (typeof window !== "undefined") {
                  localStorage.setItem("ui:lang", newLang);
                }
              }}
              className="btn-ghost"
              title={state.lang === "ar" ? "تغيير اللغة" : "Toggle language"}
            >
              {state.lang === "ar" ? "العربية" : "English"}
            </button>
          </div>

          <div className="theme-toggle">
            <button
              className="btn-ghost"
              onClick={() => {
                const newDarkMode = !state.darkMode;
                setState(prev => ({
                  ...prev,
                  darkMode: newDarkMode,
                  notice: newDarkMode ? t.darkMode : t.lightMode
                }));
                if (typeof window !== "undefined") {
                  localStorage.setItem("ui:theme", newDarkMode ? "dark" : "light");
                }
                setTimeout(() => setState(prev => ({ ...prev, notice: null })), 1500);
              }}
              title={state.darkMode ? t.lightMode : t.darkMode}
            >
              {state.darkMode ? "🌙" : "☀"}
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main-grid">
        {/* اللوحة اليسرى */}
        <aside className="panel-left">
          <div className="field">
            <label>{t.titleLabel}</label>
            <input
              value={state.title}
              onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
              placeholder={state.lang === "ar" ? "مثال: دليل الكتابة الحديثة" : "e.g. Modern Writing Guide"}
            />
          </div>

          <div className="field">
            <label>{t.subtitleLabel}</label>
            <input
              value={state.subtitle}
              onChange={(e) => setState(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder={state.lang === "ar" ? "مثال: طريقة مبتكرة" : "e.g. An innovative approach"}
            />
          </div>

          <div className="field">
            <label>{t.descriptionLabel}</label>
            <textarea
              rows={4}
              value={state.description}
              onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
              placeholder={state.lang === "ar" ? "اكتب سطرين يوجزان فكرة الكتاب" : "Write two lines describing the core idea"}
            />
          </div>

          <div className="row">
            <div className="field small">
              <label>{t.languageLabel}</label>
              <div className="inline-switch">
                <button
                  className={state.lang === "ar" ? "active" : ""}
                  onClick={() => setState(prev => ({ ...prev, lang: "ar" }))}
                >
                  العربية
                </button>
                <button
                  className={state.lang === "en" ? "active" : ""}
                  onClick={() => setState(prev => ({ ...prev, lang: "en" }))}
                >
                  English
                </button>
              </div>
            </div>

            <div className="field small">
              <label>{t.chaptersLabel}</label>
              <input
                type="number"
                min={1}
                max={60}
                value={state.chaptersCount}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  chaptersCount: Math.min(60, Math.max(1, Number(e.target.value)))
                }))}
              />
            </div>
          </div>

          {state.error && <div className="error-box">{state.error}</div>}
          {state.notice && <div className="notice-box">{state.notice}</div>}

          <div className="controls-area">
            <button
              className="btn primary"
              onClick={handleGenerateBook}
              disabled={state.generating}
            >
              {state.generating ? t.generating : t.generateBtn}
            </button>

            <button
              className="btn outline"
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  chapters: createEmptyChapters(prev.chaptersCount),
                  progressPercent: 0,
                  notice: state.lang === "ar" ? "تم إنشاء الفصول الفارغة" : "Empty chapters created"
                }));
                setTimeout(() => setState(prev => ({ ...prev, notice: null })), 2200);
              }}
            >
              {t.createEmptyBtn}
            </button>

            <button
              className="btn"
              onClick={handleDownloadTXT}
              disabled={state.chapters.length === 0}
            >
              {t.downloadBtn}
            </button>

            <button
              className="btn save"
              onClick={handleSaveFinal}
              disabled={state.chapters.length === 0}
            >
              {t.saveFinalBtn}
            </button>
          </div>

          <div className="meta small muted">
            <div><strong>{t.planLabel}:</strong> {state.plan.toUpperCase()}</div>
            <div><strong>{t.draftStatus}:</strong> <em>{state.autoSaveStatus}</em></div>
            <div><strong>{t.wordsLabel}:</strong> <strong>{wordCount}</strong></div>
            <div style={{ marginTop: 6 }}>
              <small className="muted">Limits: {limits.wordsPerMonth.toLocaleString()} words / month</small>
            </div>
          </div>
        </aside>

        {/* اللوحة اليمنى */}
        <section className="panel-right">
          <div className="progress-row">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${state.progressPercent}%` }} />
            </div>
            <div className="progress-text">{state.progressPercent}%</div>

            {state.generating && (
              <div style={{ marginLeft: 12 }}>
                <button className="btn small outline" onClick={cancelGeneration}>
                  ⏹ {state.lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            )}
          </div>

          {!state.chapters.length ? (
            <div className="empty-card">
              <div className="empty-illustration">📖</div>
              <h3>{t.emptyState}</h3>
              <p className="muted">
                {state.lang === "ar" 
                  ? "ابدأ بتعبئة الحقول ثم اضغط توليد" 
                  : "Fill the fields and click generate to start"}
              </p>
            </div>
          ) : (
            <div className="chapters-grid">
              {state.chapters.map((ch, idx) => (
                <article className="chapter-card" key={ch.id}>
                  <div className="chapter-head">
                    <h4>{idx + 1}. {ch.title}</h4>
                    <div className="chapter-actions">
                      <button 
                        className="btn-ghost" 
                        onClick={() => openEditor(ch)} 
                        title={t.edit}
                      >
                        {t.edit}
                      </button>
                      <button 
                        className="btn-ghost danger" 
                        onClick={() => deleteChapter(ch.id)} 
                        title={t.delete}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                  <div className="chapter-body">
                    <p className="preview">
                      {ch.content.length > 400 
                        ? ch.content.slice(0, 400) + "..." 
                        : ch.content || (state.lang === "ar" ? "لا يوجد محتوى بعد" : "No content yet")}
                    </p>
                  </div>
                  <div className="chapter-footer">
                    <div className="wc">
                      {countWords(ch.content)} {state.lang === "ar" ? "كلمة" : "words"}
                    </div>
                    <div className="cta">
                      <button 
                        className="btn tiny" 
                        onClick={() => openEditor(ch)}
                      >
                       
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* التذييل */}
      <footer className="footer">
        <div>© {t.brand} — {new Date().getFullYear()}</div>
        <div className="muted small">Built with ❤ — clean, calm UI</div>
      </footer>

      {/* نافذة تحرير الفصل */}
      {state.editingChapter && (
        <ChapterEditor
          chapter={state.editingChapter}
          onClose={closeEditor}
          onSave={saveEditor}
          lang={state.lang}
          t={t}
        />
      )}

      {/* الإشعارات */}
      <div className="toast-area" aria-live="polite">
        {state.notice && <div className="toast">{state.notice}</div>}
      </div>
    </div>
  );
}

/* ---------- مكون محرر الفصول ---------- */
function ChapterEditor({
  chapter,
  onClose,
  onSave,
  lang,
  t
}: {
  chapter: Chapter;
  onClose: () => void;
  onSave: (updates: Partial<Chapter>) => void;
  lang: LangKey;
  t: typeof TRANSLATIONS[keyof typeof TRANSLATIONS];
}) {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
  }, [chapter]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ title, content });
      setSaving(false);
    }, 300);
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t.previewTitle}</h3>
          <button className="btn-ghost" onClick={onClose}>
            {t.close}
          </button>
        </div>

        <div className="modal-body">
          <label>{t.titleLabel}</label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />

          <label style={{ marginTop: 10 }}>{t.descriptionLabel}</label>
          <textarea
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="modal-footer">
            <div className="muted small">
              {countWords(content)} {lang === "ar" ? "كلمة" : "words"}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn outline" onClick={onClose}>
                {t.close}
              </button>
              <button 
                className="btn primary" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? "..." : t.saveChapter}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
