import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import {
  LayoutDashboard, Upload, History, LogOut, Menu, X, BrainCircuit
} from "lucide-react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload",    icon: Upload,          label: "Analyze" },
  { to: "/history",   icon: History,         label: "History" },
];

const S = {
  wrap:    { display:"flex", minHeight:"100vh" },
  sidebar: (open) => ({
    width: open ? 220 : 64,
    background: "#0f172a",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.25s",
    overflow: "hidden",
    flexShrink: 0,
  }),
  logo:    { display:"flex", alignItems:"center", gap:10, padding:"20px 16px 12px", borderBottom:"1px solid #1e293b" },
  logoTxt: { fontWeight:700, fontSize:15, whiteSpace:"nowrap", color:"#38bdf8" },
  nav:     { flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:4 },
  toggle:  { background:"none", border:"none", color:"#94a3b8", cursor:"pointer", padding:"4px 6px", borderRadius:6, lineHeight:0 },
  main:    { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:  { background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" },
  content: { flex:1, padding:24, overflowY:"auto" },
  user:    { display:"flex", alignItems:"center", gap:10 },
  avatar:  { width:34, height:34, borderRadius:"50%", background:"#1a73e8", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 },
  logoutBtn: { background:"none", border:"none", cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center", gap:4, fontSize:13, padding:"6px 8px", borderRadius:6 },
};

function NavItem({ to, icon: Icon, label, open }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 8, textDecoration: "none",
        color: isActive ? "#38bdf8" : "#94a3b8",
        background: isActive ? "#1e293b" : "none",
        fontWeight: isActive ? 600 : 400,
        fontSize: 14, whiteSpace: "nowrap",
        transition: "all 0.15s",
      })}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {open && <span>{label}</span>}
    </NavLink>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={S.wrap}>
      <aside style={S.sidebar(open)}>
        <div style={S.logo}>
          <BrainCircuit size={22} color="#38bdf8" style={{ flexShrink: 0 }} />
          {open && <span style={S.logoTxt}>PolicyAI</span>}
        </div>
        <nav style={S.nav}>
          {NAV.map((n) => <NavItem key={n.to} {...n} open={open} />)}
        </nav>
        <div style={{ padding:"12px 8px", borderTop:"1px solid #1e293b" }}>
          <button style={{ ...S.logoutBtn, color:"#94a3b8", width:"100%" }} onClick={handleLogout}>
            <LogOut size={18} />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div style={S.main}>
        <header style={S.topbar}>
          <button style={S.toggle} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={S.user}>
            <div style={S.avatar}>{(user?.name || "U")[0].toUpperCase()}</div>
            <span style={{ fontSize:14, color:"#475569", fontWeight:500 }}>{user?.name || user?.username}</span>
          </div>
        </header>
        <main style={S.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
