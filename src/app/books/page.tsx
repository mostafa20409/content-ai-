"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  authorName: string;
  currentStep: number;
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

const generateId = (prefix = "c") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const countWords = (text?: string) => (text ? (text.trim().match(/\S+/g) || []).length : 0);

const safeFilename = (name = "book") => name.replace(/[^a-z0-9-.]/gi, "");

/* ---------- الترجمات ---------- */
const TRANSLATIONS = {
  ar: {
    brand: "كتاب.آي",
    tagline: "مولد الكتب الذكي — ابدأ رحلتك في التأليف",
    titleLabel: "عنوان الكتاب *",
    subtitleLabel: "العنوان الفرعي (اختياري)",
    descriptionLabel: "وصف قصير (فكرة الكتاب - اكتب سطرين) *",
    bookTypeLabel: "نوع الكتاب *",
    languageLabel: "اللغة",
    chaptersLabel: "عدد الفصول *",
    chapterTitleLabel: "عنوان الفصل",
    chapterDescLabel: "وصف الفصل",
    generateBtn: "توليد الكتاب",
    createEmptyBtn: "إنشاء فصول فارغة",
    downloadBtn: "تحميل TXT",
    saveFinalBtn: "حفظ محلي",
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
    authorNameLabel: "اسم الكاتب *",
    addChapter: "إضافة فصل",
    researchExamples: "أمثلة بحثية",
    advancedOptions: "خيارات متقدمة",
    saveToLibrary: "حفظ في المكتبة",
    step1: "معلومات الكتاب الأساسية",
    step2: "إعداد الفصول",
    step3: "توليد المحتوى",
    requiredField: "هذا الحقل مطلوب",
    minWords: "يجب أن يحتوي على 20 كلمة على الأقل",
    nextStep: "التالي",
    prevStep: "السابق",
    startGenerating: "ابدأ التوليد",
    welcomeTitle: "مرحباً بك في منصة كتاب.آي",
    welcomeDesc: "منصة متكاملة لإنشاء الكتب الذكية باستخدام الذكاء الاصطناعي"
  },
  en: {
    brand: "Book.AI",
    tagline: "Smart book generator — start your authoring journey",
    titleLabel: "Book Title *",
    subtitleLabel: "Subtitle (optional)",
    descriptionLabel: "Short description (two lines describing the idea) *",
    bookTypeLabel: "Book Type *",
    languageLabel: "Language",
    chaptersLabel: "Number of Chapters *",
    chapterTitleLabel: "Chapter Title",
    chapterDescLabel: "Chapter Description",
    generateBtn: "Generate Book",
    createEmptyBtn: "Create Empty Chapters",
    downloadBtn: "Download TXT",
    saveFinalBtn: "Save Locally",
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
    authorNameLabel: "Author Name *",
    addChapter: "Add Chapter",
    researchExamples: "Research Examples",
    advancedOptions: "Advanced Options",
    saveToLibrary: "Save to Library",
    step1: "Basic Book Information",
    step2: "Chapter Setup",
    step3: "Content Generation",
    requiredField: "This field is required",
    minWords: "Must contain at least 20 words",
    nextStep: "Next",
    prevStep: "Previous",
    startGenerating: "Start Generation",
    welcomeTitle: "Welcome to Book.AI Platform",
    welcomeDesc: "A comprehensive platform for creating smart books using AI"
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
    authorName: "",
    currentStep: 1
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

  // التحقق من صحة الفصول
  const validateChapters = useCallback(() => {
    if (state.chapters.length === 0) {
      return state.lang === "ar" ? "يجب إنشاء الفصول أولاً" : "Chapters must be created first";
    }

    const incompleteChapters = state.chapters.filter(ch => 
      !ch.title.trim() || !ch.description.trim() || countWords(ch.description) < 20
    );

    if (incompleteChapters.length > 0) {
      return state.lang === "ar" 
        ? "كل فصل يحتاج إلى عنوان ووصف مفصل (20 كلمة على الأقل)"
        : "Each chapter needs a title and detailed description (at least 20 words)";
    }

    return null;
  }, [state.chapters, state.lang]);

  // التحقق من صحة الخطوة 1
  const validateStep1 = useCallback(() => {
    if (!state.title.trim()) {
      return t.titleLabel + " " + t.requiredField;
    }
    if (!state.description.trim() || countWords(state.description) < 10) {
      return t.descriptionLabel + " " + t.minWords;
    }
    if (!state.authorName.trim()) {
      return t.authorNameLabel + " " + t.requiredField;
    }
    return null;
  }, [state.title, state.description, state.authorName, t]);

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
  }, [state.title, state.subtitle, state.description, state.bookType, state.chapters, 
      state.chaptersCount, state.lang, state.plan, state.includeExamples, 
      state.authorName]);

  // استخدام useCallback لمنع إنشاء دوال جديدة في كل render
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleSubtitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, subtitle: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleBookTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, bookType: e.target.value as BookType }));
  }, []);

  const handleAuthorNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, authorName: e.target.value }));
  }, []);

  const handlePlanChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      plan: e.target.value as "free" | "pro" | "premium"
    }));
  }, []);

  const handleChaptersCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      chaptersCount: Math.min(20, Math.max(1, Number(e.target.value)))
    }));
  }, []);

  const handleIncludeExamplesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, includeExamples: e.target.checked }));
  }, []);

  const handleStepChange = useCallback((step: number) => {
    if (step === 2) {
      const step1Error = validateStep1();
      if (step1Error) {
        setState(prev => ({ ...prev, error: step1Error }));
        return;
      }
    } else if (step === 3) {
      const chaptersError = validateChapters();
      if (chaptersError) {
        setState(prev => ({ ...prev, error: chaptersError }));
        return;
      }
    }
    
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, [validateStep1, validateChapters]);

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

  /* ---------- توليد المحتوى الحقيقي باستخدام API ---------- */
  const handleGenerateBook = async () => {
    // التحقق من الحقول الأساسية
    if (!state.title.trim()) {
      setState(prev => ({ ...prev, error: t.titleLabel + (state.lang === "ar" ? " مطلوب" : " is required") }));
      return;
    }

    // التحقق من وصف الفصول
    const validationError = validateChapters();
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
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
      // إضافة مؤقت للتحقق من اتصال API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 ثانية timeout
      
      const response = await fetch("/api/books/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          bookType: state.bookType,
          bookLanguage: state.lang,
          chapters: state.chapters.map((ch, index) => ({
            chapterNumber: index + 1,
            title: ch.title,
            description: ch.description
          })),
          includeExamples: state.includeExamples,
          authorName: state.authorName,
          researchDepth: "advanced",
          authorStyle: "professional"
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.genError);
      }

      const data = await response.json();
      
      // تحديث الفصول بالمحتوى الحقيقي من API
      if (data.chapters && Array.isArray(data.chapters)) {
        data.chapters.forEach((generatedChapter: any, index: number) => {
          if (index < state.chapters.length) {
            updateChapter(state.chapters[index].id, { 
              content: generatedChapter.content 
            });
          }
        });
      }

      setState(prev => ({
        ...prev,
        progressPercent: 100,
        notice: state.lang === "ar" ? "تم توليد الكتاب بنجاح" : "Book generated successfully"
      }));

    } catch (err: any) {
      console.error("Generation error:", err);
      
      let errorMessage = t.genError;
      if (err.name === 'AbortError') {
        errorMessage = t.genError;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
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
        `## ${state.lang === "ar" ? "الفصل" : "Chapter"} ${i + 1}: ${ch.title}`,
        `### ${state.lang === "ar" ? "الوصف" : "Description"}: ${ch.description}`,
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

  const handleSaveFinal = () => {
    try {
      // حفظ محلي فقط بدون إرسال إلى الخادم
      localStorage.setItem("book:final:v1", JSON.stringify({
        title: state.title,
        subtitle: state.subtitle,
        description: state.description,
        bookType: state.bookType,
        language: state.lang,
        chapters: state.chapters,
        includeExamples: state.includeExamples,
        authorName: state.authorName,
        savedAt: new Date().toISOString()
      }));

      setState(prev => ({
        ...prev,
        notice: t.savedSuccess
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        error: t.saveError
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
              onChange={handlePlanChange}
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
        {/* شريط التقدم */}
        <div className="progress-steps">
          <div className={`step ${state.currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">{t.step1}</span>
          </div>
          <div className={`step ${state.currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">{t.step2}</span>
          </div>
          <div className={`step ${state.currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">{t.step3}</span>
          </div>
        </div>

        {/* اللوحة اليسرى */}
        <aside className="panel-left">
          {state.currentStep === 1 && (
            <>
              <h3>{t.step1}</h3>
              
              <div className="field">
                <label>{t.titleLabel}</label>
                <input
                  value={state.title}
                  onChange={handleTitleChange}
                  placeholder={state.lang === "ar" ? "مثال: دليل الكتابة الحديثة" : "e.g. Modern Writing Guide"}
                  required
                />
              </div>

              <div className="field">
                <label>{t.subtitleLabel}</label>
                <input
                  value={state.subtitle}
                  onChange={handleSubtitleChange}
                  placeholder={state.lang === "ar" ? "مثال: طريقة مبتكرة" : "e.g. An innovative approach"}
                />
              </div>

              <div className="field">
                <label>{t.descriptionLabel}</label>
                <textarea
                  rows={3}
                  value={state.description}
                  onChange={handleDescriptionChange}
                  placeholder={state.lang === "ar" ? "اكتب سطرين يوجزان فكرة الكتاب" : "Write two lines describing the core idea"}
                  required
                />
                <div className="word-count-hint">
                  {countWords(state.description)} {state.lang === "ar" ? "كلمة" : "words"}
                  {countWords(state.description) < 10 && (
                    <span className="error-text"> - {t.minWords}</span>
                  )}
                </div>
              </div>

              <div className="field">
                <label>{t.bookTypeLabel}</label>
                <select 
                  value={state.bookType}
                  onChange={handleBookTypeChange}
                  required
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
                  onChange={handleAuthorNameChange}
                  placeholder={state.lang === "ar" ? "اسم الكاتب" : "Author name"}
                  required
                />
              </div>

              <div className="field">
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

              <button 
                className="btn primary full-width" 
                onClick={() => handleStepChange(2)}
                disabled={!!validateStep1()}
              >
                {t.nextStep}
              </button>
            </>
          )}

          {state.currentStep === 2 && (
            <>
              <div className="step-header">
                <h3>{t.step2}</h3>
                <button 
                  className="btn-ghost" 
                  onClick={() => handleStepChange(1)}
                >
                  ← {t.prevStep}
                </button>
              </div>

              <div className="field">
                <label>{t.chaptersLabel}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={state.chaptersCount}
                  onChange={handleChaptersCountChange}
                  required
                />
              </div>

              {/* خيارات متقدمة */}
              <div className="advanced-options">
                <h4>{t.advancedOptions}</h4>
                
                <div className="checkbox-field">
                  <input
                    type="checkbox"
                    id="includeExamples"
                    checked={state.includeExamples}
                    onChange={handleIncludeExamplesChange}
                  />
                  <label htmlFor="includeExamples">{t.includeExamples}</label>
                </div>
              </div>

              <button
                className="btn outline full-width"
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
                className="btn primary full-width" 
                onClick={() => handleStepChange(3)}
                disabled={state.chapters.length === 0 || !!validateChapters()}
              >
                {t.nextStep}
              </button>
            </>
          )}

          {state.currentStep === 3 && (
            <>
              <div className="step-header">
                <h3>{t.step3}</h3>
                <button 
                  className="btn-ghost" 
                  onClick={() => handleStepChange(2)}
                >
                  ← {t.prevStep}
                </button>
              </div>

              {state.error && <div className="error-box">{state.error}</div>}
              {state.notice && <div className="notice-box">{state.notice}</div>}

              <div className="controls-area">
                <button
                  className="btn primary full-width"
                  onClick={handleGenerateBook}
                  disabled={state.generating || state.chapters.length === 0}
                >
                  {state.generating ? t.generating : t.startGenerating}
                </button>

                <button
                  className="btn full-width"
                  onClick={handleDownloadTXT}
                  disabled={state.chapters.length === 0 || state.chapters.some(ch => !ch.content)}
                >
                  {t.downloadBtn}
                </button>

                <button
                  className="btn save full-width"
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
                <div style={{ marginTop: 8 }}>
                  {limits.booksPerMonth === 1 ? "1 كتاب شهريًا" : `${limits.booksPerMonth} كتب شهريًا`}
                  {state.plan === "free" && ` (${limits.wordsPerMonth} كلمة)`}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* اللوحة اليمنى */}
        <section className="panel-right">
          {state.currentStep >= 2 && (
            <div className="chapters-header">
              <h3>
                {state.lang === "ar" ? "الفصول" : "Chapters"} 
                <span className="count-badge">{state.chapters.length}</span>
              </h3>
              <button className="btn-ghost" onClick={addNewChapter}>
                + {t.addChapter}
              </button>
            </div>
          )}

          <div className="chapters-list">
            {state.chapters.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>{t.emptyState}</p>
                <button 
                  className="btn outline" 
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      chapters: createEmptyChapters(prev.chaptersCount)
                    }));
                  }}
                >
                  {t.createEmptyBtn}
                </button>
              </div>
            ) : (
              state.chapters.map((chapter, index) => (
                <div key={chapter.id} className="chapter-card">
                  <div className="chapter-header">
                    <span className="chapter-number">{index + 1}</span>
                    <h4 className="chapter-title">
                      {chapter.title || `${state.lang === "ar" ? "الفصل" : "Chapter"} ${index + 1}`}
                    </h4>
                    <div className="chapter-actions">
                      <button
                        className="btn-ghost"
                        onClick={() => openEditor(chapter)}
                        title={t.edit}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => deleteChapter(chapter.id)}
                        title={t.delete}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="chapter-content">
                    <p className="chapter-desc">
                      {chapter.description || (
                        <span className="muted">
                          {state.lang === "ar" ? "لا يوجد وصف" : "No description"}
                        </span>
                      )}
                    </p>

                    {chapter.content && (
                      <div className="content-preview">
                        <details>
                          <summary>{t.previewTitle}</summary>
                          <div className="preview-content">
                            {chapter.content.slice(0, 200)}...
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  <div className="chapter-footer">
                    <span className="word-count">
                      {countWords(chapter.content)} {state.lang === "ar" ? "كلمة" : "words"}
                    </span>
                    {chapter.estimatedWords && (
                      <span className="estimated">
                        ~{chapter.estimatedWords} {state.lang === "ar" ? "متوقع" : "est."}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* شريط التقدم أثناء التوليد */}
      {state.generating && (
        <div className="generation-overlay">
          <div className="generation-modal">
            <h3>{t.generating}</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${state.progressPercent}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.round(state.progressPercent)}%</div>
            <button className="btn outline" onClick={cancelGeneration}>
              {state.lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* محرر الفصل */}
      {state.editingChapter && (
        <div className="editor-overlay">
          <div className="editor-modal">
            <div className="editor-header">
              <h3>{t.edit} {state.editingChapter.title}</h3>
              <button className="btn-ghost" onClick={closeEditor}>
                {t.close}
              </button>
            </div>

            <div className="editor-body">
              <div className="field">
                <label>{t.chapterTitleLabel}</label>
                <input
                  value={state.editingChapter.title}
                  onChange={(e) => {
                    setState(prev => ({
                      ...prev,
                      editingChapter: { ...prev.editingChapter!, title: e.target.value }
                    }));
                  }}
                />
              </div>

              <div className="field">
                <label>{t.chapterDescLabel}</label>
                <textarea
                  rows={4}
                  value={state.editingChapter.description}
                  onChange={(e) => {
                    setState(prev => ({
                      ...prev,
                      editingChapter: { ...prev.editingChapter!, description: e.target.value }
                    }));
                  }}
                  placeholder={state.lang === "ar" ? "صف محتوى هذا الفصل بالتفصيل..." : "Describe this chapter's content in detail..."}
                />
                <div className="word-count-hint">
                  {countWords(state.editingChapter.description)} {state.lang === "ar" ? "كلمة" : "words"}
                  {countWords(state.editingChapter.description) < 20 && (
                    <span className="error-text"> - {t.minWords}</span>
                  )}
                </div>
              </div>

              {state.editingChapter.content && (
                <div className="field">
                  <label>{state.lang === "ar" ? "المحتوى" : "Content"}</label>
                  <textarea
                    rows={8}
                    value={state.editingChapter.content}
                    onChange={(e) => {
                      setState(prev => ({
                        ...prev,
                        editingChapter: { ...prev.editingChapter!, content: e.target.value }
                      }));
                    }}
                    readOnly={state.generating}
                  />
                  <div className="word-count-hint">
                    {countWords(state.editingChapter.content)} {state.lang === "ar" ? "كلمة" : "words"}
                  </div>
                </div>
              )}
            </div>

            <div className="editor-footer">
              <button className="btn" onClick={closeEditor}>
                {t.close}
              </button>
              <button
                className="btn primary"
                onClick={() => saveEditor({
                  title: state.editingChapter!.title,
                  description: state.editingChapter!.description,
                  content: state.editingChapter!.content
                })}
              >
                {t.saveChapter}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* رسائل النظام */}
      {state.error && (
        <div className="toast error">
          <span>{state.error}</span>
          <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
            ✕
          </button>
        </div>
      )}

      {state.notice && (
        <div className="toast notice">
          <span>{state.notice}</span>
          <button onClick={() => setState(prev => ({ ...prev, notice: null }))}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}