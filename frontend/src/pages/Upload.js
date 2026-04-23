import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Upload as UploadIcon, FileText, ChevronDown, Loader2 } from "lucide-react";

export default function Upload() {
  const [file, setFile]         = useState(null);
  const [columns, setColumns]   = useState([]);
  const [column, setColumn]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  const handleFile = async (f) => {
    if (!f || !f.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFile(f);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await api.post("/api/columns", fd);
      setColumns(r.data.columns);
      setColumn(r.data.columns[0] || "");
    } catch {
      toast.error("Could not read CSV columns");
    }
  };

  const submit = async () => {
    if (!file) { toast.error("Please select a file first"); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("column", column);
    try {
      const r = await api.post("/api/analyze", fd, { timeout: 300_000 });
      toast.success("Analysis complete!");
      navigate(`/results/${r.data.analysis_id}`, { state: r.data });
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Analyze Feedback</h2>
      <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>
        Upload a CSV file containing public comments. The AI will classify each comment and generate insights.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current.click()}
        style={{
          border:`2px dashed ${dragging ? "#1a73e8" : "#cbd5e0"}`,
          borderRadius:12, padding:"40px 24px", textAlign:"center",
          cursor:"pointer", background: dragging ? "#eff6ff" : "#f8fafc",
          transition:"all 0.2s", marginBottom:20,
        }}
      >
        <input ref={inputRef} type="file" accept=".csv" style={{ display:"none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
        <UploadIcon size={36} color="#94a3b8" style={{ marginBottom:10 }} />
        {file ? (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"#1a73e8", fontWeight:600 }}>
              <FileText size={18} /> {file.name}
            </div>
            <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>
              {(file.size / 1024).toFixed(1)} KB — click to change
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight:600, color:"#374151", marginBottom:4 }}>
              Drop your CSV here, or click to browse
            </div>
            <div style={{ fontSize:13, color:"#94a3b8" }}>
              Supports: public comments, policy feedback, survey responses
            </div>
          </>
        )}
      </div>

      {/* Column selector */}
      {columns.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>
            Select comment column
          </label>
          <div style={{ position:"relative" }}>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              style={{
                width:"100%", padding:"10px 36px 10px 12px", borderRadius:8,
                border:"1.5px solid #e2e8f0", fontSize:14, background:"#fff",
                appearance:"none", color:"#0f172a", cursor:"pointer",
              }}
            >
              {columns.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} color="#94a3b8" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
          </div>
        </div>
      )}

      {/* Tip box */}
      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"12px 16px", marginBottom:24, fontSize:13, color:"#1e40af" }}>
        <strong>CSV Format Tip:</strong> Your CSV should have a column with the comment/feedback text.
        Column names like <em>comment</em>, <em>feedback</em>, or <em>text</em> are auto-detected. Max 500 rows per analysis.
      </div>

      <button
        onClick={submit}
        disabled={loading || !file}
        style={{
          padding:"13px 32px", borderRadius:8, border:"none",
          background: (loading || !file) ? "#93c5fd" : "#1a73e8",
          color:"#fff", fontWeight:600, fontSize:15,
          cursor: (loading || !file) ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", gap:8,
        }}
      >
        {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> Analyzing…</> : <><UploadIcon size={18} /> Run Analysis</>}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
