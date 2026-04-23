import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { BrainCircuit, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm]     = useState({ username: "admin", password: "admin123" });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        background:"#fff", borderRadius:16, padding:"40px 36px", width:"100%", maxWidth:400,
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:56, height:56, borderRadius:14, background:"#eff6ff", marginBottom:12 }}>
            <BrainCircuit size={28} color="#1a73e8" />
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a" }}>PolicyAI</h1>
          <p style={{ color:"#64748b", fontSize:13, marginTop:4 }}>Sentiment Analysis System</p>
        </div>

        <form onSubmit={submit}>
          <label style={lbl}>Username</label>
          <input
            style={inp}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
          />

          <label style={{ ...lbl, marginTop:14 }}>Password</label>
          <div style={{ position:"relative" }}>
            <input
              style={{ ...inp, paddingRight:40 }}
              type={show ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShow(!show)}
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer", color:"#94a3b8" }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%", marginTop:24, padding:"12px 0", borderRadius:8,
              background: loading ? "#93c5fd" : "#1a73e8",
              color:"#fff", fontWeight:600, fontSize:15, border:"none",
              cursor: loading ? "not-allowed" : "pointer",
              transition:"background 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:"#94a3b8" }}>
          Default: admin / admin123
        </p>
      </div>
    </div>
  );
}

const lbl = { display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 };
const inp = {
  width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0",
  fontSize:14, outline:"none", color:"#0f172a", transition:"border 0.15s",
};
