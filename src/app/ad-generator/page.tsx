"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./ad-generator.css";

/* ---------------- Types ---------------- */
type AdType = "facebook" | "instagram" | "google" | "twitter" | "linkedin" | "tiktok" | "youtube";
type AdLanguage = "ar" | "en";
type AdTone = "formal" | "friendly" | "humorous" | "persuasive" | "urgent";
type AdLength = "short" | "medium" | "long";

interface AdInput {
  product: string;
  audience: string;
  type: AdType;
  language: AdLanguage;
  tone: AdTone;
  length: AdLength;
  keywords?: string;
  specialOffers?: string;
}

interface GeneratedAd {
  id: string;
  text: string;
  createdAt: Date;
  modifiedAt?: Date;
  rating?: number;
  input: AdInput;
  views: number;
  copies: number;
}

interface Analytics {
  totalGenerations: number;
  totalCopies: number;
  mostUsedPlatform: AdType;
  generationTime: number[];
  averageRating: number;
}

/* ---------------- Constants ---------------- */
const AD_TYPES: AdType[] = ["facebook", "instagram", "google", "twitter", "linkedin", "tiktok", "youtube"];
const LANGUAGES: AdLanguage[] = ["ar", "en"];
const TONES: AdTone[] = ["formal", "friendly", "humorous", "persuasive", "urgent"];

const MAX_HISTORY_ITEMS = 50;
const MAX_ANALYTICS_ITEMS = 100;

/* Color scheme with gradients */
const PRIMARY_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
const SECONDARY_GRADIENT = "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)";
const SUCCESS_GRADIENT = "linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)";
const DARK_GRADIENT = "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)";

/* Platform colors with gradients */
function platformGradient(type: AdType) {
  const map: Record<AdType, string> = {
    facebook: "linear-gradient(135deg, #1877f2 0%, #0e5a9d 100%)",
    instagram: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
    google: "linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 100%)",
    twitter: "linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)",
    linkedin: "linear-gradient(135deg, #0077b5 0%, #005582 100%)",
    tiktok: "linear-gradient(135deg, #000000 0%, #333333 50%, #69c9d0 100%)",
    youtube: "linear-gradient(135deg, #ff0000 0%, #cc0000 100%)"
  };
  return map[type] ?? "linear-gradient(135deg, #64748b 0%, #475569 100%)";
}

/* ---------------- Utility Functions ---------------- */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/* ---------------- Component ---------------- */
export default function AdvancedAdGenerator() {
  /* --- state (safe defaults to avoid hydration mismatch) --- */
  const [input, setInput] = useState<AdInput>({
    product: "",
    audience: "",
    type: "facebook",
    language: "ar",
    tone: "friendly",
    length: "medium",
    keywords: "",
    specialOffers: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [history, setHistory] = useState<GeneratedAd[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalGenerations: 0,
    totalCopies: 0,
    mostUsedPlatform: "facebook",
    generationTime: [],
    averageRating: 0
  });

  const [activeTab, setActiveTab] = useState<"generator" | "history" | "analytics">("generator");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<AdType | "all">("all");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  /* theme & lang: default fixed values, read persisted values in effect */
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<AdLanguage>("ar");

  // استخدام useRef لتخزين القيم بدون إعادة تصيير
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  /* ---------------- helpers ---------------- */
  const trackEvent = useCallback((_event: string, _data?: any) => {
    // placeholder — replace with analytics call
  }, []);

  /* load persisted (localStorage) on client only */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedHistory = localStorage.getItem("adGeneratorHistory");
      if (storedHistory) {
        const parsedRaw = JSON.parse(storedHistory) as any[];
        const parsed: GeneratedAd[] = parsedRaw.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
          input: {
            ...item.input,
            language: item.input?.language || "ar",
            tone: item.input?.tone || "friendly",
            length: item.input?.length || "medium",
            keywords: item.input?.keywords || "",
            specialOffers: item.input?.specialOffers || ""
          }
        }));
        setHistory(parsed);
      }
      const storedAnalytics = localStorage.getItem("adGeneratorAnalytics");
      if (storedAnalytics) {
        const parsedAnalytics = JSON.parse(storedAnalytics) as Analytics;
        setAnalytics(prev => ({
          ...prev,
          ...parsedAnalytics,
          generationTime: Array.isArray(parsedAnalytics.generationTime) ? parsedAnalytics.generationTime : []
        }));
      }

      const storedLang = localStorage.getItem("adGeneratorLang") as AdLanguage | null;
      if (storedLang && LANGUAGES.includes(storedLang)) setLang(storedLang);

      const storedTheme = localStorage.getItem("adGeneratorTheme") as "light" | "dark" | null;
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
    } catch (err) {
      console.error("loadPersistedData error:", err);
    }
    isInitialLoad.current = false;
  }, [trackEvent]);

  /* persist history & analytics when changed */
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    try {
      localStorage.setItem("adGeneratorHistory", JSON.stringify(history));
      localStorage.setItem("adGeneratorAnalytics", JSON.stringify(analytics));
    } catch (err) {
      console.error("persistData error:", err);
    }
  }, [history, analytics, trackEvent]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    
    try {
      localStorage.setItem("adGeneratorLang", lang);
    } catch {}
  }, [lang]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    
    try {
      localStorage.setItem("adGeneratorTheme", theme);
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = theme;
      }
    } catch {}
  }, [theme]);

  const validateInput = useCallback((): string | null => {
    if (!input.product.trim()) return lang === "ar" ? "❌ يرجى إدخال اسم المنتج" : "❌ Please enter product name";
    if (!input.audience.trim()) return lang === "ar" ? "❌ يرجى إدخال الجمهور المستهدف" : "❌ Please enter audience";
    return null;
  }, [input.product, input.audience, lang]);

  /* ---------------- history management ---------------- */
  const addToHistory = useCallback((adText: string) => {
    const newAd: GeneratedAd = {
      id: generateId(),
      text: adText,
      createdAt: new Date(),
      input: { ...input },
      views: 0,
      copies: 0
    };
    setHistory(prev => [newAd, ...prev].slice(0, MAX_HISTORY_ITEMS));
    trackEvent("ad_generated", { platform: input.type });
  }, [input, trackEvent]);

  const updateAdInHistory = useCallback((id: string, updates: Partial<GeneratedAd>) => {
    setHistory(prev =>
      prev.map(ad => ad.id === id ? { ...ad, ...updates, modifiedAt: updates.text ? new Date() : ad.modifiedAt } : ad)
    );
  }, []);

  const deleteAdFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(ad => ad.id !== id));
    trackEvent("ad_deleted", { id });
  }, [trackEvent]);

  const rateAd = useCallback((id: string, rating: number) => {
    updateAdInHistory(id, { rating });
    trackEvent("ad_rated", { id, rating });
  }, [updateAdInHistory, trackEvent]);

  const incrementAdViews = useCallback((id: string) => {
    updateAdInHistory(id, { views: (history.find(a => a.id === id)?.views || 0) + 1 });
  }, [history, updateAdInHistory]);

  /* ---------------- filters ---------------- */
  const filteredHistory = useMemo(() => {
    const st = searchTerm.trim().toLowerCase();
    return history.filter(ad => {
      const matchesSearch =
        st === "" ||
        ad.text.toLowerCase().includes(st) ||
        ad.input.product.toLowerCase().includes(st) ||
        ad.input.audience.toLowerCase().includes(st);

      const matchesPlatform = selectedPlatform === "all" || ad.input.type === selectedPlatform;
      const matchesRating =
        selectedRating === "all" ||
        (ad.rating !== undefined && typeof selectedRating === "number" && ad.rating >= selectedRating);

      return matchesSearch && matchesPlatform && matchesRating;
    });
  }, [history, searchTerm, selectedPlatform, selectedRating]);

  /* ---------------- ad generation ---------------- */
  const generateAd = useCallback(async () => {
    setError(null);
    setResult("");

    const v = validateInput();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      // محاكاة لتوليد الإعلان
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // توليد إعلان تجريبي
      const adTemplates = {
        ar: {
          facebook: `🔥 ${input.product} - الحل الأمثل لـ ${input.audience}!\n\n✨ ميزات رائعة:\n• جودة عالية\n• سعر مميز\n• ضمان شامل\n\n🚀 اطلبه الآن واستمتع بعروض خاصة!`,
          instagram: `🌟 ${input.product} يناسب ${input.audience} بشكل مذهل!\n\n💎 لماذا تختارنا؟\n• تصميم أنيق\n• أداء متميز\n• خدمة عملاء 24/7\n\n👉 اضغط على الرابط في البايو!`,
          google: `${input.product} | الخيار الأفضل لـ ${input.audience}\n\n✅ موثوق ومجرب\n✅ أسعار تنافسية\n✅ شحن سريع\n\n🛒 تسوق الآن بخصم خاص!`,
        },
        en: {
          facebook: `🔥 ${input.product} - The perfect solution for ${input.audience}!\n\n✨ Amazing features:\n• High quality\n• Competitive price\n• Full warranty\n\n🚀 Order now and enjoy special offers!`,
          instagram: `🌟 ${input.product} perfectly suits ${input.audience}!\n\n💎 Why choose us?\n• Elegant design\n• Outstanding performance\n• 24/7 customer service\n\n👉 Click the link in our bio!`,
          google: `${input.product} | The best choice for ${input.audience}\n\n✅ Trusted and tested\n✅ Competitive prices\n✅ Fast shipping\n\n🛒 Shop now with special discount!`,
        }
      };
      
      const text = adTemplates[input.language]?.[input.type] || 
                  (input.language === "ar" 
                    ? `إعلان عن ${input.product} للجمهور المستهدف ${input.audience} على منصة ${input.type}`
                    : `Ad for ${input.product} targeting ${input.audience} on ${input.type} platform`);
      
      setResult(text);
      addToHistory(text);

      // update analytics generation time
      const timeTaken = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - start) / 1000;
      setAnalytics(prev => ({
        ...prev,
        generationTime: [...(prev.generationTime || []), timeTaken].slice(-MAX_ANALYTICS_ITEMS),
        totalGenerations: (prev.totalGenerations || 0) + 1
      }));

      trackEvent("ad_generation_success", { timeTaken });
    } catch (err) {
      console.error(err);
      setError(lang === "ar" ? "فشل الاتصال بالخادم، حاول لاحقًا" : "Failed to connect to server, try later");
    } finally {
      setLoading(false);
    }
  }, [input, lang, validateInput, addToHistory, trackEvent]);

  /* ---------------- helpers: clipboard/export/edit ---------------- */
  const copyToClipboard = useCallback(async (text: string, adId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (adId) {
        const copies = (history.find(ad => ad.id === adId)?.copies || 0) + 1;
        updateAdInHistory(adId, { copies });
        setAnalytics(prev => ({ ...prev, totalCopies: (prev.totalCopies || 0) + 1 }));
      }
      alert(lang === "ar" ? "تم النسخ!" : "Copied!");
    } catch (err) {
      console.error(err);
      alert(lang === "ar" ? "فشل النسخ" : "Copy failed");
    }
  }, [history, lang, updateAdInHistory]);

  const exportAd = useCallback((ad: GeneratedAd) => {
    const blob = new Blob([ad.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lang === "ar" ? "إعلان" : "ad"}-${ad.input.product}-${ad.createdAt.toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    trackEvent("ad_exported");
  }, [lang, trackEvent]);

  const startEditing = useCallback((ad: GeneratedAd) => {
    setEditingAdId(ad.id);
    setEditText(ad.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingAdId) {
      updateAdInHistory(editingAdId, { text: editText });
      setEditingAdId(null);
    }
  }, [editingAdId, editText, updateAdInHistory]);

  const cancelEdit = useCallback(() => setEditingAdId(null), []);

  /* ---------------- UI helpers ---------------- */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => {
      // تجنب إعادة التصيير إذا كانت القيمة لم تتغير
      if (prev[name as keyof AdInput] === value) return prev;
      return { ...prev, [name]: value };
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handlePlatformFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlatform(e.target.value as AdType | "all");
  }, []);

  const handleRatingFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRating(e.target.value === "all" ? "all" : Number(e.target.value));
  }, []);

  const platformName = useCallback((type: AdType) => {
    const en: Record<AdType,string> = {
      facebook: "Facebook",
      instagram: "Instagram",
      google: "Google",
      twitter: "Twitter",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      youtube: "YouTube"
    };
    const ar: Record<AdType,string> = {
      facebook: "فيسبوك",
      instagram: "إنستجرام",
      google: "جوجل",
      twitter: "تويتر",
      linkedin: "لينكدإن",
      tiktok: "تيك توك",
      youtube: "يوتيوب"
    };
    return lang === "ar" ? ar[type] : en[type];
  }, [lang]);

  const formatDate = useCallback((date: Date) => {
    try {
      return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return date.toISOString();
    }
  }, [lang]);

  /* ---------------- Theme & Lang toggles ---------------- */
  const toggleTheme = useCallback(() => setTheme(prev => prev === "light" ? "dark" : "light"), []);
  const switchLang = useCallback((l: AdLanguage) => setLang(l), []);

  /* ---------------- Render subcomponents ---------------- */
  const InputForm = useCallback(() => (
    <div style={{...styles.formContainer, ...(theme === "dark" ? styles.formContainerDark : {})}}>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "اسم المنتج/الخدمة" : "Product / Service"}</label>
          <input 
            name="product" 
            value={input.product} 
            onChange={handleInputChange} 
            placeholder={lang === "ar" ? "مثال: هاتف ذكي" : "e.g. High-end smartphone"} 
            style={styles.input} 
            disabled={loading} 
            ref={inputRef}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "الجمهور المستهدف" : "Target audience"}</label>
          <input 
            name="audience" 
            value={input.audience} 
            onChange={handleInputChange} 
            placeholder={lang === "ar" ? "مثال: رجال أعمال 25-40" : "e.g. 25-40 business professionals"} 
            style={styles.input} 
            disabled={loading} 
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "منصة" : "Platform"}</label>
          <select name="type" value={input.type} onChange={handleInputChange} style={styles.select} disabled={loading}>
            {AD_TYPES.map(t => <option key={t} value={t}>{platformName(t)}</option>)}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "اللغة" : "Language"}</label>
          <select name="language" value={input.language} onChange={handleInputChange} style={styles.select} disabled={loading}>
            <option value="ar">{lang === "ar" ? "العربية" : "Arabic"}</option>
            <option value="en">{lang === "ar" ? "الإنجليزية" : "English"}</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "نغمة" : "Tone"}</label>
          <select name="tone" value={input.tone} onChange={handleInputChange} style={styles.select} disabled={loading}>
            {TONES.map(t => <option key={t} value={t}>{lang === "ar" ? t : t}</option>)}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "الطول" : "Length"}</label>
          <select name="length" value={input.length} onChange={handleInputChange} style={styles.select} disabled={loading}>
            <option value="short">{lang === "ar" ? "قصير" : "Short"}</option>
            <option value="medium">{lang === "ar" ? "متوسط" : "Medium"}</option>
            <option value="long">{lang === "ar" ? "طويل" : "Long"}</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "كلمات مفتاحية (اختياري)" : "Keywords (optional)"}</label>
          <input name="keywords" value={input.keywords} onChange={handleInputChange} style={styles.input} disabled={loading} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "عروض خاصة (اختياري)" : "Special offers (optional)"}</label>
          <input name="specialOffers" value={input.specialOffers} onChange={handleInputChange} style={styles.input} disabled={loading} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={generateAd} disabled={loading} style={loading ? styles.buttonDisabled : {
          ...styles.generateButton,
          background: PRIMARY_GRADIENT
        }}>
          {loading ? (lang === "ar" ? "جاري التوليد..." : "Generating...") : (lang === "ar" ? "توليد إعلان احترافي" : "Generate professional ad")}
        </button>
      </div>
    </div>
  ), [input, loading, lang, theme, handleInputChange, platformName, generateAd]);

  const ResultDisplay = useCallback(() => (
    <div style={{...styles.resultContainer, ...(theme === "dark" ? styles.resultContainerDark : {})}}>
      {error && <div style={styles.errorAlert}><strong>!</strong>&nbsp;{error}</div>}

      {result ? (
        <>
          <div style={styles.resultHeader}>
            <h3 style={{...styles.resultTitle, background: PRIMARY_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
              {lang === "ar" ? "الإعلان المولد" : "Generated Ad"}
            </h3>
            <div style={styles.resultActions}>
              <button onClick={() => copyToClipboard(result)} style={{
                ...styles.actionButton,
                background: SECONDARY_GRADIENT
              }}>
                {lang === "ar" ? "نسخ" : "Copy"} 📋
              </button>
              <button onClick={() => {
               exportAd({
                  id: generateId(),
                  text: result,
                  createdAt: new Date(),
                  input,
                  views: 0,
                  copies: 0
                });
              }} style={{
                ...styles.actionButton,
                background: SUCCESS_GRADIENT
              }}>
                {lang === "ar" ? "حفظ" : "Save"} 💾
              </button>
            </div>
          </div>

          <div style={styles.resultContent}><pre style={styles.resultText}>{result}</pre></div>

          <div style={styles.ratingContainer}>
            <p style={styles.ratingPrompt}>{lang === "ar" ? "كيف تقيم هذا الإعلان؟" : "Rate this ad"}</p>
            <div style={styles.ratingStars}>
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => {
                  const latest = history[0];
                  if (latest) rateAd(latest.id, star);
                  alert(lang === "ar" ? `شكراً (${star} نجوم)` : `Thanks! (${star} stars)`);
                }} style={styles.starButton}>{star <= (history[0]?.rating || 0) ? "★" : "☆"}</button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: "#777", textAlign: "center", padding: "2rem" }}>
          {lang === "ar" ? "لا يوجد إعلان بعد — جرّب التوليد الآن" : "No ad yet — try generating one"}
        </div>
      )}
    </div>
  ), [result, error, theme, lang, history, input, copyToClipboard, exportAd, rateAd]);

  const HistoryList = useCallback(() => (
    <div style={{...styles.historyContainer, ...(theme === "dark" ? styles.historyContainerDark : {})}}>
      <div style={styles.historyFilters}>
        <input 
          placeholder={lang === "ar" ? "ابحث..." : "Search..."} 
          value={searchTerm} 
          onChange={handleSearchChange} 
          style={styles.searchInput} 
        />
        <select 
          value={selectedPlatform} 
          onChange={handlePlatformFilterChange} 
          style={styles.filterSelect}
        >
          <option value="all">{lang === "ar" ? "كل المنصات" : "All platforms"}</option>
          {AD_TYPES.map(t => <option key={t} value={t}>{platformName(t)}</option>)}
        </select>
        <select 
          value={selectedRating} 
          onChange={handleRatingFilterChange} 
          style={styles.filterSelect}
        >
          <option value="all">{lang === "ar" ? "كل التقييمات" : "All ratings"}</option>
          <option value="4">{lang === "ar" ? "4 نجوم فأكثر" : "4+ stars"}</option>
          <option value="3">{lang === "ar" ? "3 نجوم فأكثر" : "3+ stars"}</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? <div style={styles.emptyState}>{lang === "ar" ? "لا توجد إعلانات" : "No ads found"}</div> : (
        <div style={styles.historyList}>
          {filteredHistory.map(ad => (
            <article key={ad.id} style={{
              ...styles.historyItem,
              ...(theme === "dark" ? {borderColor: "#334155", background: "#1e293b"} : {})
            }} onClick={() => incrementAdViews(ad.id)}>
              <div style={styles.historyItemHeader}>
                <span style={{...styles.historyPlatformTag, background: platformGradient(ad.input.type)}}>
                  {platformName(ad.input.type)}
                </span>
                <span style={styles.historyDate}>{formatDate(ad.createdAt)}{ad.modifiedAt ? ` • ${lang === "ar" ? "تم التعديل" : "edited"} ${formatDate(ad.modifiedAt)}` : ""}</span>
              </div>

              <div style={styles.historyItemContent}>
                {editingAdId === ad.id ? (
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editTextarea} rows={6} />
                ) : (
                  <pre style={styles.historyText}>{ad.text}</pre>
                )}
              </div>

              <div style={styles.historyItemFooter}>
                <div style={styles.historyStats}>
                  <span title={lang === "ar" ? "المشاهدات" : "views"}>👁 {ad.views || 0}</span>
                  <span title={lang === "ar" ? "النسخ" : "copies"}>📋 {ad.copies || 0}</span>
                  {ad.rating !== undefined && <span>{Array.from({length:5}).map((_,i)=> <span key={i}>{i < ad.rating! ? "★" : "☆"}</span>)}</span>}
                </div>

                <div style={styles.historyActions}>
                  {editingAdId === ad.id ? (
                    <>
                      <button onClick={saveEdit} style={{
                        ...styles.smallButton,
                        background: SUCCESS_GRADIENT
                      }}>{lang === "ar" ? "حفظ" : "Save"}</button>
                      <button onClick={cancelEdit} style={{
                        ...styles.smallButton,
                        background: "#f0f0f0"
                      }}>{lang === "ar" ? "إلغاء" : "Cancel"}</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyToClipboard(ad.text, ad.id)} style={{
                        ...styles.smallButton,
                        background: SECONDARY_GRADIENT
                      }}>📋</button>
                      <button onClick={() => exportAd(ad)} style={{
                        ...styles.smallButton,
                        background: SUCCESS_GRADIENT
                      }}>💾</button>
                      <button onClick={() => startEditing(ad)} style={{
                        ...styles.smallButton,
                        background: "#f0f0f0"
                      }}>✏</button>
                      <button onClick={() => deleteAdFromHistory(ad.id)} style={{
                        ...styles.smallButtonDanger,
                        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)"
                      }}>🗑</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  ), [filteredHistory, searchTerm, selectedPlatform, selectedRating, theme, lang, editingAdId, editText, platformName, formatDate, incrementAdViews, copyToClipboard, exportAd, startEditing, deleteAdFromHistory, saveEdit, cancelEdit, handleSearchChange, handlePlatformFilterChange, handleRatingFilterChange]);

  const AnalyticsDashboard = useCallback(() => {
    // compute distribution
    const distribution = AD_TYPES.map(type => {
      const count = history.filter(h => h.input.type === type).length;
      const pct = history.length > 0 ? Math.round((count / history.length) * 100) : 0;
      return { type, count, pct };
    });

    return (
      <div style={{...styles.analyticsContainer, ...(theme === "dark" ? styles.analyticsContainerDark : {})}}>
        <h3 style={{...styles.analyticsTitle, background: PRIMARY_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
          {lang === "ar" ? "إحصائيات" : "Analytics"}
        </h3>

        <div style={styles.analyticsGrid}>
          <div style={{...styles.analyticsCard, background: SECONDARY_GRADIENT}}>
            <h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "إجمالي الإعلانات" : "Total generated"}</h4>
            <p style={styles.analyticsCardValue}>{analytics.totalGenerations}</p>
          </div>
          <div style={{...styles.analyticsCard, background: SUCCESS_GRADIENT}}>
            <h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "إجمالي النسخ" : "Total copies"}</h4>
            <p style={styles.analyticsCardValue}>{analytics.totalCopies}</p>
          </div>
          <div style={{...styles.analyticsCard, background: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)"}}>
            <h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "متوسط التقييم" : "Average rating"}</h4>
            <p style={styles.analyticsCardValue}>{analytics.averageRating.toFixed(1)}/5</p>
          </div>
          <div style={{...styles.analyticsCard, background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"}}>
            <h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "الأكثر استخداماً" : "Most used"}</h4>
            <p style={styles.analyticsCardValue}>{platformName(analytics.mostUsedPlatform)}</p>
          </div>
        </div>

        <div>
          <h4 style={styles.analyticsSectionTitle}>{lang === "ar" ? "توزيع المنصات" : "Platform distribution"}</h4>
          <div style={styles.platformDistribution}>
            {distribution.map(d => (
              <div key={d.type} style={styles.distributionItem}>
                <div style={styles.distributionLabel}>
                  <span>{platformName(d.type)}</span>
                  <span>{d.count} • {d.pct}%</span>
                </div>
                <div style={styles.distributionBarContainer}>
                  <div style={{ ...styles.distributionBar, width: `${d.pct}%`, background: platformGradient(d.type) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [analytics, history, theme, lang, platformName]);

  /* ---------------- main render ---------------- */
  return (
    <div style={{...styles.appContainer, ...(theme === "dark" ? styles.appContainerDark : {})}}>
      <header style={{...styles.header, background: theme === "dark" ? DARK_GRADIENT : PRIMARY_GRADIENT, color: "#fff"}}>
        <div>
          <h1 style={styles.headerTitle}>{lang === "ar" ? "مولد الإعلانات الذكي" : "Smart Ad Generator"}</h1>
          <p style={styles.headerSubtitle}>{lang === "ar" ? "أداة متقدمة لتوليد إعلانات فعالة" : "Advanced tool to generate effective ads"}</p>
        </div>

        <div style={styles.headerControls}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => switchLang("ar")} style={{
              ...styles.langButton,
              ...(lang === "ar" ? { background: "rgba(255,255,255,0.2)" } : {})
            }}>العربية</button>
            <button onClick={() => switchLang("en")} style={{
              ...styles.langButton,
              ...(lang === "en" ? { background: "rgba(255,255,255,0.2)" } : {})
            }}>English</button>
          </div>
          <button onClick={toggleTheme} style={styles.themeToggle}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button onClick={() => setActiveTab("generator")} style={{
          ...styles.navButton,
          ...(activeTab === "generator" ? { background: PRIMARY_GRADIENT, color: "#fff" } : {})
        }}>{lang === "ar" ? "المولد" : "Generator"}</button>
        <button onClick={() => setActiveTab("history")} style={{
          ...styles.navButton,
          ...(activeTab === "history" ? { background: PRIMARY_GRADIENT, color: "#fff" } : {})
        }}>{lang === "ar" ? "السجل" : "History"}</button>
        <button onClick={() => setActiveTab("analytics")} style={{
          ...styles.navButton,
          ...(activeTab === "analytics" ? { background: PRIMARY_GRADIENT, color: "#fff" } : {})
        }}>{lang === "ar" ? "الإحصائيات" : "Analytics"}</button>
      </nav>

      <main style={styles.main}>
        {activeTab === "generator" && (
          <div style={styles.generatorLayout}>
            <InputForm />
            <ResultDisplay />
          </div>
        )}

        {activeTab === "history" && <HistoryList />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
      </main>

      <footer style={{...styles.footer, ...(theme === "dark" ? styles.footerDark : {})}}>
        <p>{lang === "ar" ? "أداة متقدمة لتوليد إعلانات فعالة" : "Advanced tool to generate effective ads"}</p>
      </footer>
    </div>
  );
}

/* ---------------- Styles ---------------- */
const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#1e293b"
  },
  appContainerDark: {
    background: "#0f172a",
    color: "#e2e8f0"
  },
  header: {
    padding: "1.5rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem"
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: 700
  },
  headerSubtitle: {
    margin: "0.5rem 0 0",
    opacity: 0.9,
    fontSize: "1rem"
  },
  headerControls: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  langButton: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.5rem",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  themeToggle: {
    padding: "0.5rem",
    border: "none",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1.2rem",
    width: "2.5rem",
    height: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  nav: {
    display: "flex",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0"
  },
  navDark: {
    background: "#1e293b",
    borderColor: "#334155"
  },
  navButton: {
    padding: "1rem 1.5rem",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s"
  },
  main: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box"
  },
  generatorLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "start"
  },
  formContainer: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
  },
  formContainerDark: {
    background: "#1e293b",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  label: {
    fontWeight: 500,
    fontSize: "0.875rem"
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    transition: "border-color 0.2s"
  },
  inputDark: {
    background: "#334155",
    borderColor: "#475569",
    color: "#e2e8f0"
  },
  select: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    background: "#fff"
  },
  selectDark: {
    background: "#334155",
    borderColor: "#475569",
    color: "#e2e8f0"
  },
  generateButton: {
    padding: "1rem 1.5rem",
    border: "none",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.2s"
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed"
  },
  resultContainer: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
  },
  resultContainerDark: {
    background: "#1e293b",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)"
  },
  errorAlert: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "1rem",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  },
  resultTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700
  },
  resultActions: {
    display: "flex",
    gap: "0.5rem"
  },
  actionButton: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.5rem",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500
  },
  resultContent: {
    background: "#f1f5f9",
    padding: "1rem",
    borderRadius: "0.5rem",
    marginBottom: "1rem"
  },
  resultContentDark: {
    background: "#334155"
  },
  resultText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    lineHeight: 1.5
  },
  ratingContainer: {
    textAlign: "center"
  },
  ratingPrompt: {
    margin: "0 0 0.5rem",
    fontWeight: 500
  },
  ratingStars: {
    display: "flex",
    justifyContent: "center",
    gap: "0.25rem"
  },
  starButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: 0,
    color: "#fbbf24"
  },
  historyContainer: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
  },
  historyContainerDark: {
    background: "#1e293b",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)"
  },
  historyFilters: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap"
  },
  searchInput: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    flex: "1",
    minWidth: "200px"
  },
  searchInputDark: {
    background: "#334155",
    borderColor: "#475569",
    color: "#e2e8f0"
  },
  filterSelect: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    minWidth: "150px"
  },
  filterSelectDark: {
    background: "#334155",
    borderColor: "#475569",
    color: "#e2e8f0"
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  historyItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    padding: "1rem",
    transition: "box-shadow 0.2s",
    cursor: "pointer"
  },
  historyItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem"
  },
  historyPlatformTag: {
    padding: "0.25rem 0.75rem",
    borderRadius: "1rem",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 600
  },
  historyDate: {
    fontSize: "0.875rem",
    color: "#64748b"
  },
  historyItemContent: {
    marginBottom: "0.75rem"
  },
  editTextarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    resize: "vertical",
    minHeight: "120px"
  },
  editTextareaDark: {
    background: "#334155",
    borderColor: "#475569",
    color: "#e2e8f0"
  },
  historyText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    lineHeight: 1.5
  },
  historyItemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  historyStats: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.875rem",
    color: "#64748b"
  },
  historyActions: {
    display: "flex",
    gap: "0.5rem"
  },
  smallButton: {
    padding: "0.25rem 0.5rem",
    border: "none",
    borderRadius: "0.375rem",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.875rem"
  },
  smallButtonDanger: {
    padding: "0.25rem 0.5rem",
    border: "none",
    borderRadius: "0.375rem",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.875rem"
  },
  analyticsContainer: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
  },
  analyticsContainerDark: {
    background: "#1e293b",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)"
  },
  analyticsTitle: {
    margin: "0 0 1.5rem",
    fontSize: "1.5rem",
    fontWeight: 700
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem"
  },
  analyticsCard: {
    padding: "1.5rem",
    borderRadius: "1rem",
    color: "#fff",
    textAlign: "center"
  },
  analyticsCardTitle: {
    margin: "0 0 0.5rem",
    fontSize: "0.875rem",
    opacity: 0.9
  },
  analyticsCardValue: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700
  },
  analyticsSectionTitle: {
    margin: "0 0 1rem",
    fontSize: "1.25rem",
    fontWeight: 600
  },
  platformDistribution: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  distributionItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  distributionLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.875rem"
  },
  distributionBarContainer: {
    height: "0.5rem",
    background: "#e2e8f0",
    borderRadius: "1rem",
    overflow: "hidden"
  },
  distributionBarContainerDark: {
    background: "#334155"
  },
  distributionBar: {
    height: "100%",
    borderRadius: "1rem",
    transition: "width 0.5s ease"
  },
  footer: {
    padding: "1.5rem 2rem",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b"
  },
  footerDark: {
    borderColor: "#334155",
    color: "#94a3b8"
  }
};