import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Download, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const COLORS = { positive:"#10b981", neutral:"#f59e0b", negative:"#ef4444" };
const PIE_COLORS = ["#10b981","#f59e0b","#ef4444"];

export default function Results() {
  const { id }       = useParams();
  const { state }    = useLocation();
  const [data, setData] = useState(state || null);
  const [showFlagged, setShowFlagged] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) {
      // Try to fetch from history (limited info), prompt re-analysis
      toast("Results not cached. Please re-run the analysis.", { icon:"ℹ️" });
      navigate("/upload");
    }
  }, [data, navigate]);

  if (!data) return null;

  const sentimentPie = Object.entries(data.sentiment_counts || {}).map(([name, value]) => ({ name, value }));

  // Pivot topic_sentiment into chart-friendly shape
  const topicMap = {};
  (data.topic_sentiment || []).forEach(({ topic, sentiment, count }) => {
    if (!topicMap[topic]) topicMap[topic] = { topic, positive:0, neutral:0, negative:0 };
    topicMap[topic][sentiment] = count;
  });
  const topicData = Object.values(topicMap);

  const exportFile = async (type) => {
    try {
      const r = await api.get(`/api/export/${type}/${id}`, { responseType:"blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a   = document.createElement("a");
      a.href = url; a.download = `${id}.${type}`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} downloaded`);
    } catch { toast.error("Export failed"); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <button onClick={() => navigate("/upload")}
          style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8,
            padding:"6px 12px", cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center", gap:4, fontSize:13 }}>
          <ArrowLeft size={14} /> New Analysis
        </button>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#0f172a" }}>Analysis Results</h2>
      </div>

      {/* Summary strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Comments",  value: data.total },
          { label:"Positive",        value: data.sentiment_counts?.positive || 0,  color:"#10b981" },
          { label:"Neutral",         value: data.sentiment_counts?.neutral  || 0,  color:"#f59e0b" },
          { label:"Negative",        value: data.sentiment_counts?.negative || 0,  color:"#ef4444" },
          { label:"Flagged",         value: data.flagged_count || 0,               color:"#ef4444" },
          { label:"Avg Confidence",  value: ((data.avg_confidence||0)*100).toFixed(1)+"%" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:"#fff", borderRadius:10, padding:"14px 16px",
            boxShadow:"0 1px 3px rgba(0,0,0,0.07)", borderLeft:`3px solid ${color||"#e2e8f0"}` }}>
            <div style={{ fontSize:22, fontWeight:700, color: color||"#0f172a" }}>{value}</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16, marginBottom:24 }}>
        <div style={card}>
          <h3 style={cardTitle}>Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {sentimentPie.map((e, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Sentiment by Topic</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topicData} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="topic" tick={{ fontSize:12 }} />
              <YAxis tick={{ fontSize:12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="neutral"  fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="negative" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summaries */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
        {["positive","neutral","negative"].map((s) => (
          <div key={s} style={{ ...card, borderTop:`3px solid ${COLORS[s]}` }}>
            <div style={{ fontSize:12, fontWeight:600, color:COLORS[s], textTransform:"uppercase", marginBottom:6 }}>
              {s} Summary
            </div>
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>
              {data.summaries?.[s] || "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Flagged comments */}
      {(data.flagged_comments?.length > 0) && (
        <div style={{ ...card, marginBottom:24 }}>
          <button onClick={() => setShowFlagged(!showFlagged)}
            style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none",
              cursor:"pointer", color:"#ef4444", fontWeight:600, fontSize:14, padding:0 }}>
            <AlertTriangle size={16} />
            {data.flagged_count} Flagged High-Concern Comments
            {showFlagged ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showFlagged && (
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
              {data.flagged_comments.map((c, i) => (
                <div key={i} style={{ padding:"10px 14px", background:"#fef2f2", borderRadius:8,
                  border:"1px solid #fecaca", fontSize:13, color:"#7f1d1d" }}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sample table */}
      <div style={{ ...card, marginBottom:24 }}>
        <h3 style={cardTitle}>Sample Results (first 20)</h3>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Comment","Sentiment","Confidence","Topic","Flagged"].map((h) => (
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"#64748b",
                    fontWeight:600, borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.sample_results || []).map((r, i) => (
                <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                  onMouseEnter={(e) => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"9px 12px", maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={r.comment}>{r.comment}</td>
                  <td style={{ padding:"9px 12px" }}>
                    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600,
                      background:COLORS[r.sentiment]+"20", color:COLORS[r.sentiment] }}>
                      {r.sentiment}
                    </span>
                  </td>
                  <td style={{ padding:"9px 12px", color:"#374151" }}>{(r.confidence*100).toFixed(1)}%</td>
                  <td style={{ padding:"9px 12px", color:"#374151", textTransform:"capitalize" }}>{r.topic}</td>
                  <td style={{ padding:"9px 12px" }}>{r.flagged ? "🚩" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export buttons */}
      <div style={{ display:"flex", gap:12 }}>
        <ExportBtn label="Export CSV" color="#1a73e8" onClick={() => exportFile("csv")} />
        <ExportBtn label="Export PDF Report" color="#10b981" onClick={() => exportFile("pdf")} />
      </div>
    </div>
  );
}

function ExportBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:6, padding:"10px 20px",
      borderRadius:8, border:`1.5px solid ${color}`, background:`${color}10`,
      color, fontWeight:600, fontSize:13, cursor:"pointer", transition:"background 0.15s",
    }}
    onMouseEnter={(e) => e.currentTarget.style.background=`${color}20`}
    onMouseLeave={(e) => e.currentTarget.style.background=`${color}10`}
    >
      <Download size={15} /> {label}
    </button>
  );
}

const card      = { background:"#fff", borderRadius:12, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" };
const cardTitle = { fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:14 };
