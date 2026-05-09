import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Gauge, Target, Crosshair, Warning, CheckCircle, Clock, Package as PkgIcon, Lightning, ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function UserOverview() {
  const { user } = useAuth();
  if (!user) return null;

  const now = new Date();
  const exp = user.expires_at ? new Date(user.expires_at) : null;
  const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : null;
  const clicksLeft = user.max_clicks != null ? Math.max(0, user.max_clicks - (user.clicks_used || 0)) : null;
  const expiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="space-y-6" data-testid="user-dashboard">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Gauge size={14} className="text-[#00A8FF]" weight="fill" />
          <div className="badge badge-gold">DASHBOARD</div>
        </div>
        <h1 className="section-title text-4xl">Selamat Datang, {user.name}</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">Role: <span className="uppercase font-bold text-[#00A8FF] tracking-wider">{user.role}</span></p>
      </div>

      {exp && daysLeft <= 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 border !border-[#E50914]/40 pulse-gold">
          <div className="flex items-center gap-3">
            <Warning size={28} weight="fill" className="text-[#E50914]" />
            <div>
              <div className="font-display font-bold text-lg text-white">Akun Anda Sudah Expired</div>
              <div className="text-sm text-[#A0AAB5]">Silakan hubungi admin untuk perpanjang paket.</div>
            </div>
          </div>
        </motion.div>
      )}
      {expiring && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 border !border-[#F5C300]/40" data-testid="expiry-warning">
          <div className="flex items-center gap-3">
            <Warning size={28} weight="fill" className="text-[#F5C300]" />
            <div>
              <div className="font-display font-bold text-lg text-white">Akun Akan Expired dalam {daysLeft} hari</div>
              <div className="text-sm text-[#A0AAB5]">Perpanjang sekarang agar training tidak terputus.</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Package", value: user.package?.name || "—", sub: user.package?.description || "Belum ada paket aktif", icon: PkgIcon },
          { label: "Expires", value: exp ? `${daysLeft} hari` : "Unlimited", sub: exp ? exp.toLocaleDateString("id-ID") : "Tanpa batas waktu", icon: Clock },
          { label: "Clicks Remaining", value: clicksLeft != null ? clicksLeft : "Unlimited", sub: `${user.clicks_used || 0} dari ${user.max_clicks || "∞"} terpakai`, icon: Lightning },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-solid p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-[#00A8FF] uppercase tracking-widest font-bold">{s.label}</div>
              <s.icon size={18} className="text-[#00A8FF]/70" weight="duotone" />
            </div>
            <div className="font-display font-black text-2xl text-white">{s.value}</div>
            <div className="text-xs text-[#A0AAB5] mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Training modules quick-access */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { to: "/app/training/full", icon: Target, title: "Full Latihan", desc: "Sniper engine multi-prioritas.", badge: "RECOMMENDED", badgeClass: "badge-gold" },
          { to: "/app/training/single", icon: Crosshair, title: "Single Drill", desc: "Pilih 1 drill fokus, target auto-filter.", badge: "FOKUS", badgeClass: "badge-blue" },
        ].map((m, i) => (
          <Link key={i} to={m.to} data-testid={`overview-module-${m.to.split("/").pop()}`}>
            <motion.div whileHover={{ y: -3 }} className="card-glow p-6 relative overflow-hidden h-full group">
              <m.icon size={140} weight="duotone" className="absolute -right-6 -bottom-6 text-[#00A8FF]/10 group-hover:text-[#00A8FF]/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00A8FF] to-[#0077CC] flex items-center justify-center glow-gold">
                    <m.icon size={22} weight="fill" color="#0B0C10" />
                  </div>
                  <span className={`badge ${m.badgeClass}`}>{m.badge}</span>
                </div>
                <div className="font-display font-black text-2xl text-white">{m.title}</div>
                <div className="text-sm text-[#A0AAB5] mt-1">{m.desc}</div>
                <div className="mt-4 text-[#00A8FF] font-bold text-xs uppercase tracking-widest font-display group-hover:gap-3 flex items-center gap-2 transition-all">
                  Buka <ArrowRight size={14} weight="bold" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="card-solid p-6">
        <div className="font-display font-bold text-lg mb-3 text-white">Tips Cepat</div>
        <ul className="space-y-2 text-sm text-[#A0AAB5]">
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#3FCA7C] shrink-0 mt-0.5" /> Prioritas 1 = atribut utama. Prioritas 2/3 dikerjakan setelah prio 1 tercapai tanpa overshoot.</li>
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#3FCA7C] shrink-0 mt-0.5" /> Naikkan "Batas Limit Gelap" hanya jika atribut non-kuncian aman untuk dikorbankan.</li>
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#3FCA7C] shrink-0 mt-0.5" /> Single Drill mode: target otomatis muncul dari atribut drill — tidak perlu menulis manual.</li>
        </ul>
      </div>
    </div>
  );
}
