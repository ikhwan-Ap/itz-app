import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCircle, Warning, ArrowRight, Receipt } from "@phosphor-icons/react";
import { api } from "@/lib/api";

const TYPE_META = {
  transaction_approved: { icon: CheckCircle, color: "#10b981" },
  transaction_rejected: { icon: Warning, color: "#ef4444" },
  new_transaction: { icon: Receipt, color: "#38BDF8" },
  expiry_warning: { icon: Warning, color: "#f59e0b" },
  default: { icon: Bell, color: "#38BDF8" },
};

function relativeTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}d`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}h`;
  return d.toLocaleDateString("id-ID");
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const nav = useNavigate();

  // Outside click
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Initial fetch + 60s polling
  const fetchData = async () => {
    try {
      const r = await api.get("/notifications");
      setItems(r.data.items || []);
      setUnread(r.data.unread || 0);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, []);

  const markRead = async (n) => {
    try {
      if (!n.read) {
        await api.post(`/notifications/${n.id}/read`);
        setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch (e) {}
    if (n.link) {
      setOpen(false);
      nav(n.link);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api.post("/notifications/read-all");
      setItems((arr) => arr.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-[#16161d] hover:bg-[#1c1c25] text-[#5a5a6a] hover:text-[#a0a0b0] transition-colors"
        data-testid="topbar-notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#ef4444] text-[10px] font-bold text-white flex items-center justify-center"
            data-testid="notif-badge"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[340px] sm:w-[380px] rounded-xl overflow-hidden border border-white/[0.08] z-50"
            style={{ backgroundColor: "#16161d", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
            data-testid="notifications-dropdown"
          >
            <div className="flex items-center justify-between h-12 px-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white">Notifikasi</span>
                {unread > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(56,189,248,0.15)] text-[#38BDF8] border border-[#38BDF8]/30">
                    {unread} baru
                  </span>
                )}
              </div>
              {items.length > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading || unread === 0}
                  className="text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] disabled:opacity-40 transition-colors"
                  data-testid="notif-mark-all-read"
                >
                  Tandai semua
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#5a5a6a]" data-testid="notif-empty">
                  Belum ada notifikasi.
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.default;
                    const Icon = meta.icon;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => markRead(n)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                            n.read ? "hover:bg-white/[0.02]" : "bg-[rgba(56,189,248,0.04)] hover:bg-[rgba(56,189,248,0.08)]"
                          }`}
                          data-testid={`notif-item-${n.id}`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                          >
                            <Icon size={16} weight="duotone" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className={`text-[13px] font-medium truncate ${n.read ? "text-[#a0a0b0]" : "text-white"}`}>
                                {n.title}
                              </div>
                              <span className="text-[10px] text-[#5a5a6a] flex-shrink-0">{relativeTime(n.created_at)}</span>
                            </div>
                            {n.body && (
                              <div className="text-[12px] text-[#5a5a6a] mt-0.5 line-clamp-2">{n.body}</div>
                            )}
                            {n.link && (
                              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#38BDF8]">
                                Buka <ArrowRight size={10} />
                              </div>
                            )}
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#38BDF8] flex-shrink-0 mt-2" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
