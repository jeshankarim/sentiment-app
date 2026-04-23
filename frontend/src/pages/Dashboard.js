import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  BarChart2, FileText, AlertTriangle, TrendingUp, Upload, History
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background:"#fff", borderRadius:12, padding:"20px 24px",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08)", display:"flex", alignItems:"center", gap:16,
    }}>
      <div style={{ width:48, height:48, borderRadius:12, background:color+"1a",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize:26, fontWeight:700, color:"#0f172a" }}>{value}</div>
        <div style={{ fontSize:13, color:"#64748b" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/history").then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  const total    = history.reduce((a, h) => a + (h.total || 0), 0);
  const analyses = history.length;
  const flagged  = history.reduce((a, h) => {
    const neg = h.sentiment_counts?.negative || 0;
    return a + Math.round(neg * 0.3);
  }, 0);
  const avgConf = history.length
    ? (history.reduce((a, h) => a + (h.avg_confidence || 0), 0) / history.length * 100).toFixed(1)
    : "—";

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Dashboard</h2>
      <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>
        Overview of your sentiment analysis activity
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:32 }}>
        <StatCard icon={FileText}     label="Total Comments"   value={total}      color="#1a73e8" sub="across all analyses" />
        <StatCard icon={BarChart2}    label="Analyses Run"     value={analyses}   color="#10b981" />
        <StatCard icon={AlertTriangle} label="Flagged Reviews" value={flagged}   color="#ef4444" sub="est. high-concern" />
        <StatCard icon={TrendingUp}   label="Avg Confidence"   value={avgConf === "—" ? "—" : avgConf+"%"} color="#f59e0b" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Quick actions */}
        <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize:16, fontWeight:600, marginBottom:16, color:"#0f172a" }}>Quick Actions</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <ActionBtn icon={Upload}  label="Upload & Analyze CSV"   color="#1a73e8" onClick={() => navigate("/upload")} />
            <ActionBtn icon={History} label="View Analysis History"  color="#10b981" onClick={() => navigate("/history")} />
          </div>
        </div>

        {/* Recent analyses */}
        <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize:16, fontWeight:600, marginBottom:16, color:"#0f172a" }}>Recent Analyses</h3>
          {history.length === 0 && (
            <p style={{ color:"#94a3b8", fontSize:13 }}>No analyses yet. Upload a CSV to get started.</p>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {history.slice(0, 4).map((h) => (
              <div key={h.id}
                onClick={() => navigate(`/results/${h.id}`)}
                style={{
                  padding:"10px 14px", borderRadius:8, background:"#f8fafc",
                  cursor:"pointer", border:"1px solid #e2e8f0",
                  transition:"background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background="#eff6ff"}
                onMouseLeave={(e) => e.currentTarget.style.background="#f8fafc"}
              >
                <div style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{h.filename}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                  {h.total} comments · {new Date(h.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
      borderRadius:8, border:`1.5px solid ${color}20`, background:`${color}08`,
      color, fontWeight:500, fontSize:14, cursor:"pointer", textAlign:"left",
      transition:"background 0.15s",
    }}
    onMouseEnter={(e) => e.currentTarget.style.background=`${color}18`}
    onMouseLeave={(e) => e.currentTarget.style.background=`${color}08`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}
