"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Moon,
  Sun,
  Search,
  Globe,
  Play,
  Newspaper,
  BookOpen,
  Loader2,
  ChevronDown,
  ExternalLink,
  Filter,
  Star,
  Bookmark,
  Share,
  ZoomIn,
  Calendar,
  User,
  Sparkles,
  FileText,
  Video,
  Mail,
  MessageSquare,
  PenTool
} from "lucide-react";
import "./content.css";

/* ----------------------------------------------------------------
   Types
----------------------------------------------------------------- */
type Lang = "ar" | "en";
type SourceType = "web" | "youtube" | "news" | "academic";
type ResearchStage = "idle" | "searching" | "processing" | "generating" | "complete";
type ResultQuality = "excellent" | "good" | "average" | "poor";
type ContentType = "article" | "video_script" | "social_media" | "email" | "blog_post" | "summary";
type ToneType = "professional" | "casual" | "friendly" | "academic" | "informative" | "persuasive";
type AudienceType = "general" | "experts" | "students" | "business" | "technical";
type LengthType = "short" | "medium" | "long";

interface ResearchResult {
  id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  source: SourceType;
  date?: string;
  author?: string;
  quality: ResultQuality;
  relevance: number;
  saved?: boolean;
}


/* ----------------------------------------------------------------
   Source Configuration
----------------------------------------------------------------- */
const sourceConfig: Record<SourceType, { 
  icon: React.ReactNode; 
  label: Record<Lang, string>;
  color: string;
  description: Record<Lang, string>;
}> = {
  web: {
    icon: <Globe size={18} />,
    label: { ar: "الويب", en: "Web" },
    color: "#3B82F6",
    description: { ar: "نتائج بحث شاملة من الإنترنت", en: "Comprehensive web search results" }
  },
  youtube: {
    icon: <Play size={18} />,
    label: { ar: "يوتيوب", en: "YouTube" },
    color: "#FF0000",
    description: { ar: "مقاطع فيديو ذات صلة من يوتيوب", en: "Relevant video content from YouTube" }
  },
  news: {
    icon: <Newspaper size={18} />,
    label: { ar: "الأخبار", en: "News" },
    color: "#10B981",
    description: { ar: "أحدث الأخبار والمقالات الإخبارية", en: "Latest news and articles" }
  },
  academic: {
    icon: <BookOpen size={18} />,
    label: { ar: "أكاديمي", en: "Academic" },
    color: "#8B5CF6",
    description: { ar: "مصادر أكاديمية وورقات بحثية", en: "Academic sources and research papers" }
  }
};

/* ----------------------------------------------------------------
   Content Type Configuration
----------------------------------------------------------------- */
const contentTypeConfig: Record<ContentType, {
  icon: React.ReactNode;
  label: Record<Lang, string>;
  description: Record<Lang, string>;
}> = {
  article: {
    icon: <FileText size={18} />,
    label: { ar: "مقال", en: "Article" },
    description: { ar: "مقال متكامل ومنظم", en: "Complete and organized article" }
  },
  video_script: {
    icon: <Video size={18} />,
    label: { ar: "نص فيديو", en: "Video Script" },
    description: { ar: "نص فيديو مع مشاهد وحوار", en: "Video script with scenes and dialogue" }
  },
  social_media: {
    icon: <MessageSquare size={18} />,
    label: { ar: "منشور اجتماعي", en: "Social Media" },
    description: { ar: "منشورات لوسائل التواصل الاجتماعي", en: "Social media posts" }
  },
  email: {
    icon: <Mail size={18} />,
    label: { ar: "بريد إلكتروني", en: "Email" },
    description: { ar: "محتوى بريد إلكتروني", en: "Email content" }
  },
  blog_post: {
    icon: <PenTool size={18} />,
    label: { ar: "مدونة", en: "Blog Post" },
    description: { ar: "مقال مدونة طويل", en: "Long-form blog post" }
  },
  summary: {
    icon: <BookOpen size={18} />,
    label: { ar: "ملخص", en: "Summary" },
    description: { ar: "ملخص مختصر للموضوع", en: "Brief summary of the topic" }
  }
};

/* ----------------------------------------------------------------
   Tone Configuration
----------------------------------------------------------------- */
const toneConfig: Record<ToneType, {
  label: Record<Lang, string>;
  description: Record<Lang, string>;
}> = {
  professional: {
    label: { ar: "احترافي", en: "Professional" },
    description: { ar: "نبرة رسمية ومناسبة للعمل", en: "Formal tone suitable for business" }
  },
  casual: {
    label: { ar: "عامي", en: "Casual" },
    description: { ar: "نبرة يومية غير رسمية", en: "Everyday informal tone" }
  },
  friendly: {
    label: { ar: "ودي", en: "Friendly" },
    description: { ar: "نبرة ودودة ومرحة", en: "Friendly and cheerful tone" }
  },
  academic: {
    label: { ar: "أكاديمي", en: "Academic" },
    description: { ar: "نبرة علمية ومنهجية", en: "Scientific and methodological tone" }
  },
  informative: {
    label: { ar: "إعلامي", en: "Informative" },
    description: { ar: "نبرة واضحة ومباشرة", en: "Clear and direct tone" }
  },
  persuasive: {
    label: { ar: "إقناعي", en: "Persuasive" },
    description: { ar: "نبرة مقنعة وتأثيرية", en: "Convincing and influential tone" }
  }
};

/* ----------------------------------------------------------------
   Audience Configuration
----------------------------------------------------------------- */
const audienceConfig: Record<AudienceType, {
  label: Record<Lang, string>;
  description: Record<Lang, string>;
}> = {
  general: {
    label: { ar: "عام", en: "General" },
    description: { ar: "جمهور عام غير متخصص", en: "General non-specialist audience" }
  },
  experts: {
    label: { ar: "خبراء", en: "Experts" },
    description: { ar: "جمهور متخصص في المجال", en: "Specialized audience in the field" }
  },
  students: {
    label: { ar: "طلاب", en: "Students" },
    description: { ar: "طلاب ومتعلمون", en: "Students and learners" }
  },
  business: {
    label: { ar: "أعمال", en: "Business" },
    description: { ar: "رواد أعمال ومسؤولون", en: "Entrepreneurs and executives" }
  },
  technical: {
    label: { ar: "تقني", en: "Technical" },
    description: { ar: "جمهور تقني ومطورون", en: "Technical audience and developers" }
  }
};

/* ----------------------------------------------------------------
   Length Configuration
----------------------------------------------------------------- */
const lengthConfig: Record<LengthType, {
  label: Record<Lang, string>;
  description: Record<Lang, string>;
  words: string;
}> = {
  short: {
    label: { ar: "قصير", en: "Short" },
    description: { ar: "محتوى مختصر وسريع", en: "Brief and quick content" },
    words: "300-500"
  },
  medium: {
    label: { ar: "متوسط", en: "Medium" },
    description: { ar: "محتوى متوازن ومفصل", en: "Balanced and detailed content" },
    words: "800-1200"
  },
  long: {
    label: { ar: "طويل", en: "Long" },
    description: { ar: "محتوى شامل وموسع", en: "Comprehensive and expanded content" },
    words: "2000+"
  }
};

/* ----------------------------------------------------------------
   Quality Indicators
----------------------------------------------------------------- */
const qualityConfig: Record<ResultQuality, { 
  label: Record<Lang, string>; 
  color: string;
  icon: React.ReactNode;
}> = {
  excellent: {
    label: { ar: "ممتاز", en: "Excellent" },
    color: "#10B981",
    icon: <Star size={14} fill="currentColor" />
  },
  good: {
    label: { ar: "جيد", en: "Good" },
    color: "#3B82F6",
    icon: <Star size={14} fill="currentColor" />
  },
  average: {
    label: { ar: "متوسط", en: "Average" },
    color: "#F59E0B",
    icon: <Star size={14} fill="currentColor" />
  },
  poor: {
    label: { ar: "ضعيف", en: "Poor" },
    color: "#EF4444",
    icon: <Star size={14} />
  }
};

/* ----------------------------------------------------------------
   Animation Variants
----------------------------------------------------------------- */
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const buttonHover: Variants = {
  hover: { scale: 1.03, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },
  tap: { scale: 0.98 },
};

/* ----------------------------------------------------------------
   Floating Background Animations
----------------------------------------------------------------- */
const floatingAnimation = {
  float1: {
    y: [0, 20, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    } as any,
  },
  float2: {
    y: [0, -25, 0],
    rotate: [0, -8, 8, 0],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1,
    } as any,
  },
  float3: {
    y: [0, 30, 0],
    rotate: [0, 12, -12, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 2,
    } as any,
  },
};

/* ----------------------------------------------------------------
   Research Tips & Features
----------------------------------------------------------------- */
const tips: Record<Lang, string[]> = {
  ar: [
    "✨ اختر نوع المحتوى المناسب لهدفك",
    "🔍 استخدم مصادر متعددة لمعلومات أكثر شمولية",
    "⭐ حدد الجمهور المستهدف لتحسين جودة المحتوى",
    "📊 اختر النبرة المناسبة لنوع المحتوى",
    "🚀 استخدم الطول المناسب لنوع المحتوى"
  ],
  en: [
    "✨ Choose the right content type for your goal",
    "🔍 Use multiple sources for comprehensive information",
    "⭐ Define your target audience to improve content quality",
    "📊 Select the appropriate tone for your content",
    "🚀 Use the right length for your content type"
  ]
};

const features: Record<Lang, string[]> = {
  ar: [
    "توليد محتوى ذكي من مصادر متعددة",
    "اختيار نوع المحتوى المناسب",
    "تخصيص النبرة والجمهور المستهدف",
    "تحكم في طول المحتوى المطلوب",
    "نتائج فورية مع تحديث مباشر"
  ],
  en: [
    "Smart content generation from multiple sources",
    "Choose the right content type",
    "Customize tone and target audience",
    "Control the desired content length",
    "Instant results with live updates"
  ]
};

/* ----------------------------------------------------------------
   Main Component
----------------------------------------------------------------- */
export default function AdvancedContentGenerator() {
  /* --------------------------------------------
     State Management
  --------------------------------------------- */
  const [topic, setTopic] = useState("");
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(["web", "youtube", "news"]);
  const [contentType, setContentType] = useState<ContentType>("article");
  const [tone, setTone] = useState<ToneType>("professional");
  const [audience, setAudience] = useState<AudienceType>("general");
  const [length, setLength] = useState<LengthType>("medium");
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ResearchStage>("idle");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Lang>("ar");
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [currentTip, setCurrentTip] = useState(0);
  const [activeTab, setActiveTab] = useState<SourceType | "all" | "saved">("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedResults, setSavedResults] = useState<ResearchResult[]>([]);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "quality">("relevance");
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* --------------------------------------------
     Memoized Data
  --------------------------------------------- */
  const stageText = useMemo(() => ({
    ar: {
      idle: "جاهز للتوليد",
      searching: "🔍 جاري البحث في المصادر...",
      processing: "⚡ جاري تحليل النتائج...",
      generating: "🤖 جاري توليد المحتوى...",
      complete: "✅ اكتمل التوليد"
    },
    en: {
      idle: "Ready to generate",
      searching: "🔍 Searching sources...",
      processing: "⚡ Analyzing results...",
      generating: "🤖 Generating content...",
      complete: "✅ Generation completed"
    }
  }), []);

  /* --------------------------------------------
     Effects & Lifecycle
  --------------------------------------------- */
  useEffect(() => {
    // Load settings and history
    const loadSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('content-settings') || '{}');
        const history = JSON.parse(localStorage.getItem('search-history') || '[]');
        const saved = JSON.parse(localStorage.getItem('saved-results') || '[]');
        
        if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
        if (settings.language) setLanguage(settings.language);
        if (settings.sources) setSelectedSources(settings.sources);
        if (settings.contentType) setContentType(settings.contentType);
        if (settings.tone) setTone(settings.tone);
        if (settings.audience) setAudience(settings.audience);
        if (settings.length) setLength(settings.length);
        
        setSearchHistory(history.slice(0, 10));
        setSavedResults(saved);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Apply settings
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');

    // Save settings
    const settings = { 
      darkMode, 
      language, 
      sources: selectedSources,
      contentType,
      tone,
      audience,
      length
    };
    localStorage.setItem('content-settings', JSON.stringify(settings));
    localStorage.setItem('saved-results', JSON.stringify(savedResults));
  }, [darkMode, language, selectedSources, contentType, tone, audience, length, savedResults]);

  useEffect(() => {
    // Tips rotation
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips[language].length);
    }, 8000);

    return () => clearInterval(tipInterval);
  }, [language]);

  /* --------------------------------------------
     Notification System
  --------------------------------------------- */
  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  /* --------------------------------------------
     Content Processing Functions
  --------------------------------------------- */
  const calculateQuality = useCallback((_item: any): ResultQuality => {
    const score = Math.random() * 100;
    if (score > 80) return 'excellent';
    if (score > 60) return 'good';
    if (score > 40) return 'average';
    return 'poor';
  }, []);

  const calculateRelevance = useCallback((item: any, query: string): number => {
    const title = item.title || '';
    const description = item.description || '';
    const text = `${title} ${description}`.toLowerCase();
    const queryTerms = query.toLowerCase().split(' ');
    
    return queryTerms.reduce((score, term) => {
      return score + (text.includes(term) ? 1 : 0);
    }, 0) / queryTerms.length;
  }, []);

  const processResults = useCallback((rawResults: any, currentTopic: string): ResearchResult[] => {
    const results: ResearchResult[] = [];
    
    Object.entries(rawResults).forEach(([source, sourceResults]) => {
      if (Array.isArray(sourceResults)) {
        sourceResults.forEach((item: any, index: number) => {
          results.push({
            id: `${source}-${index}-${Date.now()}`,
            title: item.title || item.snippet || 'No title',
            description: item.description || item.snippet,
            url: item.url || item.link,
            thumbnail: item.thumbnail || item.thumbnails?.default?.url,
            source: source as SourceType,
            date: item.publishedAt || item.date,
            author: item.author || item.channelTitle,
            quality: calculateQuality(item),
            relevance: calculateRelevance(item, currentTopic),
            saved: false
          });
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }, [calculateQuality, calculateRelevance]);

  /* --------------------------------------------
     Content Generation Functions
  --------------------------------------------- */
  const generateContent = useCallback(async () => {
    if (!topic.trim()) {
      notify(language === 'ar' ? '⚠ يرجى إدخال موضوع للمحتوى' : '⚠ Please enter a content topic', 'error');
      return;
    }

    if (selectedSources.length === 0) {
      notify(language === 'ar' ? '⚠ يرجى اختيار مصدر واحد على الأقل' : '⚠ Please select at least one source', 'error');
      return;
    }

    setLoading(true);
    setStage('searching');
    setResearchResults([]);
    setGeneratedContent("");

    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [topic, ...prev.filter(item => item !== topic)].slice(0, 10);
      localStorage.setItem('search-history', JSON.stringify(newHistory));
      return newHistory;
    });

    try {
      // First, perform research
      setStage('searching');
      const researchResponse = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          sources: selectedSources,
        }),
      });

      if (!researchResponse.ok) {
        const errorText = await researchResponse.text();
        throw new Error(`Research failed: ${errorText}`);
      }

      const researchData = await researchResponse.json();
      
      setStage('processing');
      const processedResults = processResults(researchData.data, topic);
      setResearchResults(processedResults);

      // Then generate content
      setStage('generating');
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchData: researchData.data,
          topic: topic.trim(),
          language,
          tone,
          contentType,
          length,
          targetAudience: audience
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Generation failed: ${errorText}`);
      }

      const generateData = await generateResponse.json();
      setGeneratedContent(generateData.content);
      setStage('complete');
      
      notify(
        language === 'ar' 
          ? `✅ تم توليد المحتوى بنجاح` 
          : `✅ Content generated successfully`,
        'success'
      );
    } catch (error) {
      console.error('Content generation error:', error);
      notify(
        language === 'ar' 
          ? '❌ فشل في توليد المحتوى' 
          : '❌ Content generation failed',
        'error'
      );
      setStage('idle');
    } finally {
      setLoading(false);
    }
  }, [topic, selectedSources, contentType, tone, audience, length, language, notify, processResults]);

  /* --------------------------------------------
     Result Management
  --------------------------------------------- */
  const toggleSaveResult = useCallback((result: ResearchResult) => {
    setSavedResults(prev => {
      const isAlreadySaved = prev.some(r => r.id === result.id);
      let newSavedResults;
      
      if (isAlreadySaved) {
        newSavedResults = prev.filter(r => r.id !== result.id);
        notify(language === 'ar' ? '🗑 تم إزالة النتيجة من المحفوظات' : '🗑 Removed from saved', 'info');
      } else {
        newSavedResults = [...prev, { ...result, saved: true }];
        notify(language === 'ar' ? '⭐ تم حفظ النتيجة' : '⭐ Result saved', 'success');
      }
      
      localStorage.setItem('saved-results', JSON.stringify(newSavedResults));
      return newSavedResults;
    });

    setResearchResults(prev =>
      prev.map(r =>
        r.id === result.id ? { ...r, saved: !r.saved } : r
      )
    );
  }, [language, notify]);

  const shareResult = useCallback(async (result: ResearchResult) => {
    if (navigator.share && result.url) {
      try {
        await navigator.share({
          title: result.title,
          text: result.description,
          url: result.url,
        });
        notify(language === 'ar' ? '📤 تم المشاركة بنجاح' : '📤 Shared successfully', 'success');
      } catch (error) {
        notify(language === 'ar' ? '❌ فشل في المشاركة' : '❌ Share failed', 'error');
      }
    } else if (result.url) {
      navigator.clipboard.writeText(result.url);
      notify(language === 'ar' ? '📋 تم نسخ الرابط' : '📋 Link copied', 'info');
    }
  }, [language, notify]);

  const copyGeneratedContent = useCallback(() => {
    navigator.clipboard.writeText(generatedContent);
    notify(language === 'ar' ? '📋 تم نسخ المحتوى' : '📋 Content copied', 'success');
  }, [generatedContent, language, notify]);

  const downloadGeneratedContent = useCallback(() => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(language === 'ar' ? '📥 تم تحميل المحتوى' : '📥 Content downloaded', 'success');
  }, [generatedContent, topic, language, notify]);

  /* --------------------------------------------
     Filtering & Sorting
  --------------------------------------------- */
  const filteredResults = useMemo(() => {
    let results = activeTab === 'saved' 
      ? savedResults 
      : activeTab === 'all' 
        ? researchResults 
        : researchResults.filter(r => r.source === activeTab);

    // Sort results
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        case 'quality':
          const qualityOrder = { excellent: 4, good: 3, average: 2, poor: 1 };
          return qualityOrder[b.quality] - qualityOrder[a.quality];
        case 'relevance':
        default:
          return b.relevance - a.relevance;
      }
    });

    return results;
  }, [researchResults, savedResults, activeTab, sortBy]);

  /* --------------------------------------------
     Render Components
  --------------------------------------------- */
  const renderSourceButton = useCallback((source: SourceType) => {
    const isSelected = selectedSources.includes(source);
    const config = sourceConfig[source];

    return (
      <motion.button
        key={source}
        onClick={() => setSelectedSources(prev =>
          prev.includes(source)
            ? prev.filter(s => s !== source)
            : [...prev, source]
        )}
        className={`source-button ${isSelected ? 'selected' : ''}`}
        style={{ '--source-color': config.color } as any}
        variants={buttonHover}
        whileHover="hover"
        whileTap="tap"
      >
        {config.icon}
        <span>{config.label[language]}</span>
      </motion.button>
    );
  }, [selectedSources, language]);

  const renderContentTypeButton = useCallback((type: ContentType) => {
    const config = contentTypeConfig[type];

    return (
      <motion.button
        key={type}
        onClick={() => setContentType(type)}
        className={`content-type-button ${contentType === type ? 'selected' : ''}`}
        variants={buttonHover}
        whileHover="hover"
        whileTap="tap"
      >
        {config.icon}
        <span>{config.label[language]}</span>
        <small>{config.description[language]}</small>
      </motion.button>
    );
  }, [contentType, language]);

  const renderToneButton = useCallback((toneType: ToneType) => {
    const config = toneConfig[toneType];

    return (
      <motion.button
        key={toneType}
        onClick={() => setTone(toneType)}
        className={`tone-button ${tone === toneType ? 'selected' : ''}`}
        variants={buttonHover}
        whileHover="hover"
        whileTap="tap"
      >
        <span>{config.label[language]}</span>
        <small>{config.description[language]}</small>
      </motion.button>
    );
  }, [tone, language]);

  const renderAudienceButton = useCallback((audienceType: AudienceType) => {
    const config = audienceConfig[audienceType];

    return (
      <motion.button
        key={audienceType}
        onClick={() => setAudience(audienceType)}
        className={`audience-button ${audience === audienceType ? 'selected' : ''}`}
        variants={buttonHover}
        whileHover="hover"
        whileTap="tap"
      >
        <span>{config.label[language]}</span>
        <small>{config.description[language]}</small>
      </motion.button>
    );
  }, [audience, language]);

  const renderLengthButton = useCallback((lengthType: LengthType) => {
    const config = lengthConfig[lengthType];

    return (
      <motion.button
        key={lengthType}
        onClick={() => setLength(lengthType)}
        className={`length-button ${length === lengthType ? 'selected' : ''}`}
        variants={buttonHover}
        whileHover="hover"
        whileTap="tap"
      >
        <span>{config.label[language]}</span>
        <small>{config.description[language]}</small>
        <div className="word-count">{config.words} {language === 'ar' ? 'كلمة' : 'words'}</div>
      </motion.button>
    );
  }, [length, language]);

  const renderResultItem = useCallback((result: ResearchResult) => {
    const sourceConfigItem = sourceConfig[result.source];
    const qualityConfigItem = qualityConfig[result.quality];

    return (
      <motion.div
        key={result.id}
        className="result-item"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="result-header">
          <div className="result-source" style={{ color: sourceConfigItem.color }}>
            {sourceConfigItem.icon}
            <span>{sourceConfigItem.label[language]}</span>
          </div>
          
          <div className="result-actions">
            <motion.button
              onClick={() => toggleSaveResult(result)}
              className={`icon-button ${result.saved ? 'saved' : ''}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bookmark size={16} fill={result.saved ? 'currentColor' : 'none'} />
            </motion.button>
            
            {result.url && (
              <motion.button
                onClick={() => shareResult(result)}
                className="icon-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Share size={16} />
              </motion.button>
            )}
            
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-button"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="result-content">
          <h4 className="result-title">{result.title}</h4>
          
          {result.description && (
            <p className="result-description">{result.description}</p>
          )}
          
          <div className="result-meta">
            <div className="result-quality" style={{ color: qualityConfigItem.color }}>
              {qualityConfigItem.icon}
              <span>{qualityConfigItem.label[language]}</span>
            </div>
            
            {result.date && (
              <div className="result-date">
                <Calendar size={14} />
                <span>{new Date(result.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
            </div>
            )}
            
            {result.author && (
              <div className="result-author">
                <User size={14} />
                <span>{result.author}</span>
              </div>
            )}
          </div>
        </div>

        {result.thumbnail && (
          <div className="result-thumbnail">
            <img src={result.thumbnail} alt={result.title} />
            <div className="thumbnail-overlay">
              <ZoomIn size={20} />
            </div>
          </div>
        )}
      </motion.div>
    );
  }, [language, toggleSaveResult, shareResult]);

  /* --------------------------------------------
     Main Render
  --------------------------------------------- */
  return (
    <div className="advanced-content-generator">
      {/* Background Animation */}
      <div className="research-background">
        <motion.div className="shape shape-1" animate={floatingAnimation.float1} />
        <motion.div className="shape shape-2" animate={floatingAnimation.float2} />
        <motion.div className="shape shape-3" animate={floatingAnimation.float3} />
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={`notification ${notification.type}`}
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Container */}
      <motion.main
        className="content-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.header
          className="content-header"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="header-left">
            <div className="logo">
              <Sparkles size={28} />
              <h1 className="content-title">
                {language === 'ar' ? 'مساعد توليد المحتوى الذكي' : 'Smart Content Generator Assistant'}
              </h1>
            </div>
            <p className="content-subtitle">
              {language === 'ar' 
                ? 'ابحث وولّد محتوى ذكي عبر مصادر متعددة' 
                : 'Research and generate smart content across multiple sources'}
            </p>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <motion.button
                onClick={() => setDarkMode(!darkMode)}
                className="icon-button"
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </motion.button>

              <div className="language-selector">
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
          </div>
        </motion.header>

        {/* Features Grid */}
        <motion.section
          className="features-grid"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          {features[language].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              variants={scaleIn}
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">✨</div>
              <p>{feature}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* Content Generation Section */}
        <motion.section
          className="generation-section"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="generation-container">
            <div className="generation-header">
              <h2>{language === 'ar' ? 'ولّد محتوى الآن' : 'Generate Content Now'}</h2>
              <div className={`status-indicator ${stage}`}>
                <div className="status-dot" />
                <span>{stageText[language][stage]}</span>
              </div>
            </div>

            {/* Topic Input */}
            <div className="topic-input-group">
              <div className="input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    language === 'ar' 
                      ? 'ادخل موضوع المحتوى...' 
                      : 'Enter your content topic...'
                  }
                  disabled={loading}
                  className="topic-input"
                  onKeyDown={(e) => e.key === 'Enter' && generateContent()}
                  list="searchHistory"
                />
                <datalist id="searchHistory">
                  {searchHistory.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </div>

              <motion.button
                onClick={generateContent}
                disabled={loading || !topic.trim() || selectedSources.length === 0}
                className={`generate-button ${loading ? 'loading' : ''}`}
                variants={buttonHover}
                whileHover={!loading ? 'hover' : undefined}
                whileTap={!loading ? 'tap' : undefined}
              >
                {loading ? (
                  <Loader2 size={20} className="spinner" />
                ) : (
                  <Sparkles size={20} />
                )}
                {language === 'ar' ? 'توليد' : 'Generate'}
              </motion.button>
            </div>

            {/* Content Type Selection */}
            <div className="content-type-section">
              <h3>{language === 'ar' ? 'نوع المحتوى:' : 'Content Type:'}</h3>
              <div className="content-type-grid">
                {(Object.keys(contentTypeConfig) as ContentType[]).map(renderContentTypeButton)}
              </div>
            </div>

            {/* Content Options */}
            <div className="content-options">
              <div className="option-group">
                <h3>{language === 'ar' ? 'نبرة المحتوى:' : 'Content Tone:'}</h3>
                <div className="tone-grid">
                  {(Object.keys(toneConfig) as ToneType[]).map(renderToneButton)}
                </div>
              </div>

              <div className="option-group">
                <h3>{language === 'ar' ? 'الجمهور المستهدف:' : 'Target Audience:'}</h3>
                <div className="audience-grid">
                  {(Object.keys(audienceConfig) as AudienceType[]).map(renderAudienceButton)}
                </div>
              </div>

              <div className="option-group">
                <h3>{language === 'ar' ? 'طول المحتوى:' : 'Content Length:'}</h3>
                <div className="length-grid">
                  {(Object.keys(lengthConfig) as LengthType[]).map(renderLengthButton)}
                </div>
              </div>
            </div>

            {/* Source Selection */}
            <div className="sources-section">
              <div className="sources-header">
                <h3>{language === 'ar' ? 'اختر المصادر:' : 'Select Sources:'}</h3>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="advanced-toggle"
                >
                  {language === 'ar' ? 'خيارات متقدمة' : 'Advanced Options'}
                </button>
              </div>

              <div className="sources-grid">
                {(Object.keys(sourceConfig) as SourceType[]).map(renderSourceButton)}
              </div>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    className="advanced-options"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="option-group">
                      <label>{language === 'ar' ? 'ترتيب النتائج:' : 'Sort by:'}</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="select-input"
                      >
                        <option value="relevance">{language === 'ar' ? 'الأكثر صلة' : 'Relevance'}</option>
                        <option value="date">{language === 'ar' ? 'الأحدث' : 'Date'}</option>
                        <option value="quality">{language === 'ar' ? 'الجودة' : 'Quality'}</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tips */}
            <motion.div
              className="tip-box"
              key={`tip-${currentTip}-${language}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={16} />
              <span>{tips[language][currentTip]}</span>
            </motion.div>
          </div>
        </motion.section>

        {/* Generated Content Section */}
        {generatedContent && (
          <motion.section
            className="generated-content-section"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <div className="content-header">
              <h2>{language === 'ar' ? 'المحتوى المُولّد' : 'Generated Content'}</h2>
              <div className="content-actions">
                <motion.button
                  onClick={copyGeneratedContent}
                  className="action-button"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {language === 'ar' ? 'نسخ' : 'Copy'}
                </motion.button>
                <motion.button
                  onClick={downloadGeneratedContent}
                  className="action-button"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {language === 'ar' ? 'تحميل' : 'Download'}
                </motion.button>
              </div>
            </div>
            <div className="generated-content">
              <pre>{generatedContent}</pre>
            </div>
          </motion.section>
        )}

        {/* Results Section */}
        {researchResults.length > 0 && (
          <motion.section
            className="results-section"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <div className="results-header">
              <h2>{language === 'ar' ? 'مصادر البحث' : 'Research Sources'}</h2>
              
              <div className="results-controls">
                <div className="results-count">
                  {filteredResults.length} {language === 'ar' ? 'نتيجة' : 'results'}
                </div>
                
                <div className="results-tabs">
                  <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    {language === 'ar' ? 'الكل' : 'All'}
                  </button>
                  
                  {(Object.keys(sourceConfig) as SourceType[]).map(source => (
                    <button
                      key={source}
                      className={`tab ${activeTab === source ? 'active' : ''}`}
                      onClick={() => setActiveTab(source)}
                    >
                      {sourceConfig[source].label[language]}
                    </button>
                  ))}
                  
                  <button
                    className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                  >
                    <Bookmark size={14} />
                    {language === 'ar' ? 'المحفوظات' : 'Saved'}
                  </button>
                </div>
              </div>
            </div>

            <div className="results-container">
              {filteredResults.length > 0 ? (
                <div className="results-grid">
                  {filteredResults.map(renderResultItem)}
                </div>
              ) : (
                <div className="empty-results">
                  <Filter size={48} />
                  <h3>{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</h3>
                  <p>
                    {language === 'ar' 
                      ? 'جرب تغيير عوامل التصفية أو مصطلحات البحث' 
                      : 'Try changing your filters or search terms'}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <motion.footer
          className="content-footer"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <div className="footer-content">
            <p>
              {language === 'ar' 
                ? '© 2025 مساعد توليد المحتوى الذكي - صنع بكل ❤' 
                : '© 2025 Smart Content Generator Assistant - Made with ❤'}
            </p>
            <div className="footer-stats">
              <span>{researchResults.length} {language === 'ar' ? 'مصدر' : 'sources'}</span>
              <span>{savedResults.length} {language === 'ar' ? 'محفوظ' : 'saved'}</span>
              <span>{searchHistory.length} {language === 'ar' ? 'بحث' : 'searches'}</span>
            </div>
          </div>
        </motion.footer>
      </motion.main>
    </div>
  );
}