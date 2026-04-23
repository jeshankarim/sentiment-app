import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FileText, TrendingUp } from "lucide-react";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/history")
      .then((r) => setHistory(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color:"#64748b", fontSize:14 }}>Loading…</div>;

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Analysis History</h2>
      <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>
        All analyses you've run. Click a row to view results.
      </p>

      {history.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:12, padding:40, textAlign:"center",
          boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          <TrendingUp size={40} color="#cbd5e0" style={{ marginBottom:12 }} />
          <div style={{ color:"#64748b", fontSize:14 }}>No analyses yet. Upload a CSV to get started.</div>
        </div>
      ) : (
        <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["File","Date","Total Comments","Positive","Neutral","Negative","Avg Confidence"].map((h) => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b",
                    fontWeight:600, borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id}
                  onClick={() => navigate(`/results/${h.id}`)}
                  style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer",
                    background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  onMouseEnter={(e) => e.currentTarget.style.background="#eff6ff"}
                  onMouseLeave={(e) => e.currentTarget.style.background= i%2===0?"#fff":"#fafafa"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <FileText size={16} color="#94a3b8" />
                      <span style={{ fontWeight:500, color:"#0f172a" }}>{h.filename}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#64748b" }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding:"12px 16px", fontWeight:600, color:"#0f172a" }}>{h.total}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ color:"#10b981", fontWeight:600 }}>{h.sentiment_counts?.positive || 0}</span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ color:"#f59e0b", fontWeight:600 }}>{h.sentiment_counts?.neutral || 0}</span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ color:"#ef4444", fontWeight:600 }}>{h.sentiment_counts?.negative || 0}</span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#64748b" }}>
                    {((h.avg_confidence||0)*100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
