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
import { FiSun, FiMoon, FiBell, FiLogOut, FiSettings, FiBook, FiFileText, FiTrendingUp, FiStar, FiArrowUp } from "react-icons/fi";
import { FaChartLine, FaFileAlt, FaUsers, FaShoppingCart } from "react-icons/fa";

/* ==========================================================================
   DashboardClient.tsx - مخصص لمشروع إنشاء المحتوى
   - أدوات: محتوى (Content)، كتب (Books)، مولد إعلانات (Ad Generator)
   ========================================================================== */

/* -------------------- أنواع البيانات (Types) -------------------- */
export type User = {
  id: string;
  name: string;
  email?: string;
  role?: string;
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
  { name: "كمبيوتر", value: 400 },
  { name: "جوال", value: 700 },
  { name: "تابلت", value: 300 },
  { name: "أخرى", value: 100 },
];

const SAMPLE_NOTES = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  message: `إشعار جديد ${i + 1}`,
  date: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  read: i % 3 === 0,
}));

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
  return d.toLocaleString();
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

// تحديث واجهة مكون Card لقبول معالجات الأحداث
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
          { key: "analytics", label: lang === "ar" ? "الإحصائيات" : "Analytics", icon: "📊" },
          { key: "content", label: lang === "ar" ? "المحتوى" : "Content", icon: "📝" },
          { key: "books", label: lang === "ar" ? "الكتب" : "Books", icon: "📚" },
          { key: "ads", label: lang === "ar" ? "الإعلانات" : "Ads", icon: "📢" },
          { key: "settings", label: lang === "ar" ? "الإعدادات" : "Settings", icon: "⚙" },
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
        {/* زر الترقية */}
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
        
        {/* إعدادات المظهر واللغة */}
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
}> = ({ user, notificationsCount, onLogout, onMarkAllRead, lang }) => {
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
        <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "مرحباً بعودتك" : "Welcome back"}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* أزرار الأدوات السريعة */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.location.href = "/content"}
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
            onClick={() => window.location.href = "/books"}
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
            onClick={() => window.location.href = "/ad-generator"}
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

/* -------------------- قسم الأدوات الرئيسية -------------------- */
const ToolsSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
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
            onClick={() => window.location.href = tool.path}
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

/* -------------------- قسم Overview -------------------- */
const OverviewSection: React.FC<{
  lang: "ar" | "en";
  stats: StatItem[];
  salesData: typeof SAMPLE_SALES;
  traffic: typeof SAMPLE_TRAFFIC;
  notifications: Notification[];
  dark: boolean;
}> = ({ lang, stats, salesData, traffic, notifications, dark }) => {
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ToolsSection lang={lang} />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {stats.map((s) => (
          <Card key={s.title}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{s.title}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ marginTop: 8, color: s.change.startsWith("+") ? "#10B981" : "#ef4444", fontWeight: 600 }}>{s.change}</div>
              </div>
              <div style={{ fontSize: 28, color: s.color }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card style={{ minHeight: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "إحصائيات المحتوى" : "Content Statistics"}</h3>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "آخر 12 شهر" : "Last 12 months"}</div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#2b2b2b" : "#eee"} />
                <XAxis dataKey="name" stroke={dark ? "#cbd5e1" : "#475569"} />
                <YAxis stroke={dark ? "#cbd5e1" : "#475569"} />
                <Tooltip wrapperStyle={{ borderRadius: 6 }} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ minHeight: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "نوع المحتوى" : "Content Types"}</h3>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "التوزيع" : "Distribution"}</div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={traffic}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${Math.round(((entry.value ?? 0) / traffic.reduce((a, b) => a + b.value, 0)) * 100)}%`}
                >
                  {traffic.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
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

  // إحصائيات تجريبية
  const stats: StatItem[] = useMemo(
    () => [
      {
        icon: <FaChartLine />,
        title: lang === "ar" ? "إجمالي المحتوى" : "Total Content",
        value: "1,248",
        change: "+12%",
        color: "#7C3AED",
      },
      {
        icon: <FaFileAlt />,
        title: lang === "ar" ? "المقالات" : "Articles",
        value: "845",
        change: "+8%",
        color: "#60A5FA",
      },
      {
        icon: <FaUsers />,
        title: lang === "ar" ? "المستخدمون" : "Users",
        value: "5,281",
        change: "+23%",
        color: "#10B981",
      },
      {
        icon: <FaShoppingCart />,
        title: lang === "ar" ? "المبيعات" : "Sales",
        value: "2,451",
        change: "+18%",
        color: "#F59E0B",
      },
    ],
    [lang]
  );

  // تطبيق وضع الظلام
  useEffect(() => {
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
  }, [dark]);

  const handleLogout = () => {
    // محاكاة تسجيل الخروج
    console.log("Logging out...");
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    // في التطبيق الحقيقي، سنقوم بتحديث حالة القراءة في قاعدة البيانات
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
          user={user}
          notificationsCount={unreadCount}
          onLogout={handleLogout}
          onMarkAllRead={handleMarkAllRead}
          lang={lang}
        />

        <div style={{ padding: 24, flex: 1 }}>
          {activeSection === "overview" && (
            <OverviewSection
              lang={lang}
              stats={stats}
              salesData={SAMPLE_SALES}
              traffic={SAMPLE_TRAFFIC}
              notifications={notifications}
              dark={dark}
            />
          )}

          {activeSection === "analytics" && (
            <div>
              <h2>{lang === "ar" ? "التحليلات المتقدمة" : "Advanced Analytics"}</h2>
              <p>{lang === "ar" ? "قسم التحليلات قيد التطوير..." : "Analytics section is under development..."}</p>
            </div>
          )}

          {activeSection === "content" && (
            <div>
              <h2>{lang === "ar" ? "إدارة المحتوى" : "Content Management"}</h2>
              <p>{lang === "ar" ? "قسم المحتوى قيد التطوير..." : "Content section is under development..."}</p>
            </div>
          )}

          {activeSection === "books" && (
            <div>
              <h2>{lang === "ar" ? "إدارة الكتب" : "Books Management"}</h2>
              <p>{lang === "ar" ? "قسم الكتب قيد التطوير..." : "Books section is under development..."}</p>
            </div>
          )}

          {activeSection === "ads" && (
            <div>
              <h2>{lang === "ar" ? "منشئ الإعلانات" : "Ad Generator"}</h2>
              <p>{lang === "ar" ? "قسم الإعلانات قيد التطوير..." : "Ads section is under development..."}</p>
            </div>
          )}

          {activeSection === "settings" && (
            <div>
              <h2>{lang === "ar" ? "الإعدادات" : "Settings"}</h2>
              <p>{lang === "ar" ? "قسم الإعدادات قيد التطوير..." : "Settings section is under development..."}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
 
export default DashboardClient;