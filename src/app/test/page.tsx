"use client";

import { useState } from "react";

type ApiMethod = "GET" | "POST";

export default function TestPage() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<ApiMethod>("GET");
  const [postData, setPostData] = useState<string>('{"key": "value"}');
  const [apiPath, setApiPath] = useState("/api/test");

  const handleTestApi = async () => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      let res;
      if (method === "GET") {
        res = await fetch(apiPath);
      } else {
        // POST
        let parsedBody = {};
        try {
          parsedBody = JSON.parse(postData);
        } catch {
          setError("تنسيق JSON غير صحيح في بيانات POST");
          setLoading(false);
          return;
        }

        res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedBody),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ في الاستجابة");
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError("تعذر الاتصال بالـ API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "30px auto",
        fontFamily: "Arial, sans-serif",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 12,
        backgroundColor: "#fafafa",
        boxShadow: "0 0 10px rgba(0,0,0,0.05)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>صفحة اختبار API</h1>

      <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
        مسار الـ API:
      </label>
      <input
        type="text"
        value={apiPath}
        onChange={(e) => setApiPath(e.target.value)}
        placeholder="/api/test"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginBottom: 20,
          fontSize: 16,
        }}
      />

      <label style={{ fontWeight: "bold" }}>اختر نوع الطلب:</label>
      <div style={{ marginBottom: 20, display: "flex", gap: 20 }}>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            checked={method === "GET"}
            onChange={() => setMethod("GET")}
            style={{ marginRight: 6 }}
          />
          GET
        </label>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            checked={method === "POST"}
            onChange={() => setMethod("POST")}
            style={{ marginRight: 6 }}
          />
          POST
        </label>
      </div>

      {method === "POST" && (
        <>
          <label style={{ fontWeight: "bold" }}>بيانات الـ POST (JSON):</label>
          <textarea
            value={postData}
            onChange={(e) => setPostData(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontFamily: "monospace",
              fontSize: 14,
              marginBottom: 20,
              resize: "vertical",
            }}
          />
        </>
      )}

      <button
        onClick={handleTestApi}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          backgroundColor: loading ? "#999" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease",
          marginBottom: 20,
        }}
      >
        {loading ? "جاري الاتصال بالـ API..." : "اختبر الـ API الآن"}
      </button>

      {error && (
        <div
          style={{
            marginBottom: 20,
            color: "white",
            backgroundColor: "#d9534f",
            padding: 12,
            borderRadius: 6,
          }}
        >
          ❌ {error}
        </div>
      )}

      {response && (
        <>
          <label style={{ fontWeight: "bold" }}>الاستجابة:</label>
          <pre
            style={{
              backgroundColor: "#272822",
              color: "#f8f8f2",
              padding: 16,
              borderRadius: 6,
              fontSize: 14,
              whiteSpace: "pre-wrap",
              maxHeight: 300,
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            {response}
          </pre>
        </>
      )}
    </div>
  );
}