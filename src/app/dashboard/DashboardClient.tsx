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
import { FiSun, FiMoon, FiBell, FiLogOut, FiSettings } from "react-icons/fi";
import { FaChartLine, FaFileAlt, FaUsers, FaShoppingCart } from "react-icons/fa";

/* ==========================================================================
   DashboardClient.tsx
   Large single-file Dashboard client component (TypeScript + React)
   - No external theme/i18n libraries required
   - Uses recharts and react-icons only
   - Light / Dark mode support via CSS class on document.documentElement
   - Well-typed props and internal types
   - Lots of sections and placeholder content to expand file length
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
  date: string; // ISO or human
  read?: boolean;
};

export type StatItem = {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string; // "+12%" or "-3%"
  hint?: string;
  color?: string;
};

export interface DashboardClientProps {
  user: User;
  notifications?: Notification[];
  initialLang?: "ar" | "en";
  initialDark?: boolean;
}

/* -------------------- بيانات تجريبية كبيرة (for demo / filler) -------------------- */
const SAMPLE_SALES = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
  { name: "Jul", sales: 3490 },
  { name: "Aug", sales: 2000 },
  { name: "Sep", sales: 2780 },
  { name: "Oct", sales: 3000 },
  { name: "Nov", sales: 4200 },
  { name: "Dec", sales: 5300 },
];

const SAMPLE_TRAFFIC = [
  { name: "Desktop", value: 400 },
  { name: "Mobile", value: 700 },
  { name: "Tablet", value: 300 },
  { name: "Other", value: 100 },
];

const SAMPLE_NOTES = Array.from({ length: 18 }).map((_, i) => ({
  id: String(i + 1),
  message: `Sample notification number ${i + 1}`,
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

/* -------------------- مساعدة صغيرة (helpers) -------------------- */
const formatDateShort = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
};


/* -------------------- مكونات صغيرة متعددة -------------------- */

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

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: "var(--card-bg, #fff)",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 8px 30px rgba(2,6,23,0.06)",
      border: "1px solid rgba(2,6,23,0.05)",
      ...style,
    }}
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
            B
          </div>
          {open && (
            <div>
              <div style={{ fontWeight: 700, color: "var(--text, #0f172a)" }}>{lang === "ar" ? "كتاب.آي" : "Book.AI"}</div>
              <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "لوحة تحكم" : "Dashboard"}</div>
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
          { key: "analytics", label: lang === "ar" ? "التحليلات" : "Analytics", icon: "📊" },
          { key: "users", label: lang === "ar" ? "المستخدمون" : "Users", icon: "👥" },
          { key: "products", label: lang === "ar" ? "المنتجات" : "Products", icon: "🛍️" },
          { key: "settings", label: lang === "ar" ? "الإعدادات" : "Settings", icon: "⚙️" },
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

      <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "center" }}>
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
          }}
        >
          {dark ? <FiSun /> : <FiMoon />} {open && <span>{dark ? (lang === "ar" ? "فاتح" : "Light") : (lang === "ar" ? "داكن" : "Dark")}</span>}
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
          }}
        >
          <FiSettings /> {open && <span>{lang === "ar" ? "English" : "العربية"}</span>}
        </button>
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
}> = ({ user, notificationsCount, onLogout, onMarkAllRead }) => {
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Overview</h2>
        <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>Welcome back</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconButton title="Notifications" badge={notificationsCount} onClick={onMarkAllRead}>
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
            }}
            title="Logout"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
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
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {stats.map((s) => (
          <Card key={s.title}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{s.title}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ marginTop: 8, color: s.change.startsWith("+") ? "#10B981" : "#ef4444", fontWeight: 600 }}>{s.change}</div>
              </div>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Card style={{ minHeight: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "اتجاه المبيعات" : "Sales Trend"}</h3>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>Last 12 months</div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "مصادر الزيارات" : "Traffic Sources"}</h3>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>Distribution</div>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{lang === "ar" ? "الإشعارات" : "Notifications"}</h3>
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
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: n.read ? "rgba(2,6,23,0.02)" : "rgba(124,58,237,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{formatDateShort(n.date)}</div>
                  </div>
                  <div style={{ fontSize: 14 }}>{n.read ? "✓" : "•"}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

/* -------------------- قسم Analytics (placeholder heavy) -------------------- */
const AnalyticsSection: React.FC<{ lang: "ar" | "en" }> = ({ }) => {
  // heavy placeholder content to grow file
  const panels = Array.from({ length: 12 }).map((_, i) => `Metric ${i + 1}`);
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {panels.slice(0, 3).map((p, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{p}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{Math.round(Math.random() * 10000)}</div>
              </div>
              <div style={{ fontSize: 24 }}>{i % 2 ? "📈" : "📉"}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 80, background: "linear-gradient(90deg, rgba(2,6,23,0.03), rgba(2,6,23,0.02))", borderRadius: 8 }} />
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {panels.slice(3, 7).map((p, i) => (
          <Card key={i}>
            <h4 style={{ margin: 0 }}>{p}</h4>
            <div style={{ marginTop: 8, color: "var(--muted,#6b7280)" }}>Detailed breakdown and filters will appear here.</div>
            <div style={{ height: 120, marginTop: 12, borderRadius: 8, background: "#fafafa" }} />
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {panels.slice(7).map((p, i) => (
          <Card key={i}>
            <div style={{ fontWeight: 600 }}>{p}</div>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>Visualization</div>
            <div style={{ height: 60, marginTop: 8, borderRadius: 8, background: "#f3f4f6" }} />
          </Card>
        ))}
      </div>
    </section>
  );
};

/* -------------------- Users / Products / Settings placeholders -------------------- */

const UsersSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  const rows = Array.from({ length: 16 }).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? "admin" : "user",
  }));
  return (
    <section>
      <Card>
        <h3>{lang === "ar" ? "قائمة المستخدمين" : "User list"}</h3>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{r.email}</div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{r.role}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

const ProductsSection: React.FC<{ lang: "ar" | "en" }> = ({ lang }) => {
  const items = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    title: `Product ${i + 1}`,
    price: (Math.random() * 200).toFixed(2),
    stock: Math.floor(Math.random() * 200),
  }));

  return (
    <section>
      <Card>
        <h3>{lang === "ar" ? "المنتجات" : "Products"}</h3>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {items.map((it) => (
            <div key={it.id} style={{ padding: 10, borderRadius: 8, background: "#fff" }}>
              <div style={{ fontWeight: 700 }}>{it.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>${it.price}</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>{it.stock} in stock</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

const SettingsSection: React.FC<{ lang: "ar" | "en"; dark: boolean; toggleDark: () => void }> = ({ lang, dark, toggleDark }) => {
  return (
    <section>
      <Card>
        <h3>{lang === "ar" ? "الإعدادات" : "Settings"}</h3>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{lang === "ar" ? "الوضع الداكن" : "Dark mode"}</div>
              <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "تحكم في المظهر" : "Toggle theme"}</div>
            </div>
            <button onClick={toggleDark} style={{ padding: 8, borderRadius: 8 }}>
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

          <div>
            <div style={{ fontWeight: 700 }}>{lang === "ar" ? "معلومات الحساب" : "Account info"}</div>
            <div style={{ fontSize: 12, color: "var(--muted,#6b7280)" }}>{lang === "ar" ? "تحكم في حسابك" : "Manage your account"}</div>
          </div>
        </div>
      </Card>
    </section>
  );
};

/* -------------------- المكون الرئيسي DashboardClient -------------------- */
export default function DashboardClient({
  user,
  notifications: initialNotifications = SAMPLE_NOTES,
  initialLang = "ar",
  initialDark = false,
}: DashboardClientProps) {
  // state
  const [dark, setDark] = useState<boolean>(initialDark);
  const [lang, setLang] = useState<"ar" | "en">(initialLang);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "users" | "products" | "settings">("overview");
  const [notes, setNotes] = useState<Notification[]>(initialNotifications);

  // effect: apply theme class to root
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dashboard-dark");
      // set CSS vars for dark
      root.style.setProperty("--card-bg", "#0b1220");
      root.style.setProperty("--text", "#e6eef8");
      root.style.setProperty("--muted", "#9ca3af");
      root.style.setProperty("--accent", "#7C3AED");
    } else {
      root.classList.remove("dashboard-dark");
      root.style.setProperty("--card-bg", "#ffffff");
      root.style.setProperty("--text", "#0f172a");
      root.style.setProperty("--muted", "#6b7280");
      root.style.setProperty("--accent", "#7C3AED");
    }
    // persist minimally
    try {
      localStorage.setItem("dashboard:dark", dark ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [dark]);

  // mark all read
  const markAllRead = () => {
    setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // logout
  const logout = () => {
    // clear token cookie and redirect to /login
    try {
      document.cookie = "token=; path=/; max-age=0";
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  // stats
  const stats: StatItem[] = useMemo(
    () => [
      { icon: <FaChartLine />, title: lang === "ar" ? "إجمالي المبيعات" : "Revenue", value: "$12,345", change: "+12%", color: "#7C3AED" },
      { icon: <FaFileAlt />, title: lang === "ar" ? "المستندات" : "Documents", value: "134", change: "+3%", color: "#60A5FA" },
      { icon: <FaUsers />, title: lang === "ar" ? "المستخدمون" : "Users", value: "1,245", change: "+8%", color: "#6EE7B7" },
      { icon: <FaShoppingCart />, title: lang === "ar" ? "الطلبات" : "Orders", value: "326", change: "-2%", color: "#F472B6" },
    ],
    [lang]
  );

  // derived values
  const unreadCount = notes.filter((n) => !n.read).length;

  /* -------------------- render -------------------- */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: dark ? "#071226" : "#f8fafc" }}>
      <div style={{ width: sidebarOpen ? 260 : 78, transition: "width .22s ease" }}>
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((s) => !s)}
          lang={lang}
          onChangeLang={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          active={activeTab}
          setActive={(k) => {
            // typed cast safe
            setActiveTab(k as any);
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header user={user} notificationsCount={unreadCount} onLogout={logout} onMarkAllRead={markAllRead} />

        <main style={{ padding: 18 }}>
          {/* choose active tab */}
          {activeTab === "overview" && (
            <OverviewSection lang={lang} stats={stats} salesData={SAMPLE_SALES} traffic={SAMPLE_TRAFFIC} notifications={notes} dark={dark} />
          )}
          {activeTab === "analytics" && <AnalyticsSection lang={lang} />}
          {activeTab === "users" && <UsersSection lang={lang} />}
          {activeTab === "products" && <ProductsSection lang={lang} />}
          {activeTab === "settings" && <SettingsSection lang={lang} dark={dark} toggleDark={() => setDark((d) => !d)} />}

          {/* filler content to expand file for "large" output */}
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={idx}>
                <h4 style={{ margin: 0 }}>{lang === "ar" ? `لوحة إضافية ${idx + 1}` : `Extra panel ${idx + 1}`}</h4>
                <p style={{ color: "var(--muted,#6b7280)" }}>
                  {lang === "ar"
                    ? "محتوى تجريبي لتعبئة الصفحة — ضع هنا أي واجهة أو مكون ترغب في ربطه ببيانات حقيقية لاحقاً."
                    : "Demo filler content to extend the dashboard. Replace with real components or API-driven widgets."}
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 60, background: "linear-gradient(90deg, rgba(2,6,23,0.02), rgba(2,6,23,0.03))", borderRadius: 8 }} />
                  <div style={{ width: 120, height: 60, background: "#f1f5f9", borderRadius: 8 }} />
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
