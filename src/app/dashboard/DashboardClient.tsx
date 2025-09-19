// src/app/dashboard/DashboardClient.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import { FiSun, FiMoon, FiBell, FiLogOut, FiSettings, FiBook, FiFileText, FiTrendingUp, FiStar, FiEdit, FiTrash, FiEye, FiPlus, FiDownload, FiRefreshCw, FiUser, FiCreditCard, FiShield } from "react-icons/fi";
import { useRouter } from "next/navigation";

/* ==========================================================================
   DashboardClient.tsx - مخصص لمشروع إنشاء المحتوى
   ========================================================================== */

/* -------------------- أنواع البيانات (Types) -------------------- */

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  subscription?: string;
  usage?: {
    ads: number;
    keywords: number;
    content: number;
    books: number;
  };
  contentCount?: number;
  booksCount?: number;
  adsCount?: number;
  createdAt?: Date;
  lastUpdated?: Date;
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
  contentItems?: ContentItem[];
  bookItems?: BookItem[];
  adItems?: AdItem[];
}

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
          { key: "account", label: lang === "ar" ? "الحساب" : "Account", icon: "👤" },
        ].map((it) => (
          <button
            key={it.key}
            onClick={() => {
              if (it.key === "account") {
                // إذا كان العنصر هو "الحساب"، افتح صفحة الحساب في علامة تبويب جديدة
                window.open("/dashboard/account", "_blank");
              } else {
                // إذا كان عنصراً آخر، غيّر التبويب النشط كالمعتاد
                setActive(it.key);
              }
            }}
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
  contentCount: number;
  booksCount: number;
  adsCount: number;
  loading?: boolean;
}> = ({ lang, user, contentCount, booksCount, adsCount, loading }) => {
  const isAr = lang === "ar";
  const isPro = user?.subscription === "pro" || user?.subscription === "premium";

  const stats = useMemo(() => [
    {
      icon: <FiFileText size={24} />,
      title: isAr ? "المحتوى المنشور" : "Published Content",
      value: contentCount.toString(),
      change: "+12%",
      color: "#7C3AED",
    },
    {
      icon: <FiBook size={24} />,
      title: isAr ? "الكتب المنشورة" : "Published Books",
      value: booksCount.toString(),
      change: "+8%",
      color: "#60A5FA",
    },
    {
      icon: <FiTrendingUp size={24} />,
      title: isAr ? "الإعلانات النشطة" : "Active Ads",
      value: adsCount.toString(),
      change: "+23%",
      color: "#10B981",
    },
    {
      icon: <FiStar size={24} />,
      title: isAr ? "الباقة الحالية" : "Current Plan",
      value: isPro ? (isAr ? "برو" : "Pro") : (isAr ? "مجاني" : "Free"),
      change: isAr ? "ترقية" : "Upgrade",
      color: isPro ? "#F59E0B" : "#9CA3AF",
    },
  ], [lang, contentCount, booksCount, adsCount, isPro, isAr]);

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
                {stat.change} {isAr ? "من الشهر الماضي" : "from last month"}
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

/* -------------------- قسم إدارة المحتوى -------------------- */
const ContentSection: React.FC<{ lang: "ar" | "en"; contentItems: ContentItem[] }> = ({ lang, contentItems }) => {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>(contentItems);
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
        {filteredContent.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted,#6b7280)" }}>
              <FiFileText size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3>{lang === "ar" ? "لا يوجد محتوى حتى الآن" : "No content yet"}</h3>
              <p>{lang === "ar" ? "ابدأ بإنشاء أول محتوى لك" : "Start by creating your first content"}</p>
              <button
                onClick={() => router.push("/content")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background: "#7C3AED",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  marginTop: 16
                }}
              >
                <FiPlus /> {lang === "ar" ? "إنشاء محتوى" : "Create Content"}
              </button>
            </div>
          </Card>
        ) : (
          filteredContent.map((item) => (
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
        ))
      )}
    </div>
  </section>
);
};

/* -------------------- قسم إدارة الكتب -------------------- */
const BooksSection: React.FC<{ lang: "ar" | "en"; bookItems: BookItem[] }> = ({ lang, bookItems }) => {
  const router = useRouter();
  const [books, setBooks] = useState(bookItems);
  const [filter, setFilter] = useState("all");

  const filteredBooks = books.filter(book => 
    filter === "all" || book.status === filter
  );

  const handleDelete = (id: string) => {
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

      {filteredBooks.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted,#6b7280)" }}>
            <FiBook size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <h3>{lang === "ar" ? "لا يوجد كتب حتى الآن" : "No books yet"}</h3>
            <p>{lang === "ar" ? "ابدأ بإنشاء أول كتاب لك" : "Start by creating your first book"}</p>
            <button
              onClick={() => router.push("/books")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#60A5FA",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                marginTop: 16
              }}
            >
              <FiPlus /> {lang === "ar" ? "إنشاء كتاب" : "Create Book"}
            </button>
          </div>
        </Card>
      ) : (
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
      )}
    </section>
  );
}; 

/* -------------------- قسم منشئ الإعلانات -------------------- */
const AdsSection: React.FC<{ lang: "ar" | "en"; adItems: AdItem[] }> = ({ lang, adItems }) => {
  const router = useRouter();
  const [ads, setAds] = useState<AdItem[]>(adItems);
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
          <option value="متوقف">{lang === "ar" ? "متوقف" : "Paused"}</option>
        </select>
      </div>

      {filteredAds.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted,#6b7280)" }}>
            <FiTrendingUp size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <h3>{lang === "ar" ? "لا يوجد إعلانات حتى الآن" : "No ads yet"}</h3>
            <p>{lang === "ar" ? "ابدأ بإنشاء أول إعلان لك" : "Start by creating your first ad"}</p>
            <button
              onClick={() => router.push("/ad-generator")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#10B981",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                marginTop: 16
              }}
            >
              <FiPlus /> {lang === "ar" ? "إنشاء إعلان" : "Create Ad"}
            </button>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filteredAds.map((ad) => (
            <Card key={ad.id}>
              <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
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
              
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 8px 0" }}>{ad.title}</h3>
                <div style={{ fontSize: 14, color: "var(--muted,#6b7280)" }}>{ad.platform}</div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14 }}>
                  <div>{ad.clicks} {lang === "ar" ? "نقرة" : "clicks"}</div>
                  <div>{ad.impressions} {lang === "ar" ? "عرض" : "impressions"}</div>
                </div>
                
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: 4,
                  background: ad.status === "نشط" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: ad.status === "نشط" ? "#10B981" : "#F59E0B",
                  fontSize: 12
                }}>
                  {ad.status}
                </span>
              </div>
              
              <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>
                {formatDateShort(ad.date)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة معاينة الإعلان */}
      {previewAd && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }} onClick={() => setPreviewAd(null)}>
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>{previewAd.title}</h3>
              <button onClick={() => setPreviewAd(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === "ar" ? "المنصة" : "Platform"}:</div>
              <div>{previewAd.platform}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === "ar" ? "الحالة" : "Status"}:</div>
              <div>{previewAd.status}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === "ar" ? "الإحصائيات" : "Statistics"}:</div>
              <div>{lang === "ar" ? "النقرات" : "Clicks"}: {previewAd.clicks}</div>
              <div>{lang === "ar" ? "الظهور" : "Impressions"}: {previewAd.impressions}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === "ar" ? "تاريخ الإنشاء" : "Created at"}:</div>
              <div>{formatDateShort(previewAd.date)}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* -------------------- قسم الحساب -------------------- */
const AccountSection: React.FC<{ lang: "ar" | "en"; userData: any }> = ({ lang, userData }) => {
  const router = useRouter();
  const isAr = lang === "ar";
  
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>{isAr ? "إدارة الحساب" : "Account Management"}</h2>
        <button
          onClick={() => router.push("/dashboard/account")}
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
          {isAr ? "فتح صفحة الحساب" : "Open Account Page"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card style={{ borderLeft: "4px solid #7C3AED" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "linear-gradient(135deg, #7C3AED, #60A5FA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: 18
            }}>
              {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{userData?.name || (isAr ? "مستخدم" : "User")}</h3>
              <p style={{ margin: 0, color: "var(--muted,#6b7280)", fontSize: 14 }}>
                {userData?.email || (isAr ? "لا يوجد بريد إلكتروني" : "No email")}
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "الباقة" : "Plan"}</span>
              <span style={{ fontWeight: 600 }}>
                {userData?.subscription === "pro" ? "Pro" : 
                 userData?.subscription === "premium" ? "Premium" : 
                 isAr ? "مجاني" : "Free"}
              </span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "تاريخ الانضمام" : "Join Date"}</span>
              <span>
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "-"}
              </span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "آخر تحديث" : "Last Update"}</span>
              <span>
                {userData?.lastUpdated ? new Date(userData.lastUpdated).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "-"}
              </span>
            </div>
          </div>
        </Card>

        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>{isAr ? "إحصائيات الاستخدام" : "Usage Statistics"}</h3>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "المحتوى المنشور" : "Published Content"}</span>
              <span style={{ fontWeight: 600 }}>{userData?.contentCount || 0}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "الكتب المنشورة" : "Published Books"}</span>
              <span style={{ fontWeight: 600 }}>{userData?.booksCount || 0}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted,#6b7280)" }}>{isAr ? "الإعلانات النشطة" : "Active Ads"}</span>
              <span style={{ fontWeight: 600 }}>{userData?.adsCount || 0}</span>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/dashboard/account")}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#10B981",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isAr ? "عرض التفاصيل الكاملة" : "View Full Details"}
          </button>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>{isAr ? "الإعدادات السريعة" : "Quick Settings"}</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <Card style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/account")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#7C3AED" }}>
                <FiUser size={20} />
              </div>
              <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
            </div>
          </Card>
          
          <Card style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/account")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#F59E0B" }}>
                <FiCreditCard size={20} />
              </div>
              <span>{isAr ? "الاشتراك" : "Subscription"}</span>
            </div>
          </Card>
          
          <Card style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/account")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#EF4444" }}>
                <FiShield size={20} />
              </div>
              <span>{isAr ? "الأمان" : "Security"}</span>
            </div>
          </Card>
          
          <Card style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/account")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#10B981" }}>
                <FiBell size={20} />
              </div>
              <span>{isAr ? "الإشعارات" : "Notifications"}</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

/* -------------------- المكوّن الرئيسي -------------------- */
const DashboardClient: React.FC<DashboardClientProps> = ({
  user,
  notifications = [],
  initialLang = "ar",
  initialDark = false,
  contentItems = [],
  bookItems = [],
  adItems = [],
}) => {
  const [lang, setLang] = useState<"ar" | "en">(initialLang);
  const [dark, setDark] = useState(initialDark);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notificationsState, setNotificationsState] = useState(notifications);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [realContent, setRealContent] = useState(contentItems);
  const [realBooks, setRealBooks] = useState(bookItems);
  const [realAds, setRealAds] = useState(adItems);
  const router = useRouter();

  // جلب البيانات الحقيقية عند تحميل المكون
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/me');
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.data);
        setRealContent(data.data.content || []);
        setRealBooks(data.data.books || []);
        setRealAds(data.data.ads || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // تأثير لتعيين سمة الألوان
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [dark, lang]);

  // معالجة تسجيل الخروج
  const handleLogout = () => {
    if (confirm(lang === "ar" ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to logout?")) {
      // حذف التوكن
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/login");
    }
  };

  // معالجة تحديث البيانات
  const handleRefresh = () => {
    setLoading(true);
    fetchUserData();
  };

  // معالجة تحديد جميع الإشعارات كمقروءة
  const handleMarkAllRead = () => {
    setNotificationsState(notificationsState.map(n => ({ ...n, read: true })));
  };

  // حساب عدد الإشعارات غير المقروءة
  const unreadNotificationsCount = notificationsState.filter(n => !n.read).length;

  // إحصائيات المحتوى الحقيقية
  const contentCount = realContent.filter(item => item.status === "منشور" || item.status === "published").length;
  const booksCount = realBooks.filter(book => book.status === "مكتمل" || book.status === "completed").length;
  const adsCount = realAds.filter(ad => ad.status === "نشط" || ad.status === "active").length;

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg, #f8fafc)",
      color: "var(--text, #0f172a)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* الشريط الجانبي */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        lang={lang}
        onChangeLang={() => setLang(lang === "ar" ? "en" : "ar")}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        active={activeTab}
        setActive={setActiveTab}
      />

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* الهيدر */}
        <Header
          user={user}
          notificationsCount={unreadNotificationsCount}
          onLogout={handleLogout}
          onMarkAllRead={handleMarkAllRead}
          lang={lang}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* المحتوى */}
        <main style={{ padding: 24, flex: 1, overflow: "auto" }}>
          {activeTab === "overview" && (
            <>
              <StatsSection 
                lang={lang} 
                user={user} 
                contentCount={contentCount} 
                booksCount={booksCount} 
                adsCount={adsCount} 
                loading={loading}
              />
              <ToolsSection lang={lang} />
              <ContentSection lang={lang} contentItems={realContent} />
            </>
          )}

          {activeTab === "content" && (
            <ContentSection lang={lang} contentItems={realContent} />
          )}

          {activeTab === "books" && (
            <BooksSection lang={lang} bookItems={realBooks} />
          )}

          {activeTab === "ads" && (
            <AdsSection lang={lang} adItems={realAds} />
          )}

          {activeTab === "account" && (
            <AccountSection lang={lang} userData={userData} />
          )}
        </main>
      </div>

      {/* تنسيقات CSS مدمجة */}
      <style>{`
        :root {
          --bg: #f8fafc;
          --text: #0f172a;
          --muted: #6b7280;
          --card-bg: #fff;
          --accent: #7C3AED;
        }

        [data-theme="dark"] {
          --bg: #0f172a;
          --text: #f1f5f9;
          --muted: #94a3b8;
          --card-bg: #1e293b;
        }

        [dir="rtl"] {
          text-align: right;
        }

        [dir="ltr"] {
          text-align: left;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        button, select {
          font-family: inherit;
        }

        h2, h3 {
          color: var(--text);
        }
      `}</style>
    </div>
  );
};

export default DashboardClient;