// src/app/dashboard/DashboardClient.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { FiSun, FiMoon, FiBell, FiLogOut, FiSettings, FiBook, FiFileText, FiTrendingUp, FiStar, FiEdit, FiTrash, FiEye, FiPlus, FiDownload, FiUser, FiLock, FiRefreshCw, FiActivity, FiPieChart, FiBarChart2 } from "react-icons/fi";
import { useRouter } from "next/navigation";

/* ==========================================================================
   DashboardClient.tsx - مخصص لمشروع إنشاء المحتوى
   ========================================================================== */

/* -------------------- أنواع البيانات (Types) -------------------- */
export type User = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  subscription?: string;
  usage?: {
    ads: number;
    keywords: number;
    content: number;
    books: number;
  };
};

export type Notification = {
  id: string;
  message: string;
  date: string;
  read?: boolean;
};

export type StatItem = {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  hint?: string;
  color?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  date: string;
  category: string;
};

export type BookItem = {
  id: string;
  title: string;
  author: string;
  pages: number;
  status: string;
  downloads: number;
  date: string;
};

export type AdItem = {
  id: string;
  title: string;
  platform: string;
  status: string;
  clicks: number;
  impressions: number;
  date: string;
};

export interface DashboardClientProps {
  user: User;
  notifications?: Notification[];
  initialLang?: "ar" | "en";
  initialDark?: boolean;
}

/* -------------------- بيانات تجريبية -------------------- */
const SAMPLE_SALES = [
  { name: "يناير", sales: 4000 },
  { name: "فبراير", sales: 3000 },
  { name: "مارس", sales: 5000 },
  { name: "أبريل", sales: 2780 },
  { name: "مايو", sales: 1890 },
  { name: "يونيو", sales: 2390 },
  { name: "يوليو", sales: 3490 },
  { name: "أغسطس", sales: 2000 },
  { name: "سبتمبر", sales: 2780 },
  { name: "أكتوبر", sales: 3000 },
  { name: "نوفمبر", sales: 4200 },
  { name: "ديسمبر", sales: 5300 },
];

const SAMPLE_TRAFFIC = [
  { name: "مقالات", value: 400 },
  { name: "كتب", value: 700 },
  { name: "إعلانات", value: 300 },
  { name: "أخرى", value: 100 },
];

const SAMPLE_NOTES = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  message: `إشعار جديد ${i + 1}`,
  date: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  read: i % 3 === 0,
}));

const SAMPLE_CONTENT: ContentItem[] = [
  { id: "1", title: "كيفية إنشاء محتوى جذاب", type: "مقال", status: "منشور", views: 1240, date: "2023-10-15", category: "التسويق" },
  { id: "2", title: "أفضل أدوات الذكاء الاصطناعي", type: "مدونة", status: "مسودة", views: 0, date: "2023-10-18", category: "التكنولوجيا" },
  { id: "3", title: "دليل التسويق بالبريد الإلكتروني", type: "دليل", status: "منشور", views: 3560, date: "2023-09-22", category: "التسويق" },
  { id: "4", title: "أساسيات تحسين محركات البحث", type: "مقال", status: "مراجعة", views: 890, date: "2023-10-05", category: "التسويق" },
];

const SAMPLE_BOOKS: BookItem[] = [
  { id: "1", title: "فن إنشاء المحتوى", author: "أحمد محمد", pages: 120, status: "مكتمل", downloads: 540, date: "2023-09-10" },
  { id: "2", title: "استراتيجيات التسويق الرقمي", author: "سارة عبدالله", pages: 95, status: "قيد التحرير", downloads: 0, date: "2023-10-12" },
  { id: "3", title: "الذكاء الاصطناعي في الأعمال", author: "محمد الخالد", pages: 210, status: "مكتمل", downloads: 1200, date: "2023-08-05" },
];

const SAMPLE_ADS: AdItem[] = [
  { id: "1", title: "عرض خاص - أكتوبر", platform: "فيسبوك", status: "نشط", clicks: 240, impressions: 12000, date: "2023-10-01" },
  { id: "2", title: "إطلاق المنتج الجديد", platform: "إنستغرام", status: "معلق", clicks: 0, impressions: 0, date: "2023-10-20" },
  { id: "3", title: "خصم الخريف", platform: "جوجل", status: "مكتمل", clicks: 1250, impressions: 45000, date: "2023-09-15" },
];

const PALETTE = [
  "#7C3AED", // purple
  "#6EE7B7", // mint
  "#60A5FA", // blue
  "#F472B6", // pink
  "#F59E0B", // amber
  "#10B981", // green
];

/* -------------------- مساعدة صغيرة -------------------- */
const formatDateShort = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/* -------------------- مكونات صغيرة -------------------- */
const IconButton: React.FC<{
  title?: string;
  onClick?: () => void;
  badge?: number | null;
  children?: React.ReactNode;
}> = ({ title, onClick, badge, children }) => {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: 8,
        borderRadius: 8,
        cursor: "pointer",
        position: "relative",
      }}
      aria-label={title}
    >
      {children}
      {badge && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: "#ef4444",
            color: "white",
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 999,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

interface CardProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Card: React.FC<CardProps> = ({ style, children, onClick, onMouseEnter, onMouseLeave }) => (
  <div
    style={{
      background: "var(--card-bg, #fff)",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 8px 30px rgba(2,6,23,0.06)",
      border: "1px solid rgba(2,6,23,0.05)",
      ...style,
    }}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </div>
);

/* -------------------- مكوّن Sidebar -------------------- */
const Sidebar: React.FC<{
  open: boolean;
  onToggle: () => void;
  lang: "ar" | "en";
  onChangeLang: () => void;
  dark: boolean;
  onToggleDark: () => void;
  active: string;
  setActive: (s: string) => void;
}> = ({ open, onToggle, lang, onChangeLang, dark, onToggleDark, active, setActive }) => {
  return (
    <aside
      style={{
        width: open ? 260 : 78,
        transition: "width .22s ease",
        background: "linear-gradient(180deg, rgba(124,58,237,0.03), rgba(96,165,250,0.01))",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg,#7C3AED,#60A5FA)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 700,
            }}
          >
            AI
          </div>
          {open && (
            <div>
              <div style={{ fontWeight: 700, color: "var(--text, #0f172a)" }}>ContentAI</div>
              <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "منصة المحتوى" : "Content Platform"}</div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={onToggle}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
            }}
            aria-label="Toggle sidebar"
          >
            {open ? "◀" : "▶"}
          </button>
        </div>
      </div>

      <nav aria-label="Main navigation" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { key: "overview", label: lang === "ar" ? "الرئيسية" : "Overview", icon: "🏠" },
          { key: "content", label: lang === "ar" ? "المحتوى" : "Content", icon: "📝" },
          { key: "books", label: lang === "ar" ? "الكتب" : "Books", icon: "📚" },
          { key: "ads", label: lang === "ar" ? "الإعلانات" : "Ads", icon: "📢" },
          { key: "analytics", label: lang === "ar" ? "التحليلات" : "Analytics", icon: "📊" },
          { key: "account", label: lang === "ar" ? "الحساب" : "Account", icon: "👤" },
        ].map((it) => (
          <button
            key={it.key}
            onClick={() => setActive(it.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 10,
              borderRadius: 10,
              background: active === it.key ? "rgba(124,58,237,0.08)" : "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              color: active === it.key ? "var(--accent,#7C3AED)" : "var(--text,#0f172a)",
            }}
            aria-current={active === it.key ? "page" : undefined}
          >
            <span style={{ fontSize: 18 }}>{it.icon}</span>
            {open && <span style={{ fontWeight: 600 }}>{it.label}</span>}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={() => window.location.href = "/upgrade"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 10,
            background: "linear-gradient(135deg, #F59E0B, #F97316)",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            color: "white",
            fontWeight: 600,
          }}
        >
          <FiStar style={{ fontSize: 18 }} />
          {open && <span>{lang === "ar" ? "ترقية الخطة" : "Upgrade Plan"}</span>}
        </button>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onToggleDark}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 10,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "var(--text,#0f172a)",
            }}
          >
            {dark ? <FiSun /> : <FiMoon />} 
            {open && <span>{dark ? (lang === "ar" ? "فاتح" : "Light") : (lang === "ar" ? "داكن" : "Dark")}</span>}
          </button>

          <button
            onClick={onChangeLang}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 10,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "var(--text,#0f172a)",
            }}
          >
            <FiSettings /> 
            {open && <span>{lang === "ar" ? "English" : "العربية"}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

/* -------------------- مكوّن Header -------------------- */
const Header: React.FC<{
  user: User;
  notificationsCount: number;
  onLogout: () => void;
  onMarkAllRead: () => void;
  lang: "ar" | "en";
  onRefresh: () => void;
  loading?: boolean;
}> = ({ user, notificationsCount, onLogout, onMarkAllRead, lang, onRefresh, loading }) => {
  const router = useRouter();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: "1px solid rgba(2,6,23,0.04)",
        gap: 12,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{lang === "ar" ? "لوحة التحكم" : "Dashboard"}</h2>
        <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "مرحباً بعودتك" : "Welcome back"}, {user.name}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(124,58,237,0.1)",
              color: "#7C3AED",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <FiRefreshCw size={16} className={loading ? "spinning" : ""} />
            <span>{lang === "ar" ? "تحديث" : "Refresh"}</span>
          </button>
          
          <button
            onClick={() => router.push("/content")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(124,58,237,0.1)",
              color: "#7C3AED",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <FiFileText size={16} />
            <span>{lang === "ar" ? "المحتوى" : "Content"}</span>
          </button>
          
          <button
            onClick={() => router.push("/books")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(96,165,250,0.1)",
              color: "#60A5FA",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <FiBook size={16} />
            <span>{lang === "ar" ? "الكتب" : "Books"}</span>
          </button>
          
          <button
            onClick={() => router.push("/ad-generator")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(16,185,129,0.1)",
              color: "#10B981",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <FiTrendingUp size={16} />
            <span>{lang === "ar" ? "مولد الإعلانات" : "Ad Generator"}</span>
          </button>
        </div>

        <IconButton title={lang === "ar" ? "الإشعارات" : "Notifications"} badge={notificationsCount} onClick={onMarkAllRead}>
          <FiBell />
        </IconButton>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "linear-gradient(135deg,#7C3AED,#60A5FA)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{user.email}</div>
          </div>

          <button
            onClick={onLogout}
            style={{
              border: "none",
              padding: 8,
              borderRadius: 8,
              cursor: "pointer",
              background: "transparent",
              color: "var(--text,#0f172a)",
            }}
            title={lang === "ar" ? "تسجيل الخروج" : "Logout"}
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
};

/* -------------------- قسم الإحصائيات -------------------- */
const StatsSection: React.FC<{ 
  lang: "ar" | "en"; 
  user: User;
  loading?: boolean;
}> = ({ lang, user, loading }) => {
  const stats = useMemo(() => [
    {
      icon: <FiFileText size={24} />,
      title: lang === "ar" ? "المحتوى المنشور" : "Published Content",
      value: user.usage?.content?.toString() || "0",
      change: "+12%",
      color: "#7C3AED",
    },
    {
      icon: <FiBook size={24} />,
      title: lang === "ar" ? "الكتب المنشورة" : "Published Books",
      value: user.usage?.books?.toString() || "0",
      change: "+8%",
      color: "#60A5FA",
    },
    {
      icon: <FiTrendingUp size={24} />,
      title: lang === "ar" ? "الإعلانات النشطة" : "Active Ads",
      value: user.usage?.ads?.toString() || "0",
      change: "+23%",
      color: "#10B981",
    },
    {
      icon: <FiActivity size={24} />,
      title: lang === "ar" ? "الكلمات المفتاحية" : "Keywords",
      value: user.usage?.keywords?.toString() || "0",
      change: "+15%",
      color: "#F59E0B",
    },
  ], [lang, user.usage]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
      {stats.map((stat, index) => (
        <Card key={index} style={{ borderLeft: `4px solid ${stat.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "var(--muted,#6b7280)", fontSize: 14, marginBottom: 8 }}>{stat.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text,#0f172a)" }}>
                {loading ? "..." : stat.value}
              </div>
              <div style={{ fontSize: 12, color: stat.change.startsWith("+") ? "#10B981" : "#EF4444", marginTop: 4 }}>
                {stat.change} {lang === "ar" ? "من الشهر الماضي" : "from last month"}
              </div>
            </div>
            <div style={{ color: stat.color, padding: 8, borderRadius: 8, background: `${stat.color}20` }}>
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* -------------------- قسم الأدوات الرئيسية -------------------- */
const ToolsSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  const router = useRouter();
  
  const tools = [
    {
      id: "content",
      title: lang === "ar" ? "منشئ المحتوى" : "Content Creator",
      description: lang === "ar" ? "أنشئ محتوى متميز بمساعدة الذكاء الاصطناعي" : "Create premium content with AI assistance",
      icon: <FiFileText size={32} />,
      color: "#7C3AED",
      path: "/content"
    },
    {
      id: "books",
      title: lang === "ar" ? "منشئ الكتب" : "Book Generator",
      description: lang === "ar" ? "اصنع كتباً إلكترونية بجودة عالية" : "Generate high-quality e-books",
      icon: <FiBook size={32} />,
      color: "#60A5FA",
      path: "/books"
    },
    {
      id: "ads",
      title: lang === "ar" ? "منشئ الإعلانات" : "Ad Generator",
      description: lang === "ar" ? "صمم إعلانات جذابة وفعالة" : "Create compelling and effective ads",
      icon: <FiTrendingUp size={32} />,
      color: "#10B981",
      path: "/ad-generator"
    }
  ];

  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ marginBottom: 16 }}>{lang === "ar" ? "أدوات المحتوى" : "Content Tools"}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            style={{ 
              cursor: "pointer", 
              transition: "transform 0.2s, box-shadow 0.2s",
              borderLeft: `4px solid ${tool.color}`,
            }}
            onClick={() => router.push(tool.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(2,6,23,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(2,6,23,0.06)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ color: tool.color }}>{tool.icon}</div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{tool.title}</h3>
            </div>
            <p style={{ margin: 0, color: "var(--muted,#6b7280)", fontSize: 14 }}>
              {tool.description}
            </p>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                style={{
                  background: tool.color,
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {lang === "ar" ? "ابدأ الآن" : "Start Now"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

/* -------------------- قسم التحليلات -------------------- */
const AnalyticsSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  return (
    <section>
      <h2 style={{ marginBottom: 24 }}>{lang === "ar" ? "التحليلات والإحصائيات" : "Analytics & Statistics"}</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <FiBarChart2 /> {lang === "ar" ? "أداء المحتوى" : "Content Performance"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={SAMPLE_SALES}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <FiPieChart /> {lang === "ar" ? "توزيع الزيارات" : "Traffic Distribution"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={SAMPLE_TRAFFIC}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {SAMPLE_TRAFFIC.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  );
};
 
 /* -------------------- قسم إدارة المحتوى -------------------- */
const ContentSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>(SAMPLE_CONTENT);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filteredContent = content.filter(item => 
    filter === "all" || item.status === filter
  ).sort((a, b) => {
    if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "views") return b.views - a.views;
    return 0;
  });

  const handleDelete = (id: string) => {
    setContent(content.filter(item => item.id !== id));
  };

return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>{lang === "ar" ? "إدارة المحتوى" : "Content Management"}</h2>
        <button
          onClick={() => router.push("/content")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#7C3AED",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <FiPlus /> {lang === "ar" ? "محتوى جديد" : "New Content"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(2,6,23,0.1)" }}
        >
          <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
          <option value="منشور">{lang === "ar" ? "منشور" : "Published"}</option>
          <option value="مسودة">{lang === "ar" ? "مسودة" : "Draft"}</option>
          <option value="مراجعة">{lang === "ar" ? "مراجعة" : "Review"}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(2,6,23,0.1)" }}
        >
          <option value="date">{lang === "ar" ? "الأحدث" : "Newest"}</option>
          <option value="views">{lang === "ar" ? "الأكثر مشاهدة" : "Most Viewed"}</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {filteredContent.map((item) => (
          <Card key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px 0" }}>{item.title}</h3>
                <div style={{ display: "flex", gap: 16, fontSize: 14, color: "var(--muted,#6b7280)" }}>
                  <span>{item.type}</span>
                  <span>{item.category}</span>
                  <span style={{ 
                    padding: "2px 8px", 
                    borderRadius: 4, 
                    background: 
                      item.status === "منشور" ? "rgba(16,185,129,0.1)" : 
                      item.status === "مسودة" ? "rgba(245,158,11,0.1)" : 
                      "rgba(59,130,246,0.1)",
                    color: 
                      item.status === "منشور" ? "#10B981" : 
                      item.status === "مسودة" ? "#F59E0B" : 
                      "#3B82F6"
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
                  <span>{lang === "ar" ? "المشاهدات:" : "Views:"} {item.views}</span>
                  <span>{formatDateShort(item.date)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <IconButton title={lang === "ar" ? "معاينة" : "Preview"}>
                  <FiEye />
                </IconButton>
                <IconButton title={lang === "ar" ? "تعديل" : "Edit"}>
                  <FiEdit />
                </IconButton>
                <IconButton title={lang === "ar" ? "حذف" : "Delete"} onClick={() => handleDelete(item.id)}>
                  <FiTrash />
                </IconButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

/* -------------------- قسم إدارة الكتب -------------------- */
const BooksSection = ({ lang }) => {
  const router = useRouter();
  const [books, setBooks] = useState(SAMPLE_BOOKS);
  const [filter, setFilter] = useState("all");

  const filteredBooks = books.filter(book => 
    filter === "all" || book.status === filter
  );

  const handleDelete = (id) => {
    setBooks(books.filter(book => book.id !== id));
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>{lang === "ar" ? "إدارة الكتب" : "Books Management"}</h2>
        <button
          onClick={() => router.push("/book")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#60A5FA",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <FiPlus /> {lang === "ar" ? "كتاب جديد" : "New Book"}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(2,6,23,0.1)" }}
        >
          <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
          <option value="مكتمل">{lang === "ar" ? "مكتمل" : "Completed"}</option>
          <option value="قيد التحرير">{lang === "ar" ? "قيد التحرير" : "Editing"}</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filteredBooks.map((book) => (
          <Card key={book.id} style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
              <IconButton title={lang === "ar" ? "تحميل" : "Download"}>
                <FiDownload />
              </IconButton>
              <IconButton title={lang === "ar" ? "تعديل" : "Edit"}>
                <FiEdit />
              </IconButton>
              <IconButton title={lang === "ar" ? "حذف" : "Delete"} onClick={() => handleDelete(book.id)}>
                <FiTrash />
              </IconButton>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>{book.title}</h3>
              <div style={{ fontSize: 14, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "بواسطة" : "By"} {book.author}</div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14 }}>
                <div>{book.pages} {lang === "ar" ? "صفحة" : "pages"}</div>
                <div>{book.downloads} {lang === "ar" ? "تحميل" : "downloads"}</div>
              </div>
              
              <span style={{ 
                padding: "4px 8px", 
                borderRadius: 4,
                background: book.status === "مكتمل" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                color: book.status === "مكتمل" ? "#10B981" : "#F59E0B",
                fontSize: 12
              }}>
                {book.status}
              </span>
            </div>
            
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted,#6b7280)" }}>
              {formatDateShort(book.date)}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}; 

/* -------------------- قسم منشئ الإعلانات -------------------- */
const AdsSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  const router = useRouter();
  const [ads, setAds] = useState<AdItem[]>(SAMPLE_ADS);
  const [filter, setFilter] = useState("all");
  const [previewAd, setPreviewAd] = useState<AdItem | null>(null);

  const filteredAds = ads.filter(ad => 
    filter === "all" || ad.status === filter
  );

  const handleDelete = (id: string) => {
    setAds(ads.filter(ad => ad.id !== id));
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>{lang === "ar" ? "منشئ الإعلانات" : "Ad Generator"}</h2>
        <button
          onClick={() => router.push("/ad-generator")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#10B981",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <FiPlus /> {lang === "ar" ? "إعلان جديد" : "New Ad"}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(2,6,23,0.1)" }}
        >
          <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
          <option value="نشط">{lang === "ar" ? "نشط" : "Active"}</option>
          <option value="معلق">{lang === "ar" ? "معلق" : "Pending"}</option>
          <option value="مكتمل">{lang === "ar" ? "مكتمل" : "Completed"}</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "grid", gap: 16 }}>
          {filteredAds.map((ad) => (
            <Card key={ad.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>{ad.title}</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 14, color: "var(--muted,#6b7280)" }}>
                    <span>{ad.platform}</span>
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: 4, 
                      background: 
                        ad.status === "نشط" ? "rgba(16,185,129,0.1)" : 
                        ad.status === "معلق" ? "rgba(245,158,11,0.1)" : 
                        "rgba(59,130,246,0.1)",
                      color: 
                        ad.status === "نشط" ? "#10B981" : 
                        ad.status === "معلق" ? "#F59E0B" : 
                        "#3B82F6"
                    }}>
                      {ad.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
                    <span>{lang === "ar" ? "نقرات:" : "Clicks:"} {ad.clicks}</span>
                    <span>{lang === "ar" ? "عرض:" : "Impressions:"} {ad.impressions}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted,#6b7280)" }}>
                    {formatDateShort(ad.date)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <IconButton title={lang === "ar" ? "معاينة" : "Preview"} onClick={() => setPreviewAd(ad)}>
                    <FiEye />
                  </IconButton>
                  <IconButton title={lang === "ar" ? "تعديل" : "Edit"}>
                    <FiEdit />
                  </IconButton>
                  <IconButton title={lang === "ar" ? "حذف" : "Delete"} onClick={() => handleDelete(ad.id)}>
                    <FiTrash />
                  </IconButton>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Card style={{ position: "sticky", top: 24 }}>
            <h3 style={{ margin: "0 0 16px 0" }}>{lang === "ar" ? "معاينة الإعلان" : "Ad Preview"}</h3>
            
            {previewAd ? (
              <div style={{ 
                border: "1px solid rgba(2,6,23,0.1)", 
                borderRadius: 8, 
                padding: 16,
                background: "rgba(2,6,23,0.02)"
              }}>
                <h4 style={{ margin: "0 0 8px 0" }}>{previewAd.title}</h4>
                <p style={{ margin: "0 0 12px 0", color: "var(--muted,#6b7280)" }}>
                  {lang === "ar" ? "هذا نموذج معاينة للإعلان. يمكنك رؤية كيف سيبدو الإعلان على منصة " : "This is an ad preview. You can see how the ad will look on "} 
                  {previewAd.platform}.
                </p>
                <div style={{ 
                  padding: "12px 16px", 
                  background: "#7C3AED", 
                  color: "white", 
                  borderRadius: 6, 
                  display: "inline-block",
                  fontWeight: 500
                }}>
                  {lang === "ar" ? "نقر للعمل" : "Call to Action"}
                </div>
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                minHeight: 200,
                color: "var(--muted,#6b7280)"
              }}>
                {lang === "ar" ? "اختر إعلاناً للمعاينة" : "Select an ad to preview"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

/* -------------------- قسم إعدادات الحساب -------------------- */
const AccountSection: React.FC<{ lang: "ar" | "en"; user: User }> = ({ lang, user }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = () => {
    // محاكاة حفظ البيانات
    alert(lang === "ar" ? "تم حفظ المعلومات الشخصية" : "Profile information saved");
  };

  const handleChangePassword = () => {
    // محاكاة تغيير كلمة المرور
    if (newPassword !== confirmPassword) {
      alert(lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    alert(lang === "ar" ? "تم تغيير كلمة المرور" : "Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <section>
      <h2 style={{ marginBottom: 24 }}>{lang === "ar" ? "إعدادات الحساب" : "Account Settings"}</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <FiUser /> {lang === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </h3>
          
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                {lang === "ar" ? "الاسم" : "Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(2,6,23,0.1)",
                  fontSize: 14
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(2,6,23,0.1)",
                  fontSize: 14
                }}
              />
            </div>
            
            <button
              onClick={handleSaveProfile}
              style={{
                padding: "10px 16px",
                background: "#7C3AED",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                marginTop: 8
              }}
            >
              {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
            </button>
          </div>
        </Card>
        
        <Card>
          <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <FiLock /> {lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </h3>
          
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                {lang === "ar" ? "كلمة المرور الحالية" : "Current Password"}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(2,6,23,0.1)",
                  fontSize: 14
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                {lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(2,6,23,0.1)",
                  fontSize: 14
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(2,6,23,0.1)",
                  fontSize: 14
                }}
              />
            </div>
            
            <button
              onClick={handleChangePassword}
              style={{
                padding: "10px 16px",
                background: "#10B981",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                marginTop: 8
              }}
            >
              {lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
};
/* -------------------- قسم Overview -------------------- */
const OverviewSection: React.FC<{
  lang: "ar" | "en";
  notifications: Notification[];
  user: User;
  loading?: boolean;
}> = ({ lang, notifications, user, loading }) => {
  const router = useRouter();

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <StatsSection lang={lang} user={user} loading={loading} />
      <ToolsSection lang={lang} />
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "الإشعارات الحديثة" : "Recent Notifications"}</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  // noop for demo
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(2,6,23,0.06)",
                  padding: "6px 10px",
                  borderRadius: 8,
                }}
              >
                {lang === "ar" ? "عرض الكل" : "View all"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {notifications.length === 0 ? (
              <div style={{ color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: n.read ? "rgba(2,6,23,0.02)" : "rgba(124,58,237,0.05)",
                    border: "1px solid rgba(2,6,23,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{formatDateShort(n.date)}</div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#7C3AED",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 16px 0" }}>{lang === "ar" ? "حالة الاشتراك" : "Subscription Status"}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #7C3AED, #60A5FA)",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 700,
              }}
            >
              {user.subscription?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, textTransform: "capitalize" }}>
                {user.subscription || "free"}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted,#6b7280)" }}>
                {lang === "ar" ? "خطة الحالي" : "Current Plan"}
              </div>
            </div>
            </div>
            <button
              onClick={() => router.push("/upgrade")}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {lang === "ar" ? "ترقية الخطة" : "Upgrade Plan"}
            </button>
        </Card>
      </div>
    </section>
  );
};

/* -------------------- المكوّن الرئيسي -------------------- */
const DashboardClient: React.FC<DashboardClientProps> = ({
  user,
  notifications = SAMPLE_NOTES,
  initialLang = "ar",
  initialDark = false,
}) => {
  const [dark, setDark] = useState(initialDark);
  const [lang, setLang] = useState<"ar" | "en">(initialLang);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [unreadCount, setUnreadCount] = useState(
    notifications.filter((n) => !n.read).length
  );
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User>(user);
  const router = useRouter();

  // جلب بيانات المستخدم الحقيقية من API
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // تطبيق وضع الظلام
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.style.setProperty("--text", "#f8fafc");
        document.documentElement.style.setProperty("--muted", "#cbd5e1");
        document.documentElement.style.setProperty("--card-bg", "#1e293b");
        document.documentElement.style.background = "#0f172a";
        document.documentElement.style.color = "#f8fafc";
      } else {
        document.documentElement.style.setProperty("--text", "#0f172a");
        document.documentElement.style.setProperty("--muted", "#6b7280");
        document.documentElement.style.setProperty("--card-bg", "#fff");
        document.documentElement.style.background = "#f8fafc";
        document.documentElement.style.color = "#0f172a";
      }
    }
  }, [dark]);

  const handleLogout = async () => {
    try {
      // إرسال طلب تسجيل الخروج إلى API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // إعادة التوجيه إلى صفحة تسجيل الدخول
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    // في التطبيق الحقيقي، سنقوم بتحديث حالة القراءة في قاعدة البيانات
  };

  const handleRefresh = () => {
    fetchUserData();
  };

  const toggleDark = () => setDark(!dark);
  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        direction: lang === "ar" ? "rtl" : "ltr",
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        lang={lang}
        onChangeLang={toggleLang}
        dark={dark}
        onToggleDark={toggleDark}
        active={activeSection}
        setActive={setActiveSection}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--background, #f8fafc)",
        }}
      >
        <Header
          user={userData}
          notificationsCount={unreadCount}
          onLogout={handleLogout}
          onMarkAllRead={handleMarkAllRead}
          lang={lang}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <div style={{ padding: 24, flex: 1 }}>
          {activeSection === "overview" && (
            <OverviewSection
              lang={lang}
              notifications={notifications}
              user={userData}
              loading={loading}
            />
          )}

          {activeSection === "content" && (
            <ContentSection lang={lang} />
          )}

          {activeSection === "books" && (
            <BooksSection lang={lang} />
          )}

          {activeSection === "ads" && (
            <AdsSection lang={lang} />
          )}

          {activeSection === "analytics" && (
            <AnalyticsSection lang={lang} />
          )}

          {activeSection === "account" && (
            <AccountSection lang={lang} user={userData} />
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DashboardClient;