// app/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import "./BooksPage.css";

/* ---------- الأنواع والواجهات ---------- */
type Chapter = { 
  id: string; 
  title: string; 
  description: string;
  content: string;
  estimatedWords?: number;
  imageUrl?: string;
  imageDescription?: string;
};
type LangKey = "ar" | "en";
type BookType = "RELIGIOUS" | "PHILOSOPHICAL" | "HORROR" | "SCIENTIFIC" | "HISTORICAL" | "LITERARY" | "SELF_DEVELOPMENT" | "ROMANCE" | "BIOGRAPHY" | "CHILDREN" | "REAL_STORY";

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
  authorName: string;
  currentStep: number;
  coverUrl: string | null;
  coverDescription: string;
  generatingCover: boolean;
  totalWords: number;
  generatingChapterImages: boolean;
  authorStyle: "professional" | "academic" | "creative" | "conversational" | "formal";
  saveToLibrary: boolean;
};

/* ---------- القيم الافتراضية والمساعدات ---------- */
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
  CHILDREN: "أطفال",
  REAL_STORY: "قصه حقيقيه"
} as const;

const AUTHOR_STYLES = {
  professional: "احترافي",
  academic: "أكاديمي",
  creative: "إبداعي",
  conversational: "محادثة",
  formal: "رسمي"
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
    authorNameLabel: "اسم الكاتب *",
    addChapter: "إضافة فصل",
    advancedOptions: "خيارات متقدمة",
    saveToLibraryLabel: "حفظ في المكتبة",
    step1: "معلومات الكتاب الأساسية",
    step2: "إعداد الفصول",
    step3: "توليد المحتوى",
    requiredField: "هذا الحقل مطلوب",
    minWords: "يجب أن يحتوي على 20 كلمة على الأقل",
    nextStep: "التالي",
    prevStep: "السابق",
    startGenerating: "ابدأ التوليد",
    welcomeTitle: "مرحباً بك في منصة كتاب.آي",
    welcomeDesc: "منصة متكاملة لإنشاء الكتب الذكية باستخدام الذكاء الاصطناعي",
    connectionError: "فشل الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
    offlineMode: "الوضع غير المتصل",
    useOfflineContent: "استخدام المحتوى التجريبي",
    offlineContentNotice: "يتم استخدام محتوى تجريبي لأغراض العرض فقط",
    booksPerMonth: "الكتب شهرياً",
    wordsPerMonth: "الكلمات شهرياً",
    warning: "تحذير",
    chapterWarning: "يجب إضافة وصف مفصل لكل فصل (20 كلمة على الأقل) للحصول على نتائج أفضل",
    coverDescriptionLabel: "وصف غلاف الكتاب (40 كلمة كحد أقصى)",
    generateCoverBtn: "توليد غلاف الكتاب",
    generatingCover: "جاري توليد الغلاف...",
    coverPlaceholder: "صف كيف تريد أن يبدو غلاف كتابك (لون، تصميم، عناصر، إلخ)",
    coverPreview: "معاينة الغلاف",
    maxWordsWarning: "الحد الأقصى 40 كلمة",
    totalWords: "إجمالي الكلمات",
    words: "كلمات",
    generateChapterImages: "توليد صور للفصول",
    generatingChapterImages: "جاري توليد صور الفصول...",
    chapterImageLabel: "وصف صورة الفصل (اختياري)",
    chapterImagePlaceholder: "صف كيف تريد أن تبدو صورة هذا الفصل",
    chapterImagePreview: "صورة الفصل",
    maxChapterImages: "الحد الأقصى 2 صورة للفصل الواحد",
    authorStyleLabel: "أسلوب الكتابة",
    professionalStyle: "احترافي",
    academicStyle: "أكاديمي",
    creativeStyle: "إبداعي",
    conversationalStyle: "محادثة",
    formalStyle: "رسمي"
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
    authorNameLabel: "Author Name *",
    addChapter: "Add Chapter",
    advancedOptions: "Advanced Options",
    saveToLibraryLabel: "Save to Library",
    step1: "Basic Book Information",
    step2: "Chapter Setup",
    step3: "Content Generation",
    requiredField: "This field is required",
    minWords: "Must contain at least 20 words",
    nextStep: "Next",
    prevStep: "Previous",
    startGenerating: "Start Generation",
    welcomeTitle: "Welcome to Book.AI Platform",
    welcomeDesc: "A comprehensive platform for creating smart books using AI",
    connectionError: "Failed to connect to AI service. Please check your internet connection and try again.",
    offlineMode: "Offline Mode",
    useOfflineContent: "Use sample content",
    offlineContentNotice: "Using sample content for demonstration purposes only",
    booksPerMonth: "Books per month",
    wordsPerMonth: "Words per month",
    warning: "Warning",
    chapterWarning: "Please add detailed description for each chapter (at least 20 words) for better results",
    coverDescriptionLabel: "Book cover description (max 40 words)",
    generateCoverBtn: "Generate Book Cover",
    generatingCover: "Generating cover...",
    coverPlaceholder: "Describe how you want your book cover to look (color, design, elements, etc.)",
    coverPreview: "Cover Preview",
    maxWordsWarning: "Maximum 40 words",
    totalWords: "Total Words",
    words: "words",
    generateChapterImages: "Generate chapter images",
    generatingChapterImages: "Generating chapter images...",
    chapterImageLabel: "Chapter image description (optional)",
    chapterImagePlaceholder: "Describe how you want this chapter image to look",
    chapterImagePreview: "Chapter Image",
    maxChapterImages: "Maximum 2 images per chapter",
    authorStyleLabel: "Writing Style",
    professionalStyle: "Professional",
    academicStyle: "Academic",
    creativeStyle: "Creative",
    conversationalStyle: "Conversational",
    formalStyle: "Formal"
  },
} as const;

// محتوى تجريبي للاستخدام في وضع عدم الاتصال
const SAMPLE_CONTENT = {
  ar: {
    chapters: [
      {
        title: "مقدمة في الكتابة",
        content: `الكتابة هي فن التعبير عن الأفكار والمشاعر باستخدام الكلمات. تمتلك الكتابة قوة سحرية تمكن الكاتب من نقل تجاربه ورؤيته للعالم إلى القارئ. في هذا الفصل، سنستكشف الأساسيات التي يحتاجها كل كاتب مبتدئ لبدء رحلته في عالم التأليف.

تتطلب الكتابة الجودة الممارسة المستمرة والقراءة الواسعة. كلما قرأت أكثر، كلما اكتسبت أدوات أكثر للتعبير عن أفكارك بطلاقة ووضوح. ليس المهم فقط ما تكتبه، ولكن كيف تكتبه والأسلوب الذي تتبناه في صياغة جملك.

ستتعلم في هذا الفصل كيفية تنظيم أفكارك، وإنشاء مخطط أولي لكتابك، والتغلب على عقبات الكاتب التي يواجهها الكثيرون في البداية.`
      },
      {
        title: "بناء الشخصيات في الرواية",
        content: `الشخصيات هي قلب أي قصة روائية. بدون شخصيات ذات عمق ومصداقية، تفقد القصة بريقها وقدرتها على جذب القارئ. في هذا الفصل، سنتعمق في فن创建 شخصيات لا تنسى.

أولاً، يجب أن تمتلك الشخصية دافعًا واضحًا وأهدافًا تسعى لتحقيقها. ثانيًا، تحتاج إلى خلفية تاريخية تشرح تصرفاتها وتفكيرها. ثالثًا، يجب أن تكون هناك تطورات في الشخصية مع تقدم الأحداث.

سنتعلم أيضًا كيفية كتابة الحوار المقنع الذي يعكس شخصية المتحدث، وكيفية وصف الملامح والإيمونات التي تعبر عن حالة الشخصية العاطفية دون الحاجة إلى شرح مباشر.`
      },
      {
        title: "الخاتمة والإرث",
        content: `إنهاء الكتاب بشكل مناسب هو تحدي يواجه العديد من الكتاب. الخاتمة الجيدة تترك أثرًا دائمًا في ذهن القارئ وتغلق جميع الأقواس الدرامية التي فتحت خلال القصة.

في هذا الفصل، سنناقش أنواع النهايات المختلفة: النهايات المفتوحة التي تترك مجالاً للتخيل، النهايات المغلقة التي تقدم حلًا نهائيًا لكل الأسئلة، والنهايات المفاجئة التي تغير منظور القارئ للقصة بأكملها.

سنتعلم أيضًا كيفية كتابة خاتمة تليق بالرحلة التي مر بها القارئ، وتوفر الإشباع العاطفي مع ترك بعض الأسئلة الفلسفية للتفكير فيها بعد انتهاء القراءة.`
      }
    ]
  },
  en: {
    chapters: [
      {
        title: "Introduction to Writing",
        content: `Writing is the art of expressing ideas and emotions using words. It possesses a magical power that enables the writer to transfer their experiences and worldview to the reader. In this chapter, we will explore the fundamentals that every beginner writer needs to start their journey in the world of authorship.

Good writing requires continuous practice and extensive reading. The more you read, the more tools you acquire to express your ideas fluently and clearly. It's not only important what you write, but how you write it and the style you adopt in formulating your sentences.

In this chapter, you will learn how to organize your ideas, create an initial outline for your book, and overcome writer's block that many face at the beginning.`
      },
      {
        title: "Character Building in Novels",
        content: `Characters are the heart of any novel story. Without characters with depth and credibility, the story loses its luster and its ability to attract the reader. In this chapter, we will delve into the art of creating unforgettable characters.

First, the character must have a clear motivation and goals to achieve. Second, they need a historical background that explains their actions and thinking. Third, there must be developments in the character as events progress.

We will also learn how to write convincing dialogue that reflects the speaker's personality, and how to describe features and gestures that express the character's emotional state without the need for direct explanation.`
      },
      {
        title: "Conclusion and Legacy",
        content: `Ending a book appropriately is a challenge many writers face. A good conclusion leaves a lasting impression in the reader's mind and closes all the dramatic arcs opened during the story.

In this chapter, we will discuss different types of endings: open endings that leave room for imagination, closed endings that provide a final solution to all questions, and surprising endings that change the reader's perspective of the entire story.

We will also learn how to write a conclusion worthy of the journey the reader has undergone, providing emotional satisfaction while leaving some philosophical questions to ponder after finishing reading.`
      }
    ]
  }
};

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
    authorName: "",
    currentStep: 1,
    coverUrl: null,
    coverDescription: "",
    generatingCover: false,
    totalWords: 0,
    generatingChapterImages: false,
    authorStyle: "professional",
    saveToLibrary: true
  });

  const genCancelRef = useRef<{ cancelled?: boolean }>({ cancelled: false });
  const autosaveTimer = useRef<number | null>(null);
  const prevStateRef = useRef<Partial<BookState>>({});

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
            autoSaveStatus: "idle",
            generatingChapterImages: false
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

  // الحفظ التلقائي - تم التصحيح لمنع التكرار اللانهائي
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    // الحفظ فقط عند تغيير البيانات المهمة، وليس عند كل تغيير في state
    const shouldSave = 
      state.title !== prevStateRef.current?.title ||
      state.description !== prevStateRef.current?.description ||
      state.chapters !== prevStateRef.current?.chapters ||
      state.authorName !== prevStateRef.current?.authorName;

    if (shouldSave) {
      autosaveTimer.current = window.setTimeout(() => {
        try {
          const { generating, progressPercent, error, notice, editingChapter, autoSaveStatus, generatingChapterImages, ...toSave } = state;
          localStorage.setItem("book:draft:v4", JSON.stringify(toSave));
          setState(prev => ({ ...prev, autoSaveStatus: "saved" }));
          setTimeout(() => setState(prev => ({ ...prev, autoSaveStatus: "idle" })), 2000);
        } catch (e) {
          console.error("Autosave failed", e);
          setState(prev => ({ ...prev, autoSaveStatus: "idle" }));
        }
      }, 2000); // زيادة وقت التأخير إلى 2 ثانية
    }

    prevStateRef.current = state;

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [state.title, state.description, state.chapters, state.authorName]); // dependencies محدودة

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

  const handleCoverDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, coverDescription: e.target.value }));
  }, []);

  const handleAuthorStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, authorStyle: e.target.value as any }));
  }, []);

  const handleSaveToLibraryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, saveToLibrary: e.target.checked }));
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

  // معالج التغيير لمحرر الفصول - تم التصحيح لمنع التكرار اللانهائي
  const handleEditChapterChange = useCallback((field: 'title' | 'description' | 'imageDescription', value: string) => {
    setState(prev => {
      if (!prev.editingChapter) return prev;
      
      return {
        ...prev,
        editingChapter: {
          ...prev.editingChapter,
          [field]: value
        }
      };
    });
  }, []);

  /* ---------- دوال إدارة الفصول ---------- */
  const createEmptyChapters = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      title: `${state.lang === "ar" ? "الفصل" : "Chapter"} ${i + 1}`,
      description: "",
      content: "",
      imageDescription: "",
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

    let controller: AbortController | null = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // إضافة مؤقت للتحقق من اتصال API
      timeoutId = setTimeout(() => {
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      }, 60000); // 60 ثانية timeout
      
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
            description: ch.description,
            imageDescription: ch.imageDescription || ""
          })),
          authorName: state.authorName,
          authorStyle: state.authorStyle,
          coverDescription: state.coverDescription,
          generateChapterImages: true,
          saveToLibrary: state.saveToLibrary
        }),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(state.lang === "ar" ? "غير مصرح بالوصول" : "Unauthorized access");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.genError);
      }

      const data = await response.json();
      
      // تحديث الفصول بالمحتوى الحقيقي من API
      if (data.chapters && Array.isArray(data.chapters)) {
        data.chapters.forEach((generatedChapter: any, index: number) => {
          if (index < state.chapters.length) {
            updateChapter(state.chapters[index].id, { 
              content: generatedChapter.content,
              imageUrl: generatedChapter.imageUrl || undefined
            });
          }
        });
      }

      // تحديث رابط الغلاف إذا تم توليده
      if (data.book && data.book.coverUrl) {
        setState(prev => ({ ...prev, coverUrl: data.book.coverUrl }));
      }

      // تحديث إجمالي الكلمات إذا كان متوفراً في الاستجابة
      if (data.totalWords) {
        setState(prev => ({ ...prev, totalWords: data.totalWords }));
      }

      setState(prev => ({
        ...prev,
        progressPercent: 100,
        notice: state.lang === "ar" ? "تم توليد الكتاب بنجاح" : "Book generated successfully"
      }));

    } catch (err: any) {
      console.error("Generation error:", err);
      
      let errorMessage: string;
      if (err.name === 'AbortError') {
        errorMessage = t.connectionError;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = t.genError;
      }
      
      // في حالة فشل الاتصال، نعرض خيار استخدام المحتوى التجريبي
      if (err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('connection')) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          notice: state.lang === "ar" ? 
            "يمكنك استخدام المحتوى التجريبي للاستمرار" : 
            "You can use sample content to continue"
        }));
        
        // استخدام المحتوى التجريبي مباشرة بدلاً من استدعاء دالة
        const sampleChapters = SAMPLE_CONTENT[state.lang].chapters;
        setState(prev => {
          const updatedChapters = prev.chapters.map((chapter, index) => {
            if (index < sampleChapters.length) {
              return {
                ...chapter,
                content: sampleChapters[index].content
              };
            }
            return chapter;
          });
          
          return {
            ...prev,
            chapters: updatedChapters,
            notice: t.offlineContentNotice,
            progressPercent: 100
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
      }
    } finally {
      // تنظيف المؤقتات
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
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

  /* ---------- توليد غلاف الكتاب ---------- */
  const handleGenerateCover = async () => {
    if (!state.coverDescription.trim() || state.coverDescription.split(/\s+/).filter(Boolean).length > 40) {
      setState(prev => ({
        ...prev,
        error: state.lang === "ar" 
          ? "يجب إدخال وصف للغلاف (40 كلمة كحد أقصى)" 
          : "Please enter a cover description (max 40 words)"
      }));
      return;
    }

    setState(prev => ({ ...prev, generatingCover: true, error: null }));

    try {
      const response = await fetch("/api/books/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          coverDescription: state.coverDescription,
          bookType: state.bookType,
          language: state.lang,
          authorName: state.authorName
        }),
      });

      if (!response.ok) {
        throw new Error(state.lang === "ar" ? "فشل في توليد الغلاف" : "Failed to generate cover");
      }

      const data = await response.json();
      if (data.coverUrl) {
        setState(prev => ({ ...prev, coverUrl: data.coverUrl }));
      }
    } catch (error: any) {
      console.error('Cover generation error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || (state.lang === "ar" ? "فشل في توليد الغلاف" : "Failed to generate cover")
      }));
    } finally {
      setState(prev => ({ ...prev, generatingCover: false }));
    }
  };

  /* ---------- توليد صور الفصول ---------- */
  const handleGenerateChapterImages = async () => {
    setState(prev => ({ ...prev, generatingChapterImages: true, error: null }));

    try {
      const response = await fetch("/api/books/generate-chapter-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chapters: state.chapters.map((ch, index) => ({
            chapterNumber: index + 1,
            title: ch.title,
            description: ch.description,
            imageDescription: ch.imageDescription || ""
          })),
          bookTitle: state.title,
          bookType: state.bookType,
          language: state.lang
        }),
      });

      if (!response.ok) {
        throw new Error(state.lang === "ar" ? "فشل في توليد صور الفصول" : "Failed to generate chapter images");
      }

      const data = await response.json();
      
      // تحديث صور الفصول
      if (data.result && Array.isArray(data.result)) {
        data.result.forEach((result: any) => {
          if (result.success && result.imageUrl) {
            const chapterIndex = state.chapters.findIndex(ch => ch.id === state.chapters[result.chapterNumber - 1]?.id);
            if (chapterIndex !== -1) {
              updateChapter(state.chapters[chapterIndex].id, { 
                imageUrl: result.imageUrl
              });
            }
          }
        });
      }

      setState(prev => ({ 
        ...prev, 
        notice: state.lang === "ar" ? "تم توليد صور الفصول بنجاح" : "Chapter images generated successfully" 
      }));
    } catch (error: any) {
      console.error('Chapter images generation error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || (state.lang === "ar" ? "فشل في توليد صور الفصول" : "Failed to generate chapter images")
      }));
    } finally {
      setState(prev => ({ ...prev, generatingChapterImages: false }));
    }
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
        ch.imageUrl && `### ${state.lang === "ar" ? "صورة الفصل" : "Chapter Image"}: ${ch.imageUrl}`,
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
        authorName: state.authorName,
        coverUrl: state.coverUrl,
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
                <label>{t.authorStyleLabel}</label>
                <select 
                  value={state.authorStyle}
                  onChange={handleAuthorStyleChange}
                >
                  {Object.entries(AUTHOR_STYLES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{t.coverDescriptionLabel}</label>
                <textarea
                  rows={2}
                  value={state.coverDescription}
                  onChange={handleCoverDescriptionChange}
                  placeholder={t.coverPlaceholder}
                  maxLength={200}
                />
                <div className="word-count-hint">
                  {state.coverDescription.split(/\s+/).filter(Boolean).length} {state.lang === "ar" ? "كلمة" : "words"}
                  {state.coverDescription.split(/\s+/).filter(Boolean).length > 40 && (
                    <span className="error-text"> - {t.maxWordsWarning}</span>
                  )}
                </div>
              </div>

              <div className="field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.saveToLibrary}
                    onChange={handleSaveToLibraryChange}
                  />
                  {t.saveToLibraryLabel}
                </label>
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

              <div className="actions">
                <button 
                  className="btn-primary"
                  onClick={() => handleStepChange(2)}
                >
                  {t.nextStep}
                </button>
              </div>
            </>
          )}

          {state.currentStep === 2 && (
            <>
              <h3>{t.step2}</h3>
              
              <div className="field">
                <label>{t.chaptersLabel}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={state.chaptersCount}
                  onChange={handleChaptersCountChange}
                />
              </div>

              <div className="actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const newChapters = createEmptyChapters(state.chaptersCount);
                    setState(prev => ({
                      ...prev,
                      chapters: newChapters
                    }));
                  }}
                >
                  {t.createEmptyBtn}
                </button>
              </div>

              {state.chapters.length > 0 && (
                <div className="chapters-list">
                  {state.chapters.map((chapter, index) => (
                    <div key={chapter.id} className="chapter-item">
                      <div className="chapter-header">
                        <span className="chapter-number">{index + 1}</span>
                        <span className="chapter-title">{chapter.title}</span>
                        <div className="chapter-actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEditor(chapter)}
                            title={t.edit}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => deleteChapter(chapter.id)}
                            title={t.delete}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="chapter-desc">
                        {chapter.description || (
                          <span className="placeholder">
                            {state.lang === "ar" ? "لا يوجد وصف" : "No description"}
                          </span>
                        )}
                      </div>
                      {chapter.description && countWords(chapter.description) < 20 && (
                        <div className="warning-text">
                          ⚠️ {t.chapterWarning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleStepChange(1)}
                >
                  {t.prevStep}
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleStepChange(3)}
                  disabled={state.chapters.length === 0}
                >
                  {t.nextStep}
                </button>
              </div>
            </>
          )}

          {state.currentStep === 3 && (
            <>
              <h3>{t.step3}</h3>
              
              <div className="book-meta">
                <div className="book-title">{state.title}</div>
                {state.subtitle && <div className="book-subtitle">{state.subtitle}</div>}
                <div className="book-type">{BOOK_TYPES[state.bookType]}</div>
                <div className="book-stats">
                  <span>{state.chapters.length} {state.lang === "ar" ? "فصل" : "chapters"}</span>
                  <span>•</span>
                  <span>{wordCount} {state.lang === "ar" ? "كلمة" : "words"}</span>
                </div>
              </div>

              <div className="actions">
                <button
                  className="btn-secondary"
                  onClick={handleGenerateCover}
                  disabled={state.generatingCover || !state.coverDescription.trim()}
                >
                  {state.generatingCover ? t.generatingCover : t.generateCoverBtn}
                </button>
              </div>

              {state.coverUrl && (
                <div className="cover-preview">
                  <h4>{t.coverPreview}</h4>
                  <Image 
                    src={state.coverUrl} 
                    alt={state.lang === "ar" ? "غلاف الكتاب" : "Book cover"} 
                    width={300}
                    height={400}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="actions">
                <button
                  className="btn-secondary"
                  onClick={handleGenerateChapterImages}
                  disabled={state.generatingChapterImages || state.chapters.length === 0}
                >
                  {state.generatingChapterImages ? t.generatingChapterImages : t.generateChapterImages}
                </button>
              </div>

              <div className="actions">
                <button
                  className="btn-primary"
                  onClick={handleGenerateBook}
                  disabled={state.generating}
                >
                  {state.generating ? t.generating : t.startGenerating}
                </button>
                {state.generating && (
                  <button
                    className="btn-secondary"
                    onClick={cancelGeneration}
                  >
                    {state.lang === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                )}
              </div>

              {state.generating && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${state.progressPercent}%` }}
                  ></div>
                </div>
              )}

              {!state.generating && state.chapters.some(ch => ch.content) && (
                <div className="actions">
                  <button
                    className="btn-secondary"
                    onClick={handleDownloadTXT}
                  >
                    {t.downloadBtn}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleSaveFinal}
                  >
                    {t.saveFinalBtn}
                  </button>
                </div>
              )}

              <div className="actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleStepChange(2)}
                >
                  {t.prevStep}
                </button>
              </div>
            </>
          )}
        </aside>

        {/* اللوحة اليمنى */}
        <section className="panel-right">
          {state.chapters.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>{t.emptyState}</h3>
              <p>{t.welcomeDesc}</p>
            </div>
          ) : (
            <div className="book-content">
              <header className="book-header">
                {state.coverUrl && (
                  <div className="book-cover">
                    <Image 
                      src={state.coverUrl} 
                      alt={state.lang === "ar" ? "غلاف الكتاب" : "Book cover"} 
                      width={200}
                      height={300}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <h1>{state.title}</h1>
                {state.subtitle && <h2>{state.subtitle}</h2>}
                <div className="book-meta">
                  <span>{BOOK_TYPES[state.bookType]}</span>
                  <span>•</span>
                  <span>{state.authorName}</span>
                </div>
                <div className="total-words">
                  {t.totalWords}: {wordCount} {t.words}
                </div>
              </header>

              {state.chapters.map((chapter, index) => (
                <article key={chapter.id} className="chapter">
                  <h3>
                    {state.lang === "ar" ? "الفصل" : "Chapter"} {index + 1}: {chapter.title}
                  </h3>
                  {chapter.imageUrl && (
                    <div className="chapter-image">
                      <Image 
                        src={chapter.imageUrl} 
                        alt={`${state.lang === "ar" ? "صورة الفصل" : "Chapter image"} ${index + 1}`}
                        width={400}
                        height={300}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  {chapter.description && (
                    <blockquote className="chapter-desc">
                      {chapter.description}
                    </blockquote>
                  )}
                  {chapter.content ? (
                    <div className="chapter-content">
                      {chapter.content.split("\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="placeholder-content">
                      {state.lang === "ar" 
                        ? "لم يتم إنشاء محتوى هذا الفصل بعد. انقر فوق توليد الكتاب لإنشاء المحتوى."
                        : "This chapter's content hasn't been generated yet. Click Generate Book to create content."}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* محرر الفصل */}
      {state.editingChapter && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{t.edit} {state.editingChapter.title}</h3>
              <button className="btn-icon" onClick={closeEditor}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>{t.chapterTitleLabel}</label>
                <input
                  value={state.editingChapter.title}
                  onChange={(e) => handleEditChapterChange('title', e.target.value)}
                />
              </div>
              <div className="field">
                <label>{t.chapterDescLabel}</label>
                <textarea
                  rows={3}
                  value={state.editingChapter.description}
                  onChange={(e) => handleEditChapterChange('description', e.target.value)}
                  placeholder={state.lang === "ar" 
                    ? "صف محتوى الفصل (20 كلمة على الأقل)" 
                    : "Describe chapter content (at least 20 words)"}
                />
                <div className="word-count-hint">
                  {countWords(state.editingChapter.description)} {state.lang === "ar" ? "كلمة" : "words"}
                  {countWords(state.editingChapter.description) < 20 && (
                    <span className="error-text"> - {t.minWords}</span>
                  )}
                </div>
              </div>
              <div className="field">
                <label>{t.chapterImageLabel}</label>
                <textarea
                  rows={2}
                  value={state.editingChapter.imageDescription || ""}
                  onChange={(e) => handleEditChapterChange('imageDescription', e.target.value)}
                  placeholder={t.chapterImagePlaceholder}
                  maxLength={100}
                />
                <div className="word-count-hint">
                  {countWords(state.editingChapter.imageDescription || "")} {state.lang === "ar" ? "كلمة" : "words"}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeEditor}>
                {t.close}
              </button>
              <button 
                className="btn-primary" 
                onClick={() => saveEditor({
                  title: state.editingChapter!.title,
                  description: state.editingChapter!.description,
                  imageDescription: state.editingChapter!.imageDescription
                })}
              >
                {t.saveChapter}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الإشعارات */}
      {state.notice && (
        <div className="toast notice">
          <span>{state.notice}</span>
          <button onClick={() => setState(prev => ({ ...prev, notice: null }))}>
            ✕
          </button>
        </div>
      )}

      {state.error && (
        <div className="toast error">
          <span>{state.error}</span>
          <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
            ✕
          </button>
        </div>
      )}

      {state.autoSaveStatus === "saving" && (
        <div className="toast autosave">
          <span>{state.lang === "ar" ? "جاري الحفظ..." : "Saving..."}</span>
        </div>
      )}

      {state.autoSaveStatus === "saved" && (
        <div className="toast autosave saved">
          <span>{state.lang === "ar" ? "تم الحفظ" : "Saved"}</span>
        </div>
      )}
    </div>
  );
}