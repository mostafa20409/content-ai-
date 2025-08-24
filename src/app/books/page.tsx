"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./BooksPage.css";

/* ---------- الأنواع والواجهات ---------- */
type Chapter = { 
  id: string; 
  title: string; 
  description: string;
  content: string;
  estimatedWords?: number;
};
type PlanLimits = { adsPerMonth: number; booksPerMonth: number; wordsPerMonth: number };
type LangKey = "ar" | "en";
type BookType = "RELIGIOUS" | "PHILOSOPHICAL" | "HORROR" | "SCIENTIFIC" | "HISTORICAL" | "LITERARY" | "SELF_DEVELOPMENT" | "ROMANCE" | "BIOGRAPHY" | "CHILDREN";

type BookState = {
  title: string;
  subtitle: string;
  description: string;
  bookType: BookType;
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
  includeExamples: boolean;
  generateCover: boolean;
  authorName: string;
  coverStyle: "minimal" | "modern" | "classic" | "elegant";
};

/* ---------- القيم الافتراضية والمساعدات ---------- */
const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  free: { adsPerMonth: 5, booksPerMonth: 1, wordsPerMonth: 30000 },
  pro: { adsPerMonth: 100, booksPerMonth: 12, wordsPerMonth: 500000 },
  premium: { adsPerMonth: 9999, booksPerMonth: 9999, wordsPerMonth: 9999999 },
};

const BOOK_TYPES = {
  RELIGIOUS: "ديني",
  PHILOSOPHICAL: "فلسفي", 
  HORROR: "رعب",
  SCIENTIFIC: "علمي",
  HISTORICAL: "تاريخي",
  LITERARY: "أدبي",
  SELF_DEVELOPMENT: "تطوير ذاتي",
  ROMANCE: "رومانسي",
  BIOGRAPHY: "سيرة ذاتية",
  CHILDREN: "أطفال"
} as const;

const COVER_STYLES = {
  minimal: "مينيمال",
  modern: "حديث",
  classic: "كلاسيكي",
  elegant: "أنيق"
} as const;

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
    bookTypeLabel: "نوع الكتاب",
    languageLabel: "اللغة",
    chaptersLabel: "عدد الفصول",
    chapterTitleLabel: "عنوان الفصل",
    chapterDescLabel: "وصف الفصل",
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
    includeExamples: "تضمين أمثلة واقعية",
    generateCover: "توليد غلاف الكتاب",
    authorNameLabel: "اسم الكاتب",
    coverStyleLabel: "نمط الغلاف",
    addChapter: "إضافة فصل",
    researchExamples: "أمثلة بحثية",
    coverPreview: "معاينة الغلاف",
    advancedOptions: "خيارات متقدمة"
  },
  en: {
    brand: "Book.AI",
    tagline: "Smart book generator — start your authoring journey",
    titleLabel: "Book Title",
    subtitleLabel: "Subtitle (optional)",
    descriptionLabel: "Short description (two lines describing the idea)",
    bookTypeLabel: "Book Type",
    languageLabel: "Language",
    chaptersLabel: "Number of Chapters",
    chapterTitleLabel: "Chapter Title",
    chapterDescLabel: "Chapter Description",
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
    includeExamples: "Include real examples",
    generateCover: "Generate book cover",
    authorNameLabel: "Author Name",
    coverStyleLabel: "Cover Style",
    addChapter: "Add Chapter",
    researchExamples: "Research Examples",
    coverPreview: "Cover Preview",
    advancedOptions: "Advanced Options"
  },
} as const;

/* ---------- المكون الرئيسي ---------- */
export default function BooksPage() {
  
  // الحالة الرئيسية
  const [state, setState] = useState<BookState>({
    title: "",
    subtitle: "",
    description: "",
    bookType: "LITERARY",
    chapters: [],
    chaptersCount: 3,
    lang: "ar",
    darkMode: false,
    plan: "free",
    generating: false,
    progressPercent: 0,
    error: null,
    notice: null,
    editingChapter: null,
    autoSaveStatus: "idle",
    includeExamples: true,
    generateCover: false,
    authorName: "",
    coverStyle: "modern"
  });

  const limits = DEFAULT_LIMITS[state.plan];
  const genCancelRef = useRef<{ cancelled?: boolean }>({ cancelled: false });
  const autosaveTimer = useRef<number | null>(null);

  // حساب عدد الكلمات
  const wordCount = useMemo(() => {
    let count = countWords(state.title) + countWords(state.subtitle) + countWords(state.description);
    state.chapters.forEach(ch => {
      count += countWords(ch.title) + countWords(ch.description) + countWords(ch.content);
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
        
        const draft = localStorage.getItem("book:draft:v4");
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
        localStorage.setItem("book:draft:v4", JSON.stringify(toSave));
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
      description: "",
      content: "",
    }));
  };

  const addNewChapter = () => {
    const newChapter: Chapter = {
      id: generateId(),
      title: `${state.lang === "ar" ? "الفصل" : "Chapter"} ${state.chapters.length + 1}`,
      description: "",
      content: "",
    };
    setState(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      chaptersCount: prev.chapters.length + 1
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
      chapters: prev.chapters.filter(ch => ch.id !== id),
      chaptersCount: prev.chapters.length - 1
    }));
  };

  /* ---------- توليد المحتوى ---------- */
  const generateChapterContent = (index: number, total: number, titleText: string, desc: string, chapterDesc: string, bookType: string, lang: LangKey) => {
    const bookTypeName = BOOK_TYPES[bookType as BookType] || bookType;
    
    const heading = lang === "ar" 
      ? `مقدمة عن ${titleText || "الموضوع"} - ${bookTypeName}`
      : `Introduction to ${titleText || "the topic"} - ${bookTypeName}`;
    
    const paragraphs = [
      `${heading}. ${desc}.`,
      lang === "ar"
        ? `في هذا الفصل سنستكشف الأفكار الأساسية حول: ${chapterDesc}. الفصل رقم ${index} من ${total}.`
        : `In this chapter we will explore the core ideas about: ${chapterDesc}. Chapter ${index} of ${total}.`,
      lang === "ar"
        ? "أمثلة وتطبيقات مختصرة، ومخطط مبسط للنقاط الرئيسة التي ينبغي تغطيتها."
        : "Short examples and practical tips, plus a concise outline of the main points to cover.",
      state.includeExamples ? (lang === "ar" 
        ? "يتضمن أمثلة واقعية من الأبحاث والدراسات."
        : "Includes real examples from research and studies.") : ""
    ];
    return paragraphs.filter(p => p).join("\n\n");
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
    if (state.chaptersCount < 1 || state.chaptersCount > 20) {
      setState(prev => ({ ...prev, error: state.lang === "ar" ? "عدد الفصول يجب أن يكون بين 1 و 20" : "Chapters must be between 1 and 20" }));
      return;
    }

    // التحقق من أن كل فصل له عنوان ووصف
    const incompleteChapters = state.chapters.filter(ch => !ch.title.trim() || !ch.description.trim());
    if (incompleteChapters.length > 0) {
      setState(prev => ({ 
        ...prev, 
        error: state.lang === "ar" 
          ? "جميع الفصول تحتاج إلى عنوان ووصف" 
          : "All chapters need title and description" 
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      generating: true,
      progressPercent: 0,
      error: null,
      notice: null
    }));
    genCancelRef.current.cancelled = false;

    try {
      for (let i = 0; i < state.chapters.length; i++) {
        if (genCancelRef.current.cancelled) throw new Error("cancelled");

        const chapter = state.chapters[i];
        setState(prev => ({
          ...prev,
          progressPercent: Math.round((i / state.chapters.length) * 100)
        }));

        // محاكاة استدعاء API
        await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
        
        const simulatedContent = generateChapterContent(
          i + 1, 
          state.chapters.length, 
          state.title, 
          state.description, 
          chapter.description,
          state.bookType,
          state.lang
        );

        updateChapter(chapter.id, { content: simulatedContent });
        await new Promise(r => setTimeout(r, 150));
      }

      setState(prev => ({
        ...prev,
        progressPercent: 100,
        notice: state.lang === "ar" ? "تم توليد الكتاب بنجاح" : "Book generated successfully"
      }));

      // إذا كان توليد الغلاف مفعلاً، نضيف معاينة الغلاف
      if (state.generateCover) {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            notice: state.lang === "ar" ? "تم توليد الغلاف أيضاً" : "Cover also generated"
          }));
        }, 1000);
      }

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
      `# ${state.title}`,
      state.subtitle && `## ${state.subtitle}`,
      "",
      state.description,
      "",
      ...state.chapters.flatMap((ch, i) => [
        `## الفصل ${i + 1}: ${ch.title}`,
        `### الوصف: ${ch.description}`,
        "",
        ch.content || "",
        "",
        "---",
        ""
      ])
    ].filter(Boolean);

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
          bookType: state.bookType,
          language: state.lang,
          chapters: state.chapters,
          includeExamples: state.includeExamples,
          generateCover: state.generateCover,
          authorName: state.authorName,
          coverStyle: state.coverStyle
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
              rows={3}
              value={state.description}
              onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
              placeholder={state.lang === "ar" ? "اكتب سطرين يوجزان فكرة الكتاب" : "Write two lines describing the core idea"}
            />
          </div>

          <div className="field">
            <label>{t.bookTypeLabel}</label>
            <select 
              value={state.bookType}
              onChange={(e) => setState(prev => ({ ...prev, bookType: e.target.value as BookType }))}
            >
              {Object.entries(BOOK_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t.authorNameLabel}</label>
            <input
              value={state.authorName}
              onChange={(e) => setState(prev => ({ ...prev, authorName: e.target.value }))}
              placeholder={state.lang === "ar" ? "اسم الكاتب" : "Author name"}
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
                max={20}
                value={state.chaptersCount}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  chaptersCount: Math.min(20, Math.max(1, Number(e.target.value)))
                }))}
              />
            </div>
          </div>

          {/* خيارات متقدمة */}
          <div className="advanced-options">
            <h3>{t.advancedOptions}</h3>
            
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="includeExamples"
                checked={state.includeExamples}
                onChange={(e) => setState(prev => ({ ...prev, includeExamples: e.target.checked }))}
              />
              <label htmlFor="includeExamples">{t.includeExamples}</label>
            </div>

            <div className="checkbox-field">
              <input
                type="checkbox"
                id="generateCover"
                checked={state.generateCover}
                onChange={(e) => setState(prev => ({ ...prev, generateCover: e.target.checked }))}
              />
              <label htmlFor="generateCover">{t.generateCover}</label>
            </div>

            {state.generateCover && (
              <div className="field">
                <label>{t.coverStyleLabel}</label>
                <select 
                  value={state.coverStyle}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    coverStyle: e.target.value as "minimal" | "modern" | "classic" | "elegant" 
                  }))}
                >
                  {Object.entries(COVER_STYLES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {state.error && <div className="error-box">{state.error}</div>}
          {state.notice && <div className="notice-box">{state.notice}</div>}

          <div className="controls-area">
            <button
              className="btn primary"
              onClick={handleGenerateBook}
              disabled={state.generating || state.chapters.length === 0}
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
              disabled={state.chapters.length === 0 || state.chapters.some(ch => !ch.content)}
            >
              {t.downloadBtn}
            </button>

            <button
              className="btn save"
              onClick={handleSaveFinal}
              disabled={state.chapters.length === 0 || state.chapters.some(ch => !ch.content)}
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
          <div className="panel-header">
            <h3>فصول الكتاب ({state.chapters.length})</h3>
            <button 
              className="btn tiny"
              onClick={addNewChapter}
              disabled={state.chapters.length >= 20}
            >
              + {t.addChapter}
            </button>
          </div>

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

          {state.chapters.length === 0 ? (
            <div className="empty-card">
              <div className="empty-illustration">📖</div>
              <h3>{t.emptyState}</h3>
              <p className="muted">
                {state.lang === "ar" 
                  ? "ابدأ بإضافة فصول أو اضغط على إنشاء فصول فارغة" 
                  : "Start by adding chapters or click create empty chapters"}
              </p>
            </div>
          ) : (
            <div className="chapters-grid">
              {state.chapters.map((ch, idx) => (
                <article className="chapter-card" key={ch.id}>
                  <div className="chapter-head">
                    <h4>{idx + 1}. {ch.title || t.chapterTitleLabel}</h4>
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
                    {ch.description && (
                      <p className="chapter-desc">
                        <strong>{t.chapterDescLabel}:</strong> {ch.description}
                      </p>
                    )}
                    <p className="preview">
                      {ch.content ? (
                        ch.content.length > 200 
                          ? ch.content.slice(0, 200) + "..." 
                          : ch.content
                      ) : (
                        <span className="muted">
                          {state.lang === "ar" ? "لم يتم توليد المحتوى بعد" : "Content not generated yet"}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="chapter-footer">
                    <div className="wc">
                      {countWords(ch.content)} {state.lang === "ar" ? "كلمة" : "words"}
                      {ch.content && state.includeExamples && (
                        <span className="research-badge" title={t.researchExamples}>
                          🔍
                        </span>
                      )}
                    </div>
                    <div className="cta">
                      <button 
                        className="btn tiny" 
                        onClick={() => openEditor(ch)}
                      >
                        {t.edit}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* معاينة الغلاف */}
          {state.generateCover && state.chapters.some(ch => ch.content) && (
            <div className="cover-preview">
              <h4>{t.coverPreview}</h4>
              <div className="cover-placeholder">
                <div className="cover-image">
                  <div className="cover-title">{state.title}</div>
                  {state.authorName && <div className="cover-author">{state.authorName}</div>}
                  <div className="cover-style">{COVER_STYLES[state.coverStyle]}</div>
                </div>
              </div>
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
  const [description, setDescription] = useState(chapter.description);
  const [content, setContent] = useState(chapter.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(chapter.title);
    setDescription(chapter.description);
    setContent(chapter.content);
  }, [chapter]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ title, description, content });
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
          <div className="field">
            <label>{t.chapterTitleLabel}</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={lang === "ar" ? "عنوان الفصل" : "Chapter title"}
            />
          </div>

          <div className="field">
            <label>{t.chapterDescLabel}</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === "ar" ? "وصف مختصر لمحتوى الفصل" : "Brief description of chapter content"}
            />
          </div>

          <div className="field">
            <label>{lang === "ar" ? "محتوى الفصل" : "Chapter Content"}</label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={lang === "ar" ? "محتوى الفصل سيتم توليده تلقائياً" : "Chapter content will be auto-generated"}
            />
          </div>

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