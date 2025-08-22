"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type Subscription = "free" | "pro" | "premium";

interface UserData {
  name?: string;
  email: string;
  avatar?: string;
  settings?: Record<string, any>;
  subscription?: Subscription;
  createdAt?: string;
  lastUpdated?: string;
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // جلب التوكن من الكوكيز أولاً ثم localStorage
  const getAuthToken = () => {
    try {
      // محاولة الحصول على التوكن من الكوكيز أولاً
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (cookieToken) return cookieToken;
    } catch (e) {
      console.error("Error reading cookie:", e);
    }
    
    // إذا لم يوجد في الكوكيز، جرب localStorage
    try {
      const t = localStorage.getItem("token");
      if (t) return t;
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    
    return null;
  };

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAccount() {
    setLoading(true);
    setError("");
    setShowSuccessMessage(null);
    try {
      const token = getAuthToken();
      
      // إذا لم يوجد توكن، توجيه إلى تسجيل الدخول
      if (!token) {
        setError("⚠ لم يتم العثور على التوكن. يرجى تسجيل الدخول.");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      const res = await fetch("/api/account", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError(data.error || "حاجة غلط مع التوكن. هتتحول لتسجيل الدخول.");
          setTimeout(() => router.push("/login"), 1500);
          return;
        }
        throw new Error(data.error || "حدث خطأ أثناء جلب بيانات الحساب.");
      }

      const account = data.account;
      setUser(account);
      setLocalUser(account);
      setPreviewAvatar(account?.avatar || null);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع أثناء تحميل الحساب.");
    } finally {
      setLoading(false);
    }
  }

  function onEditToggle() {
    setEditMode((v) => {
      const next = !v;
      if (next && user) {
        setLocalUser({ ...user });
        setPreviewAvatar(user.avatar || null);
      }
      return next;
    });
    setShowSuccessMessage(null);
    setError("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setLocalUser((prev) => (prev ? { ...prev, [name]: value } : { [name]: value } as unknown as UserData));
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("حجم الصورة كبير جداً. الحد الأقصى 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewAvatar(String(reader.result));
      setLocalUser((prev) => (prev ? { ...prev, avatar: String(reader.result) } : { avatar: String(reader.result) } as UserData));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!localUser) return;
    setSaving(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) {
        setError("⚠ لم يتم العثور على التوكن. يرجى تسجيل الدخول.");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      // تحويل الإعدادات إلى JSON string
      const settingsString = localUser.settings ? JSON.stringify(localUser.settings) : "{}";

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          name: localUser.name,
          avatar: localUser.avatar,
          settings: settingsString, // إرسال الإعدادات كـ JSON string
          subscription: localUser.subscription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError(data.error || "غير مسموح. ربما التوكن منتهي.");
          setTimeout(() => router.push("/login"), 1200);
          return;
        }
        throw new Error(data.error || "حدث خطأ أثناء حفظ التغييرات.");
      }

      setUser(data.account);
      setLocalUser(data.account);
      setPreviewAvatar(data.account?.avatar || null);
      setEditMode(false);
      setShowSuccessMessage("✅ تم حفظ التغييرات بنجاح.");
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ البيانات.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpgrade() {
    router.push("/upgrade");
  }

  async function handleLogout() {
    try {
      try { localStorage.removeItem("token"); } catch (e) { /* ignore */ }
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      // ignore
    } finally {
      router.push("/login");
    }
  }

  function handleRetry() {
    setError("");
    fetchAccount();
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.loading}>⏳ جاري تحميل بيانات الحساب...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.errorTitle}>❌ حدث خطأ</h2>
          <p style={styles.errorText}>{error}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button style={styles.retryButton} onClick={handleRetry}>
              🔄 إعادة المحاولة
            </button>
            <button style={styles.logoutButton} onClick={() => router.push("/login")}>
              🔐 اذهب لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.errorTitle}>⚠ لا توجد بيانات مستخدم</h2>
          <p>تأكد من تسجيل الدخول ثم أعد المحاولة.</p>
          <button style={styles.retryButton} onClick={handleRetry}>🔄 إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.cardLarge}>
        <div style={styles.header}>
          <h1 style={styles.title}>حسابك الشخصي</h1>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.upgradeButtonSmall} onClick={handleUpgrade}>
              🚀 ترقية الخطة
            </button>
            <button style={styles.logoutButtonSmall} onClick={handleLogout}>
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>

        <div style={styles.columns}>
          <div style={styles.leftCol}>
            <div style={styles.avatarWrap}>
              <img
                src={previewAvatar || "/default-avatar.png"}
                alt="avatar"
                style={styles.avatar}
              />
              {editMode ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ marginTop: 10 }}
                  />
                  <small style={{ color: "#666" }}>يمكنك رفع صورة جديدة (الحد الأقصى 2MB)</small>
                </>
              ) : null}
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: 0 }}>📧 البريد الإلكتروني</h3>
              <p style={{ marginTop: 6 }}>{user.email}</p>

              <h3 style={{ marginTop: 14 }}>📅 تـاريخ الإنشاء</h3>
              <p style={{ marginTop: 6 }}>{user.createdAt ? new Date(user.createdAt).toLocaleString("ar-EG") : "-"}</p>

              <h3 style={{ marginTop: 14 }}>🕒 آخر تحديث</h3>
              <p style={{ marginTop: 6 }}>{user.lastUpdated ? new Date(user.lastUpdated).toLocaleString("ar-EG") : "-"}</p>
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.infoCard}>
              <label style={styles.label}>الاسم</label>
              {editMode ? (
                <input
                  name="name"
                  value={localUser?.name || ""}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="اكتب اسمك"
                />
              ) : (
                <p style={styles.fieldValue}>{user.name || "-"}</p>
              )}
            </div>

            <div style={styles.infoCard}>
              <label style={styles.label}>الباقة الحالية</label>
              {editMode ? (
                <select
                  name="subscription"
                  value={localUser?.subscription || "free"}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              ) : (
                <div style={styles.planBadge(user.subscription || "free")}>
                  {(user.subscription || "free").toUpperCase()}
                </div>
              )}
            </div>

            <div style={styles.infoCard}>
              <label style={styles.label}>الإعدادات (JSON)</label>
              {editMode ? (
                <textarea
                  name="settings"
                  value={localUser?.settings ? JSON.stringify(localUser.settings, null, 2) : "{}"}
                  onChange={(e) => {
                    const raw = e.target.value;
                    try {
                      const parsed = JSON.parse(raw);
                      setLocalUser((prev) => (prev ? { ...prev, settings: parsed } : { settings: parsed } as UserData));
                    } catch {
                      setLocalUser((prev) => (prev ? { ...prev, settings: { raw } } : { settings: { raw } } as unknown as UserData));
                    }
                  }}
                  style={{ ...styles.textarea, minHeight: 120 }}
                />
              ) : (
                <pre style={styles.pre}>
                  {user.settings ? JSON.stringify(user.settings, null, 2) : "{}"}
                </pre>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center" }}>
              {editMode ? (
                <>
                  <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
                    {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التغييرات"}
                  </button>
                  <button
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditMode(false);
                      setLocalUser(user);
                      setPreviewAvatar(user.avatar || null);
                      setError("");
                    }}
                    disabled={saving}
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <>
                  <button style={styles.editButton} onClick={onEditToggle}>✏️ تعديل</button>
                  <button style={styles.upgradeButton} onClick={handleUpgrade}>🚀 ترقية الخطة</button>
                </>
              )}

              {showSuccessMessage && <div style={styles.successMessage}>{showSuccessMessage}</div>}
            </div>
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button style={styles.logoutButton} onClick={handleLogout}>🚪 تسجيل الخروج</button>

          <div style={{ color: "#666", fontSize: 13 }}>
            إذا أردت حذف الحساب تواصل مع الدعم — هذا مجرد مثال عرضي.
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------- Styles --------------------- */
const styles: any = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    padding: 24,
    background: "#f5f7fb",
    fontFamily: "Inter, Arial, sans-serif",
  },
  cardLarge: {
    width: "100%",
    maxWidth: 1100,
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 8px 30px rgba(13,38,76,0.08)",
  },
  card: {
    width: 520,
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 8px 30px rgba(13,38,76,0.06)",
    textAlign: "center" as const,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, fontSize: 24 },
  columns: { display: "flex", gap: 22, marginTop: 18 },
  leftCol: { width: 320 },
  rightCol: { flex: 1 },
  avatarWrap: { display: "flex", flexDirection: "column" as const, alignItems: "center" as const },
  avatar: { width: 160, height: 160, objectFit: "cover" as const, borderRadius: 12, border: "1px solid #eee" },
  infoCard: { marginBottom: 14 },
  label: { display: "block", marginBottom: 8, color: "#444", fontWeight: 600 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", outline: "none" },
  select: { width: 180, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" },
  textarea: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", fontFamily: "monospace" },
  pre: { background: "#fafafa", padding: 12, borderRadius: 8, fontSize: 13, overflowX: "auto" },
  planBadge: (plan: Subscription) => ({
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 8,
    color: "#fff",
    background: plan === "premium" ? "#e91e63" : plan === "pro" ? "#3f51b5" : "#9e9e9e",
    fontWeight: 700,
    fontSize: 13,
  }),
  editButton: { padding: "10px 14px", borderRadius: 8, border: "1px solid #1976d2", background: "#fff", color: "#1976d2", cursor: "pointer" },
  upgradeButton: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" },
  upgradeButtonSmall: { padding: "8px 10px", borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" },
  logoutButton: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#f44336", color: "#fff", cursor: "pointer" },
  logoutButtonSmall: { padding: "8px 10px", borderRadius: 8, border: "none", background: "#f44336", color: "#fff", cursor: "pointer" },
  saveButton: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#1976d2", color: "#fff", cursor: "pointer" },
  cancelButton: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  retryButton: { padding: "10px 12px", borderRadius: 8, border: "1px solid #1976d2", background: "#fff", color: "#1976d2", cursor: "pointer" },
  errorTitle: { color: "#d32f2f", margin: 0 },
  errorText: { color: "#333", marginTop: 8 },
  errorBox: { background: "#ffe5e5", padding: 16, borderRadius: 8 },
  successMessage: { color: "#2e7d32", fontWeight: 700 },
  divider: { border: "none", borderTop: "1px solid #eee", margin: "18px 0" },
  fieldValue: { margin: 0, padding: "8px 0" },
  loading: { color: "#666", margin: 0 }
};