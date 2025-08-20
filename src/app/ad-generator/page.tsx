"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

/* ---------------- Types ---------------- */
type AdType = "facebook" | "instagram" | "google" | "twitter" | "linkedin" | "tiktok";
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
const AD_TYPES: AdType[] = ["facebook", "instagram", "google", "twitter", "linkedin", "tiktok"];
const LANGUAGES: AdLanguage[] = ["ar", "en"];
const TONES: AdTone[] = ["formal", "friendly", "humorous", "persuasive", "urgent"];
const LENGTHS: AdLength[] = ["short", "medium", "long"];

const MAX_HISTORY_ITEMS = 50;
const MAX_ANALYTICS_ITEMS = 100;

/* Primary color */
const PRIMARY_COLOR = "#2563eb";
const SECONDARY_COLOR = "#64748b";
const SUCCESS_COLOR = "#10b981";

/* Platform colors */
function platformColor(type: AdType) {
  const map: Record<AdType, string> = {
    facebook: "#1877f2",
    instagram: "#e1306c",
    google: "#4285f4",
    twitter: "#1da1f2",
    linkedin: "#0077b5",
    tiktok: "#000000"
  };
  return map[type] ?? SECONDARY_COLOR;
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

  /* load persisted (localStorage) on client only */
  useEffect(() => {
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
    // track page visit after load
    trackEvent("page_visit");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* persist history & analytics when changed */
  useEffect(() => {
    try {
      localStorage.setItem("adGeneratorHistory", JSON.stringify(history));
      localStorage.setItem("adGeneratorAnalytics", JSON.stringify(analytics));
    } catch (err) {
      console.error("persistData error:", err);
    }
  }, [history, analytics]);

  useEffect(() => {
    try {
      localStorage.setItem("adGeneratorLang", lang);
    } catch {}
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem("adGeneratorTheme", theme);
      // apply theme to document root for global CSS if desired
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = theme;
      }
    } catch {}
  }, [theme]);

  /* ---------------- helpers ---------------- */
  const trackEvent = (_event: string, _data?: any) => {
    // placeholder — replace with analytics call
    // console.log("track:", event, data);
  };

  const validateInput = (): string | null => {
    if (!input.product.trim()) return lang === "ar" ? "❌ يرجى إدخال اسم المنتج" : "❌ Please enter product name";
    if (!input.audience.trim()) return lang === "ar" ? "❌ يرجى إدخال الجمهور المستهدف" : "❌ Please enter audience";
    return null;
  };

  /* ---------------- history management ---------------- */
  const addToHistory = useCallback((adText: string) => {
    const newAd: GeneratedAd = {
      id: typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
      text: adText,
      createdAt: new Date(),
      input: { ...input },
      views: 0,
      copies: 0
    };
    setHistory(prev => [newAd, ...prev].slice(0, MAX_HISTORY_ITEMS));
    trackEvent("ad_generated", { platform: input.type });
  }, [input]);

  const updateAdInHistory = (id: string, updates: Partial<GeneratedAd>) => {
    setHistory(prev =>
      prev.map(ad => ad.id === id ? { ...ad, ...updates, modifiedAt: updates.text ? new Date() : ad.modifiedAt } : ad)
    );
  };

  const deleteAdFromHistory = (id: string) => {
    setHistory(prev => prev.filter(ad => ad.id !== id));
    trackEvent("ad_deleted", { id });
  };

  const rateAd = (id: string, rating: number) => {
    updateAdInHistory(id, { rating });
    trackEvent("ad_rated", { id, rating });
  };

  const incrementAdViews = (id: string) => {
    updateAdInHistory(id, { views: (history.find(a => a.id === id)?.views || 0) + 1 });
  };

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

  /* ---------------- ad generation (using DeepSeek API) ---------------- */
  const generateAd = async () => {
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
      // استدعاء DeepSeek API بدلاً من المحاكاة
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: input.product,
          audience: input.audience,
          type: input.type,
          maxTokens: input.length === 'short' ? 100 : input.length === 'medium' ? 200 : 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(lang === "ar" ? "فشل في توليد الإعلان" : "Failed to generate ad");
      }

      const data = await response.json();
      const text = data.adText;
      
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
  };

  /* ---------------- helpers: clipboard/export/edit ---------------- */
  const copyToClipboard = async (text: string, adId?: string) => {
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
  };

  const exportAd = (ad: GeneratedAd) => {
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
  };

  const startEditing = (ad: GeneratedAd) => {
    setEditingAdId(ad.id);
    setEditText(ad.text);
  };
  const saveEdit = () => {
    if (editingAdId) {
      updateAdInHistory(editingAdId, { text: editText });
      setEditingAdId(null);
    }
  };
  const cancelEdit = () => setEditingAdId(null);

  /* ---------------- UI helpers ---------------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as any;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const platformName = (type: AdType) => {
    const en: Record<AdType,string> = {
      facebook: "Facebook",
      instagram: "Instagram",
      google: "Google",
      twitter: "Twitter",
      linkedin: "LinkedIn",
      tiktok: "TikTok"
    };
    const ar: Record<AdType,string> = {
      facebook: "فيسبوك",
      instagram: "إنستجرام",
      google: "جوجل",
      twitter: "تويتر",
      linkedin: "لينكدإن",
      tiktok: "تيك توك"
    };
    return lang === "ar" ? ar[type] : en[type];
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return date.toISOString();
    }
  };

  /* ---------------- Theme & Lang toggles ---------------- */
  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");
  const switchLang = (l: AdLanguage) => setLang(l);

  /* ---------------- Render subcomponents ---------------- */
  const InputForm = () => (
    <div style={merge(styles.formContainer, theme === "dark" ? styles.formContainerDark : {})}>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "اسم المنتج/الخدمة" : "Product / Service"}</label>
          <input name="product" value={input.product} onChange={handleInputChange} placeholder={lang === "ar" ? "مثال: هاتف ذكي" : "e.g. High-end smartphone"} style={styles.input} disabled={loading} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{lang === "ar" ? "الجمهور المستهدف" : "Target audience"}</label>
          <input name="audience" value={input.audience} onChange={handleInputChange} placeholder={lang === "ar" ? "مثال: رجال أعمال 25-40" : "e.g. 25-40 business professionals"} style={styles.input} disabled={loading} />
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
        <button onClick={generateAd} disabled={loading} style={loading ? styles.buttonDisabled : merge(styles.generateButton, { backgroundColor: PRIMARY_COLOR })}>
          {loading ? (lang === "ar" ? "جاري التوليد..." : "Generating...") : (lang === "ar" ? "توليد إعلان احترافي" : "Generate professional ad")}
        </button>
      </div>
    </div>
  );

  const ResultDisplay = () => (
    <div style={merge(styles.resultContainer, theme === "dark" ? styles.resultContainerDark : {})}>
      {error && <div style={styles.errorAlert}><strong>!</strong>&nbsp;{error}</div>}

      {result ? (
        <>
          <div style={styles.resultHeader}>
            <h3 style={merge(styles.resultTitle, { color: PRIMARY_COLOR })}>{lang === "ar" ? "الإعلان المولد" : "Generated Ad"}</h3>
            <div style={styles.resultActions}>
              <button onClick={() => copyToClipboard(result)} style={styles.actionButton}>{lang === "ar" ? "نسخ" : "Copy"} 📋</button>
              <button onClick={() => {
                exportAd({
                  id: typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
                  text: result,
                  createdAt: new Date(),
                  input,
                  views: 0,
                  copies: 0
                });
              }} style={styles.actionButton}>{lang === "ar" ? "حفظ" : "Save"} 💾</button>
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
        <div style={{ color: "#777" }}>{lang === "ar" ? "لا يوجد إعلان بعد — جرّب التوليد الآن" : "No ad yet — try generating one"}</div>
      )}
    </div>
  );

  const HistoryList = () => (
    <div style={merge(styles.historyContainer, theme === "dark" ? styles.historyContainerDark : {})}>
      <div style={styles.historyFilters}>
        <input placeholder={lang === "ar" ? "ابحث..." : "Search..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as AdType | "all")} style={styles.filterSelect}>
          <option value="all">{lang === "ar" ? "كل المنصات" : "All platforms"}</option>
          {AD_TYPES.map(t => <option key={t} value={t}>{platformName(t)}</option>)}
        </select>
        <select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value === "all" ? "all" : Number(e.target.value))} style={styles.filterSelect}>
          <option value="all">{lang === "ar" ? "كل التقييمات" : "All ratings"}</option>
          <option value="4">{lang === "ar" ? "4 نجوم فأكثر" : "4+ stars"}</option>
          <option value="3">{lang === "ar" ? "3 نجوم فأكثر" : "3+ stars"}</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? <div style={styles.emptyState}>{lang === "ar" ? "لا توجد إعلانات" : "No ads found"}</div> : (
        <div style={styles.historyList}>
          {filteredHistory.map(ad => (
            <article key={ad.id} style={merge(styles.historyItem, theme === "dark" ? styles.historyItemDark : {})} onClick={() => incrementAdViews(ad.id)}>
              <div style={styles.historyItemHeader}>
                <span style={merge(styles.historyPlatformTag(ad.input.type), { backgroundColor: platformColor(ad.input.type) })}>{platformName(ad.input.type)}</span>
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
                      <button onClick={saveEdit} style={styles.smallButton}>{lang === "ar" ? "حفظ" : "Save"}</button>
                      <button onClick={cancelEdit} style={styles.smallButton}>{lang === "ar" ? "إلغاء" : "Cancel"}</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyToClipboard(ad.text, ad.id)} style={styles.smallButton}>📋</button>
                      <button onClick={() => exportAd(ad)} style={styles.smallButton}>💾</button>
                      <button onClick={() => startEditing(ad)} style={styles.smallButton}>✏</button>
                      <button onClick={() => deleteAdFromHistory(ad.id)} style={styles.smallButtonDanger}>🗑</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const AnalyticsDashboard = () => {
    // compute distribution
    const distribution = AD_TYPES.map(type => {
      const count = history.filter(h => h.input.type === type).length;
      const pct = history.length > 0 ? Math.round((count / history.length) * 100) : 0;
      return { type, count, pct };
    });

    return (
      <div style={merge(styles.analyticsContainer, theme === "dark" ? styles.analyticsContainerDark : {})}>
        <h3 style={merge(styles.analyticsTitle, { color: PRIMARY_COLOR })}>{lang === "ar" ? "إحصائيات" : "Analytics"}</h3>

        <div style={styles.analyticsGrid}>
          <div style={styles.analyticsCard}><h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "إجمالي الإعلانات" : "Total generated"}</h4><p style={styles.analyticsCardValue}>{analytics.totalGenerations}</p></div>
          <div style={styles.analyticsCard}><h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "إجمالي النسخ" : "Total copies"}</h4><p style={styles.analyticsCardValue}>{analytics.totalCopies}</p></div>
          <div style={styles.analyticsCard}><h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "متوسط التقييم" : "Average rating"}</h4><p style={styles.analyticsCardValue}>{analytics.averageRating.toFixed(1)}/5</p></div>
          <div style={styles.analyticsCard}><h4 style={styles.analyticsCardTitle}>{lang === "ar" ? "الأكثر استخداماً" : "Most used"}</h4><p style={styles.analyticsCardValue}>{platformName(analytics.mostUsedPlatform)}</p></div>
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
                  <div style={{ ...styles.distributionBar, width: `${d.pct}%`, backgroundColor: platformColor(d.type) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- main render ---------------- */
  return (
    <div style={merge(styles.appContainer, theme === "dark" ? styles.appContainerDark : {})}>
      <header style={merge(styles.header, { background: theme === "dark" ? "#0b0710" : PRIMARY_COLOR, color: theme === "dark" ? "#e6e6f6" : "#fff" })}>
        <div>
          <h1 style={styles.headerTitle}>{lang === "ar" ? "مولد الإعلانات الذكي" : "Smart Ad Generator"}</h1>
          <p style={styles.headerSubtitle}>{lang === "ar" ? "أداة متقدمة لتوليد إعلانات فعالة" : "Advanced tool to generate effective ads"}</p>
        </div>

        <div style={styles.headerControls}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={lang} onChange={(e)=> switchLang(e.target.value as AdLanguage)} style={styles.langSelect}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>

            <button onClick={toggleTheme} title={lang === "ar" ? "تبديل المظهر" : "Toggle theme"} style={styles.themeToggle}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </header>

      <nav style={merge(styles.navTabs, theme === "dark" ? styles.navTabsDark : {})}>
        <button onClick={()=>setActiveTab("generator")} style={activeTab==="generator" ? merge(styles.activeTab, { borderBottomColor: PRIMARY_COLOR, color: PRIMARY_COLOR }) : styles.tab}>
          {lang === "ar" ? "المولد" : "Generator"}
        </button>
        <button onClick={()=>setActiveTab("history")} style={activeTab==="history" ? merge(styles.activeTab, { borderBottomColor: PRIMARY_COLOR, color: PRIMARY_COLOR }) : styles.tab}>
          {lang === "ar" ? "السجل" : "History"}
        </button>
        <button onClick={()=>setActiveTab("analytics")} style={activeTab==="analytics" ? merge(styles.activeTab, { borderBottomColor: PRIMARY_COLOR, color: PRIMARY_COLOR }) : styles.tab}>
          {lang === "ar" ? "التحليلات" : "Analytics"}
        </button>
      </nav>

      <main style={styles.mainContent}>
        {activeTab === "generator" && <>
          <InputForm />
          <div style={{ height: 16 }} />
          <ResultDisplay />
        </>}

        {activeTab === "history" && <HistoryList />}

        {activeTab === "analytics" && <AnalyticsDashboard />}
      </main>

      <footer style={merge(styles.footer, theme === "dark" ? styles.footerDark : {})}>
        <p>© {new Date().getFullYear()} • {lang === "ar" ? "مولد الإعلانات" : "Ad Generator"}</p>
      </footer>
    </div>
  );
}

/* ---------------- styles (JS object) ---------------- */
const styles: Record<string, any> = {
  appContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    lineHeight: 1.6,
    color: "#111"
  },
  appContainerDark: {
    backgroundColor: "#071023",
    color: "#dbeafe"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "1.5rem 1rem",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)"
  },
  headerTitle: { margin: 0, fontSize: "1.6rem", fontWeight: 700 },
  headerSubtitle: { margin: 0, opacity: 0.95, fontSize: "0.95rem" },
  headerControls: { display: "flex", alignItems: "center", gap: 12 },

  langSelect: { padding: "6px 8px", borderRadius: 8, border: "1px solid #e6e9ee", background: "white", cursor: "pointer" },
  themeToggle: { padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", fontSize: 18 },

  navTabs: { display: "flex", borderBottom: "1px solid #e6e6e6", backgroundColor: "white" },
  navTabsDark: { backgroundColor: "#071023", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  tab: { flex: 1, padding: "0.85rem 1rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "1rem", fontWeight: 600, color: "#555", transition: "all .15s" },
  activeTab: { flex: 1, padding: "0.85rem 1rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "1rem", fontWeight: 700, color: PRIMARY_COLOR, borderBottom: `3px solid ${PRIMARY_COLOR}`, transition: "all .15s" },

  mainContent: { flex: 1, padding: "2rem 1rem", maxWidth: "1100px", width: "100%", margin: "0 auto" },

  formContainer: { backgroundColor: "white", borderRadius: 12, padding: "1.5rem", boxShadow: "0 6px 24px rgba(2,6,23,0.04)" },
  formContainerDark: { backgroundColor: "#0b1420", boxShadow: "0 6px 20px rgba(0,0,0,0.6)" },

  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1rem", marginBottom: "1rem" },
  formGroup: { display: "flex", flexDirection: "column" },
  label: { marginBottom: 6, fontWeight: 600 },
  input: { padding: "0.65rem", border: "1px solid #e6e6e6", borderRadius: 8, fontSize: "0.98rem", outline: "none" },
  select: { padding: "0.65rem", border: "1px solid #e6e6e6", borderRadius: 8, fontSize: "0.98rem" },

  generateButton: { padding: "0.95rem 1rem", color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" },
  buttonDisabled: { padding: "0.95rem 1rem", color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem", width: "100%", backgroundColor: "#9aaefc", cursor: "not-allowed" },

  resultContainer: { backgroundColor: "white", borderRadius: 12, padding: "1.25rem", boxShadow: "0 6px 20px rgba(2,6,23,0.04)" },
  resultContainerDark: { backgroundColor: "#071827", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" },
  errorAlert: { backgroundColor: "#ffebee", color: "#b71c1c", padding: 12, borderRadius: 8, marginBottom: 12 },

  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  resultTitle: { margin: 0, fontSize: "1.15rem" },
  resultActions: { display: "flex", gap: 8 },
  actionButton: { padding: "0.45rem 0.8rem", borderRadius: 8, border: "1px solid #e6e6e6", background: "white", cursor: "pointer" },

  resultContent: { backgroundColor: "#fafafa", padding: 12, borderRadius: 8, marginBottom: 12 },
  resultText: { margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "1rem" },

  ratingContainer: { textAlign: "center", marginTop: 6 },
  ratingPrompt: { margin: 0, color: "#666" },
  ratingStars: { display: "flex", justifyContent: "center", gap: 6, marginTop: 6 },
  starButton: { fontSize: "1.2rem", border: "none", background: "transparent", cursor: "pointer", color: "#ffc107" },

  historyContainer: { backgroundColor: "white", borderRadius: 12, padding: "1.25rem", boxShadow: "0 6px 20px rgba(2,6,23,0.04)" },
  historyContainerDark: { backgroundColor: "#071827" },

  historyFilters: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 180, padding: "0.6rem", borderRadius: 8, border: "1px solid #e6e6e6" },
  filterSelect: { minWidth: 150, padding: "0.6rem", borderRadius: 8, border: "1px solid #e6e6e6" },

  emptyState: { padding: 20, textAlign: "center", color: "#777" },

  historyList: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 },
  historyItem: { border: "1px solid #eee", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10, background: "white" },
  historyItemDark: { background: "#071a2b", border: "1px solid rgba(255,255,255,0.03)" },

  historyItemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyPlatformTag: (_type: AdType) => ({ color: "#fff", padding: "0.25rem 0.6rem", borderRadius: 999, fontWeight: 700, fontSize: "0.8rem" }),
  historyDate: { fontSize: "0.8rem", color: "#666" },

  historyItemContent: { flex: 1 },
  editTextarea: { width: "100%", minHeight: 120, padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", fontFamily: "inherit" },
  historyText: { margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 },

  historyItemFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyStats: { display: "flex", gap: 12, color: "#666" },
  historyActions: { display: "flex", gap: 8 },

  smallButton: { padding: "0.35rem 0.6rem", borderRadius: 8, border: "none", background: "#f0f0f0", cursor: "pointer" },
  smallButtonDanger: { padding: "0.35rem 0.6rem", borderRadius: 8, border: "none", background: "#fff0f0", color: "#b71c1c", cursor: "pointer" },

  analyticsContainer: { background: "white", borderRadius: 12, padding: 12 },
  analyticsContainerDark: { background: "#071827" },
  analyticsTitle: { margin: "0 0 10px", fontSize: "1.1rem" },
  analyticsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 12 },

  analyticsCard: { background: "#f7f8fb", borderRadius: 8, padding: 12, textAlign: "center" },
  analyticsCardTitle: { margin: 0, fontSize: "0.95rem", color: "#444" },
  analyticsCardValue: { margin: 0, fontSize: "1.4rem", fontWeight: 800, color: PRIMARY_COLOR },

  analyticsSectionTitle: { margin: "10px 0", fontWeight: 700 },
  platformDistribution: { display: "flex", flexDirection: "column", gap: 8 },
  distributionItem: { display: "flex", flexDirection: "column", gap: 6 },
  distributionLabel: { display: "flex", justifyContent: "space-between", fontSize: "0.9rem" },
  distributionBarContainer: { height: 8, background: "#eee", borderRadius: 8, overflow: "hidden" },
  distributionBar: { height: "100%", borderRadius: 8 },

  footer: { textAlign: "center", padding: 14, background: "#f3f4f6", color: "#666" },
  footerDark: { background: "#02040a", color: "#9fb7d8" }
};

/* ---------------- util helpers ---------------- */
function merge(a: any, b: any) { return { ...(a||{}), ...(b||{}) }; }