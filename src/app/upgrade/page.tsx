
"use client";
import { useState } from "react";

export default function UpgradePage() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0$",
      features: [
        "🔹 10 طلبات شهريًا",
        "🔹 دعم أساسي",
        "🔹 وصول محدود",
        "❌ إعلانات AI",
        "❌ كتب AI",
      ],
      color: "#ccc",
    },
    {
      id: "pro",
      name: "Pro",
      price: "15$/شهريًا",
      features: [
        "✨ 500 طلب شهريًا",
        "✨ دعم على مدار الساعة",
        "✨ جميع الميزات الأساسية",
        "✨ تصدير PDF",
        "✅ إعلانات AI (محدودة)",
        "❌ كتب AI",
      ],
      color: "#0070f3",
    },
    {
      id: "premium",
      name: "Premium",
      price: "30$/شهريًا",
      features: [
        "💎 طلبات غير محدودة",
        "💎 دعم VIP",
        "💎 وصول مبكر للميزات الجديدة",
        "💎 تخصيص كامل",
        "✅ إعلانات AI غير محدودة",
        "✅ كتب AI غير محدودة",
      ],
      color: "#ff9800",
    },
  ];

  const handleUpgrade = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      setMessage("❌ يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setLoading(true);
    setMessage("");
    setProgress(0);

    let fakeProgress = 0;
    const interval = setInterval(() => {
      fakeProgress += 10;
      setProgress(fakeProgress);
      if (fakeProgress >= 100) clearInterval(interval);
    }, 150);

    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");

      setMessage(`✅ ${data.message} - الخطة الحالية: ${data.subscription}`);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>ترقية خطتك</h1>
      <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
        اختر الخطة المناسبة لاحتياجاتك واستمتع بالمميزات الإضافية
      </p>

      {/* خطط الاشتراك */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {plans.map((p) => (
          <div
            key={p.id}
            onClick={() => setPlan(p.id)}
            style={{
              flex: "1 1 250px",
              backgroundColor: "#fff",
              border: plan === p.id ? `3px solid ${p.color}` : "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              cursor: "pointer",
              boxShadow:
                plan === p.id
                  ? "0 4px 15px rgba(0,0,0,0.2)"
                  : "0 2px 5px rgba(0,0,0,0.1)",
              transition: "0.3s",
            }}
          >
            <h2 style={{ color: p.color }}>{p.name}</h2>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{p.price}</p>
            <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
              {p.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* الفورم */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "500px",
          margin: "40px auto",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <label style={{ display: "block", marginBottom: "10px" }}>
          البريد الإلكتروني:
        </label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "5px",
          }}
        />

        <label style={{ display: "block", marginBottom: "10px" }}>
          الخطة المختارة:
        </label>
        <input
          type="text"
          value={plan}
          readOnly
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        />

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "جارٍ الترقية..." : "ترقية الآن"}
        </button>

        {/* شريط التقدم */}
        {loading && (
          <div
            style={{
              marginTop: "20px",
              height: "10px",
              backgroundColor: "#ddd",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#0070f3",
                transition: "width 0.3s",
              }}
            ></div>
          </div>
        )}

        {/* الرسائل */}
        {message && (
          <p
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: message.startsWith("✅")
                ? "#e6ffed"
                : "#ffe6e6",
              color: message.startsWith("✅") ? "#2d7a2d" : "#a00",
              borderRadius: "5px",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* مقارنة المميزات */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          مقارنة المميزات
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "550px",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}></th>
              {plans.map((p) => (
                <th key={p.id} style={thStyle}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              "عدد الطلبات",
              "دعم العملاء",
              "تصدير PDF",
              "وصول مبكر",
              "تخصيص كامل",
              "ميزة إعلانات AI",
              "ميزة كتب AI",
            ].map((feature, i) => (
              <tr key={i}>
                <td style={tdStyle}>{feature}</td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                    }}
                  >
                    {p.features.some((f) =>
                      f.toLowerCase().includes(
                        feature
                          .replace(/ميزة |عدد |AI/g, "")
                          .toLowerCase()
                          .trim()
                      )
                    )
                      ? "✅"
                      : "❌"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px",
  backgroundColor: "#f2f2f2",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px",
};
