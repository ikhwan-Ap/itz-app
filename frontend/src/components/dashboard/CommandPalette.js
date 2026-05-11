import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlass, ArrowRight, Users, Ticket, ChartBar, Crown, Crosshair, Gauge, Package as PkgIcon, Newspaper, CalendarDots, CreditCard, Briefcase, SignOut, Target } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ALL_NAV_TARGETS = [
  { label: "Dashboard", path: "/app", icon: Gauge, roles: ["user", "admin", "superadmin", "marketing"] },
  { label: "Tactical Sniper Hub", path: "/app/training", icon: Crosshair, roles: ["user", "admin", "superadmin"] },
  { label: "Full Latihan", path: "/app/training/full", icon: Target, roles: ["user", "admin", "superadmin"] },
  { label: "Single Drill", path: "/app/training/single", icon: Crosshair, roles: ["user", "admin", "superadmin"] },
  { label: "GK Latihan", path: "/app/training/gk", icon: Target, roles: ["user", "admin", "superadmin"] },
  { label: "Admin Overview", path: "/app/admin", icon: Crown, roles: ["admin", "superadmin"] },
  { label: "Users Management", path: "/app/admin/users", icon: Users, roles: ["admin", "superadmin"] },
  { label: "Packages", path: "/app/admin/packages", icon: PkgIcon, roles: ["admin", "superadmin"] },
  { label: "Promo Codes", path: "/app/admin/promos", icon: Ticket, roles: ["admin", "superadmin", "marketing"] },
  { label: "Transactions", path: "/app/admin/transactions", icon: ChartBar, roles: ["admin", "superadmin"] },
  { label: "News CMS", path: "/app/admin/news", icon: Newspaper, roles: ["admin", "superadmin"] },
  { label: "Events CMS", path: "/app/admin/events", icon: CalendarDots, roles: ["admin", "superadmin"] },
  { label: "Payment Config", path: "/app/admin/payment", icon: CreditCard, roles: ["superadmin"] },
  { label: "Marketing Dashboard", path: "/app/marketing", icon: Briefcase, roles: ["marketing", "admin", "superadmin"] },
];

export default function CommandPalette({ open, onClose }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role;
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Lazy-load users for admin search
  useEffect(() => {
    if (!open || !["admin", "superadmin"].includes(role)) return;
    api.get("/users").then((r) => setUsers(r.data || [])).catch(() => {});
  }, [open, role]);

  const navItems = useMemo(
    () => ALL_NAV_TARGETS.filter((it) => it.roles.includes(role)),
    [role]
  );

  const filteredNav = useMemo(() => {
    if (!q.trim()) return navItems;
    const ql = q.toLowerCase();
    return navItems.filter((it) => it.label.toLowerCase().includes(ql));
  }, [q, navItems]);

  const filteredUsers = useMemo(() => {
    if (!q.trim() || !["admin", "superadmin"].includes(role)) return [];
    const ql = q.toLowerCase();
    return users
      .filter((u) => (u.name || "").toLowerCase().includes(ql) || (u.email || "").toLowerCase().includes(ql))
      .slice(0, 5);
  }, [q, users, role]);

  // Quick actions (always shown)
  const quickActions = useMemo(() => {
    const out = [
      { label: "Logout", icon: SignOut, danger: true, onClick: async () => { await logout(); nav("/login"); } },
    ];
    if (q.trim()) {
      const ql = q.toLowerCase();
      return out.filter((a) => a.label.toLowerCase().includes(ql));
    }
    return out;
  }, [q, logout, nav]);

  // Flatten for keyboard navigation
  const flatList = useMemo(() => {
    const r = [];
    filteredNav.forEach((it) => r.push({ kind: "nav", ...it }));
    filteredUsers.forEach((u) => r.push({ kind: "user", ...u }));
    quickActions.forEach((a) => r.push({ kind: "action", ...a }));
    return r;
  }, [filteredNav, filteredUsers, quickActions]);

  useEffect(() => { setActiveIdx(0); }, [q, flatList.length]);

  const runItem = (item) => {
    if (!item) return;
    if (item.kind === "nav") nav(item.path);
    else if (item.kind === "user") nav("/app/admin/users");
    else if (item.kind === "action") item.onClick?.();
    onClose();
  };

  const onKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(flatList.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); runItem(flatList[activeIdx]); }
  };

  let cursor = 0;
  const renderRow = (item, sectionLabel, key) => {
    const myIdx = cursor++;
    const active = myIdx === activeIdx;
    const Icon = item.icon || (item.kind === "user" ? Users : ArrowRight);
    return (
      <button
        key={key}
        onClick={() => runItem({ ...item, _idx: myIdx })}
        onMouseEnter={() => setActiveIdx(myIdx)}
        className={`flex w-full items-center gap-3 px-3 h-11 rounded-lg text-left transition-colors ${
          active ? "bg-[#1c1c25]" : "hover:bg-[#1c1c25]/60"
        }`}
        data-testid={`palette-item-${myIdx}`}
      >
        <Icon size={16} weight="duotone" className={item.danger ? "text-[#ef4444]" : "text-[#38BDF8]"} />
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-medium truncate ${item.danger ? "text-[#ef4444]" : "text-white"}`}>
            {item.kind === "user" ? item.name || item.email : item.label}
          </div>
          {item.kind === "user" && (
            <div className="text-[11px] text-[#5a5a6a] truncate">{item.email} · {item.role}</div>
          )}
          {item.kind === "nav" && (
            <div className="text-[11px] text-[#5a5a6a] truncate">{item.path}</div>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#5a5a6a]">{sectionLabel}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[2000] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm"
          data-testid="command-palette-overlay"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[640px] rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{ backgroundColor: "#16161d", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
            data-testid="command-palette"
          >
            <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
              <MagnifyingGlass size={18} className="text-[#5a5a6a]" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Cari halaman, user, action..."
                className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-[#5a5a6a]"
                data-testid="palette-input"
              />
              <kbd className="hidden sm:inline-flex items-center justify-center h-6 px-2 rounded text-[10px] font-mono bg-[#0f0f14] text-[#5a5a6a] border border-white/[0.06]">ESC</kbd>
            </div>
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filteredNav.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#5a5a6a]">Navigation</div>
                  {filteredNav.map((it) => renderRow({ kind: "nav", ...it }, "GO", it.path))}
                </>
              )}
              {filteredUsers.length > 0 && (
                <>
                  <div className="px-3 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#5a5a6a]">Users</div>
                  {filteredUsers.map((u) => renderRow({ kind: "user", ...u }, "VIEW", u.id))}
                </>
              )}
              {quickActions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#5a5a6a]">Actions</div>
                  {quickActions.map((a, i) => renderRow({ kind: "action", ...a }, "RUN", `act-${i}`))}
                </>
              )}
              {flatList.length === 0 && (
                <div className="py-12 text-center text-sm text-[#5a5a6a]" data-testid="palette-empty">
                  Tidak ada hasil untuk "{q}"
                </div>
              )}
            </div>
            <div className="px-4 h-9 flex items-center justify-between border-t border-white/[0.06] text-[11px] text-[#5a5a6a]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1.5 h-4 inline-flex items-center bg-[#0f0f14] border border-white/[0.06] rounded text-[10px]">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 h-4 inline-flex items-center bg-[#0f0f14] border border-white/[0.06] rounded text-[10px]">↵</kbd> select</span>
              </div>
              <span>{flatList.length} hasil</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
