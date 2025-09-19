// app/ad-generator/page.tsx
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

interface UserSubscription {
  type: string;
  adsLimit: number;
  adsUsed: number;
  marketAnalysis: boolean;
  advancedFeatures: boolean;
  remainingAds: number | 'unlimited';
  remainingAnalysis: number | 'unlimited';
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

  const [activeTab, setActiveTab] = useState<"generator" | "history" | "analytics" | "subscription">("generator");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<AdType | "all">("all");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    type: "free",
    adsLimit: 5,
    adsUsed: 0,
    marketAnalysis: false,
    advancedFeatures: false,
    remainingAds: 5,
    remainingAnalysis: 0
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  /* theme & lang: default fixed values, read persisted values in effect */
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<AdLanguage>("ar");

  // استخدام useRef لتخزين القيم بدون إعادة تصيير
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

      // تحميل معلومات الاشتراك
      loadUserSubscription();
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

  // دالة لتحميل معلومات اشتراك المستخدم
  const loadUserSubscription = async () => {
    try {
      const response = await fetch('/api/generate-ad');
      if (response.ok) {
        const data = await response.json();
        setUserSubscription({
          type: data.type,
          adsLimit: data.limits.monthlyRequests,
          adsUsed: data.usage.adsGenerated || 0,
          marketAnalysis: data.type !== 'free',
          advancedFeatures: data.type === 'premium',
          remainingAds: data.remainingAds,
          remainingAnalysis: data.remainingAnalysis
        });
      } else if (response.status === 402) {
        // إذا كان الاشتراك منتهيًا
        const errorData = await response.json();
        setUserSubscription({
          type: errorData.plan || 'free',
          adsLimit: errorData.limit || 5,
          adsUsed: errorData.used || 0,
          marketAnalysis: false,
          advancedFeatures: false,
          remainingAds: 0,
          remainingAnalysis: 0
        });
        setError("لقد تجاوزت الحد المسموح به لخطتك الحالية. يرجى الترقية.");
        setShowSubscriptionModal(true);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

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

    // التحقق من حدود الاشتراك أولاً
    if (userSubscription.remainingAds !== 'unlimited' && userSubscription.remainingAds <= 0) {
      setError(lang === "ar" 
        ? "❌ لقد تجاوزت الحد المسموح به لهذا الشهر. يرجى ترقية اشتراكك." 
        : "❌ You have exceeded your monthly limit. Please upgrade your subscription.");
      setShowSubscriptionModal(true);
      return;
    }

    setLoading(true);
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: input.product,
          audience: input.audience,
          type: input.type,
          language: input.language,
          tone: input.tone,
          length: input.length,
          keywords: input.keywords,
          specialOffers: input.specialOffers,
          category: "تكنولوجيا",
          includeResearch: userSubscription.type !== 'free'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'SUBSCRIPTION_LIMIT_EXCEEDED') {
          setError(lang === "ar" 
            ? `❌ لقد تجاوزت الحد المسموح به لخطتك الحالية (${errorData.limit} إعلان)` 
            : `❌ You have exceeded your plan limit (${errorData.limit} ads)`);
          setShowSubscriptionModal(true);
          return;
        }
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setResult(data.adText);
      addToHistory(data.adText);

      // تحديث معلومات الاشتراك
      await loadUserSubscription();

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
  }, [input, lang, validateInput, addToHistory, trackEvent, userSubscription]);

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

  const cancelEdit = useCallback(() => {
    setEditingAdId(null);
  }, []);

  /* ---------------- subscription ---------------- */
  const handleUpgrade = useCallback((plan: string) => {
    // تنفيذ عملية الترقية
    trackEvent("upgrade_clicked", { plan });
    alert(lang === "ar" ? `سيتم توجيهك لصفحة الدفع لخطة ${plan}` : `Redirecting to payment for ${plan} plan`);
  }, [lang, trackEvent]);

  /* ---------------- render helpers ---------------- */
  const renderInputField = (label: string, value: string, onChange: (v: string) => void, placeholder: string, type = "text") => (
    <div className="input-group">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  const renderSelectField = (label: string, value: any, options: any[], onChange: (v: any) => void) => (
    <div className="input-group">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
        {options.map(opt => (
          <option key={opt} value={opt}>
            {lang === "ar" ? 
              opt === "facebook" ? "فيسبوك" :
              opt === "instagram" ? "إنستغرام" :
              opt === "google" ? "جوجل" :
              opt === "twitter" ? "تويتر" :
              opt === "linkedin" ? "لينكدإن" :
              opt === "tiktok" ? "تيك توك" :
              opt === "youtube" ? "يوتيوب" :
              opt === "formal" ? "رسمي" :
              opt === "friendly" ? "ودي" :
              opt === "humorous" ? "فكاهي" :
              opt === "persuasive" ? "إقناعي" :
              opt === "urgent" ? "عاجل" :
              opt === "short" ? "قصير" :
              opt === "medium" ? "متوسط" :
              opt === "long" ? "طويل" :
              opt === "ar" ? "العربية" : "الإنجليزية"
            : opt}
          </option>
        ))}
      </select>
    </div>
  );

  const renderGeneratedAd = () => {
    if (!result) return null;

    return (
      <div className="result-container">
        <h3>{lang === "ar" ? "الإعلان المُنشأ" : "Generated Ad"}</h3>
        <div className="ad-text">{result}</div>
        <div className="result-actions">
          <button
            onClick={() => copyToClipboard(result)}
            className="btn btn-primary"
            disabled={loading}
          >
            {lang === "ar" ? "نسخ النص" : "Copy Text"}
          </button>
          <button
            onClick={() => {
              setResult("");
              setInput(prev => ({ ...prev, product: "", audience: "" }));
            }}
            className="btn btn-secondary"
          >
            {lang === "ar" ? "مسح والبدء من جديد" : "Clear & Start Over"}
          </button>
        </div>
      </div>
    );
  };

  const renderHistoryItem = (ad: GeneratedAd) => (
    <div key={ad.id} className="history-item">
      <div className="history-item-header">
        <div className="platform-badge" style={{ background: platformGradient(ad.input.type) }}>
          {lang === "ar" ? 
            ad.input.type === "facebook" ? "فيسبوك" :
            ad.input.type === "instagram" ? "إنستغرام" :
            ad.input.type === "google" ? "جوجل" :
            ad.input.type === "twitter" ? "تويتر" :
            ad.input.type === "linkedin" ? "لينكدإن" :
            ad.input.type === "tiktok" ? "تيك توك" :
            ad.input.type === "youtube" ? "يوتيوب" : ad.input.type
          : ad.input.type}
        </div>
        <div className="history-item-actions">
          {editingAdId === ad.id ? (
            <>
              <button onClick={saveEdit} className="btn-icon success">
                ✓
              </button>
              <button onClick={cancelEdit} className="btn-icon danger">
                ✗
              </button>
            </>
          ) : (
            <>
              <button onClick={() => startEditing(ad)} className="btn-icon">
                ✏️
              </button>
              <button onClick={() => copyToClipboard(ad.text, ad.id)} className="btn-icon">
                📋
              </button>
              <button onClick={() => exportAd(ad)} className="btn-icon">
                📥
              </button>
              <button onClick={() => deleteAdFromHistory(ad.id)} className="btn-icon danger">
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {editingAdId === ad.id ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="edit-textarea"
          rows={4}
        />
      ) : (
        <div className="history-item-content">
          <p className="ad-text">{ad.text}</p>
          <div className="history-item-meta">
            <span>{ad.createdAt.toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</span>
            {ad.modifiedAt && <span>{lang === "ar" ? "معدل" : "Edited"}</span>}
            <span>{lang === "ar" ? `${ad.views} مشاهدات` : `${ad.views} views`}</span>
            <span>{lang === "ar" ? `${ad.copies} نسخ` : `${ad.copies} copies`}</span>
          </div>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => rateAd(ad.id, star)}
                className={`rating-star ${ad.rating && ad.rating >= star ? "active" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-container">
      <h3>{lang === "ar" ? "إحصائيات الاستخدام" : "Usage Analytics"}</h3>
      
      <div className="analytics-grid">
        <div className="analytics-card" style={{ background: PRIMARY_GRADIENT }}>
          <h4>{lang === "ar" ? "إجمالي الإنشاءات" : "Total Generations"}</h4>
          <p className="analytics-number">{analytics.totalGenerations}</p>
        </div>
        
        <div className="analytics-card" style={{ background: SECONDARY_GRADIENT }}>
          <h4>{lang === "ar" ? "متوسط وقت الإنشاء" : "Avg. Generation Time"}</h4>
          <p className="analytics-number">
            {analytics.generationTime.length > 0
              ? (analytics.generationTime.reduce((a, b) => a + b, 0) / analytics.generationTime.length).toFixed(2)
              : "0.00"}s
          </p>
        </div>
        
        <div className="analytics-card" style={{ background: SUCCESS_GRADIENT }}>
          <h4>{lang === "ar" ? "إجمالي النسخ" : "Total Copies"}</h4>
          <p className="analytics-number">{analytics.totalCopies}</p>
        </div>
        
        <div className="analytics-card" style={{ background: DARK_GRADIENT }}>
          <h4>{lang === "ar" ? "المنصة الأكثر استخدامًا" : "Most Used Platform"}</h4>
          <p className="analytics-number">
            {lang === "ar" ? 
              analytics.mostUsedPlatform === "facebook" ? "فيسبوك" :
              analytics.mostUsedPlatform === "instagram" ? "إنستغرام" :
              analytics.mostUsedPlatform === "google" ? "جوجل" :
              analytics.mostUsedPlatform === "twitter" ? "تويتر" :
              analytics.mostUsedPlatform === "linkedin" ? "لينكدإن" :
              analytics.mostUsedPlatform === "tiktok" ? "تيك توك" :
              analytics.mostUsedPlatform === "youtube" ? "يوتيوب" : analytics.mostUsedPlatform
            : analytics.mostUsedPlatform}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSubscriptionInfo = () => (
    <div className="subscription-container">
      <h3>{lang === "ar" ? "خطة الاشتراك" : "Subscription Plan"}</h3>
      
      <div className="subscription-card">
        <div className="subscription-header">
          <h4>{userSubscription.type === "free" 
            ? (lang === "ar" ? "مجاني" : "Free") 
            : userSubscription.type === "premium" 
              ? (lang === "ar" ? "بريميوم" : "Premium")
              : (lang === "ar" ? "احترافي" : "Pro")}</h4>
          <span className="subscription-badge">{userSubscription.type}</span>
        </div>
        
        <div className="subscription-details">
          <div className="subscription-feature">
            <span>{lang === "ar" ? "عدد الإعلانات المتبقية:" : "Remaining Ads:"}</span>
            <span className="feature-value">
              {userSubscription.remainingAds === 'unlimited' 
                ? (lang === "ar" ? "غير محدود" : "Unlimited")
                : userSubscription.remainingAds}
            </span>
          </div>
          
          <div className="subscription-feature">
            <span>{lang === "ar" ? "التحليلات التسويقية:" : "Market Analysis:"}</span>
            <span className="feature-value">
              {userSubscription.marketAnalysis 
                ? (lang === "ar" ? "مفعل" : "Enabled") 
                : (lang === "ar" ? "غير مفعل" : "Disabled")}
            </span>
          </div>
          
          <div className="subscription-feature">
            <span>{lang === "ar" ? "الميزات المتقدمة:" : "Advanced Features:"}</span>
            <span className="feature-value">
              {userSubscription.advancedFeatures 
                ? (lang === "ar" ? "مفعل" : "Enabled") 
                : (lang === "ar" ? "غير مفعل" : "Disabled")}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSubscriptionModal(true)}
          className="btn btn-primary"
        >
          {lang === "ar" ? "ترقية الخطة" : "Upgrade Plan"}
        </button>
      </div>
    </div>
  );

  const renderSubscriptionModal = () => (
    <div className={`modal ${showSubscriptionModal ? 'active' : ''}`}>
      <div className="modal-content">
        <h3>{lang === "ar" ? "ترقية الخطة" : "Upgrade Plan"}</h3>
        
        <div className="plans-container">
          <div className="plan-card">
            <h4>{lang === "ar" ? "بريميوم" : "Premium"}</h4>
            <p className="plan-price">$19.99/{lang === "ar" ? "شهر" : "month"}</p>
            <ul>
              <li>{lang === "ar" ? "١٠٠ إعلان شهريًا" : "100 ads per month"}</li>
              <li>{lang === "ar" ? "تحليلات تسويقية" : "Market analysis"}</li>
              <li>{lang === "ar" ? "دعم أولوية" : "Priority support"}</li>
            </ul>
            <button 
              onClick={() => handleUpgrade("premium")}
              className="btn btn-primary"
            >
              {lang === "ar" ? "اختر البريميوم" : "Choose Premium"}
            </button>
          </div>
          
          <div className="plan-card featured">
            <h4>{lang === "ar" ? "احترافي" : "Pro"}</h4>
            <p className="plan-price">$49.99/{lang === "ar" ? "شهر" : "month"}</p>
            <ul>
              <li>{lang === "ar" ? "إعلانات غير محدودة" : "Unlimited ads"}</li>
              <li>{lang === "ar" ? "تحليلات متقدمة" : "Advanced analytics"}</li>
              <li>{lang === "ar" ? "ميزات حصرية" : "Exclusive features"}</li>
              <li>{lang === "ar" ? "دعم على مدار الساعة" : "24/7 support"}</li>
            </ul>
            <button 
              onClick={() => handleUpgrade("pro")}
              className="btn btn-primary"
            >
              {lang === "ar" ? "اختر الاحترافي" : "Choose Pro"}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSubscriptionModal(false)}
          className="btn btn-secondary"
        >
          {lang === "ar" ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`ad-generator-container ${theme}`}>
      <header className="app-header">
        <h1>{lang === "ar" ? "منشئ الإعلانات الذكي" : "Smart Ad Generator"}</h1>
        <div className="header-controls">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="btn-icon"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="btn-icon"
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
      </header>

      <nav className="tabs-container">
        <button
          onClick={() => setActiveTab("generator")}
          className={`tab ${activeTab === "generator" ? "active" : ""}`}
        >
          {lang === "ar" ? "منشئ الإعلانات" : "Ad Generator"}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`tab ${activeTab === "history" ? "active" : ""}`}
        >
          {lang === "ar" ? "السجل" : "History"}
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
        >
          {lang === "ar" ? "الإحصائيات" : "Analytics"}
        </button>
        <button
          onClick={() => setActiveTab("subscription")}
          className={`tab ${activeTab === "subscription" ? "active" : ""}`}
        >
          {lang === "ar" ? "الاشتراك" : "Subscription"}
        </button>
      </nav>

      <main className="main-content">
        {activeTab === "generator" && (
          <div className="generator-tab">
            <div className="input-section">
              <h2>{lang === "ar" ? "إنشاء إعلان جديد" : "Create New Ad"}</h2>
              
              {renderInputField(
                lang === "ar" ? "المنتج/الخدمة" : "Product/Service",
                input.product,
                (v) => setInput(prev => ({ ...prev, product: v })),
                lang === "ar" ? "أدخل اسم المنتج أو الخدمة..." : "Enter product or service name..."
              )}
              
              {renderInputField(
                lang === "ar" ? "الجمهور المستهدف" : "Target Audience",
                input.audience,
                (v) => setInput(prev => ({ ...prev, audience: v })),
                lang === "ar" ? "مثل: شباب ١٨-٢٥، رجال الأعمال..." : "e.g., youth 18-25, business professionals..."
              )}
              
              {renderSelectField(
                lang === "ar" ? "منصة الإعلان" : "Ad Platform",
                input.type,
                AD_TYPES,
                (v) => setInput(prev => ({ ...prev, type: v as AdType }))
              )}
              
              {renderSelectField(
                lang === "ar" ? "لغة الإعلان" : "Ad Language",
                input.language,
                LANGUAGES,
                (v) => setInput(prev => ({ ...prev, language: v as AdLanguage }))
              )}
              
              {renderSelectField(
                lang === "ar" ? "نبرة الإعلان" : "Ad Tone",
                input.tone,
                TONES,
                (v) => setInput(prev => ({ ...prev, tone: v as AdTone }))
              )}
              
              {renderSelectField(
                lang === "ar" ? "طول الإعلان" : "Ad Length",
                input.length,
                ["short", "medium", "long"],
                (v) => setInput(prev => ({ ...prev, length: v as AdLength }))
              )}
              
              {renderInputField(
                lang === "ar" ? "كلمات مفتاحية (اختياري)" : "Keywords (optional)",
                input.keywords || "",
                (v) => setInput(prev => ({ ...prev, keywords: v })),
                lang === "ar" ? "كلمات مفتاحية مفصولة بفواصل..." : "Keywords separated by commas..."
              )}
              
              {renderInputField(
                lang === "ar" ? "عروض خاصة (اختياري)" : "Special Offers (optional)",
                input.specialOffers || "",
                (v) => setInput(prev => ({ ...prev, specialOffers: v })),
                lang === "ar" ? "خصومات، عروض محدودة..." : "Discounts, limited offers..."
              )}
              
              <button
                onClick={generateAd}
                disabled={loading}
                className="btn btn-primary generate-btn"
              >
                {loading 
                  ? (lang === "ar" ? "جاري الإنشاء..." : "Generating...") 
                  : (lang === "ar" ? "إنشاء الإعلان" : "Generate Ad")}
              </button>
              
              {error && <div className="error-message">{error}</div>}
            </div>
            
            {renderGeneratedAd()}
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-tab">
            <div className="history-filters">
              <input
                type="text"
                placeholder={lang === "ar" ? "بحث في السجل..." : "Search history..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as AdType | "all")}
                className="filter-select"
              >
                <option value="all">{lang === "ar" ? "كل المنصات" : "All Platforms"}</option>
                {AD_TYPES.map(type => (
                  <option key={type} value={type}>
                    {lang === "ar" ? 
                      type === "facebook" ? "فيسبوك" :
                      type === "instagram" ? "إنستغرام" :
                      type === "google" ? "جوجل" :
                      type === "twitter" ? "تويتر" :
                      type === "linkedin" ? "لينكدإن" :
                      type === "tiktok" ? "تيك توك" :
                      type === "youtube" ? "يوتيوب" : type
                    : type}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="filter-select"
              >
                <option value="all">{lang === "ar" ? "كل التقييمات" : "All Ratings"}</option>
                <option value="4">{lang === "ar" ? "٤ نجوم وأعلى" : "4+ Stars"}</option>
                <option value="3">{lang === "ar" ? "٣ نجوم وأعلى" : "3+ Stars"}</option>
              </select>
            </div>
            
            <div className="history-list">
              {filteredHistory.length === 0 ? (
                <p className="empty-state">
                  {lang === "ar" ? "لا توجد إعلانات في السجل بعد." : "No ads in history yet."}
                </p>
              ) : (
                filteredHistory.map(renderHistoryItem)
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && renderAnalytics()}
        
        {activeTab === "subscription" && renderSubscriptionInfo()}
      </main>

      {renderSubscriptionModal()}

      <footer className="app-footer">
        <p>{lang === "ar" ? "منشئ الإعلانات الذكي © 2023" : "Smart Ad Generator © 2023"}</p>
      </footer>
    </div>
  );
}

/* ---------------- Styles ---------------- */
