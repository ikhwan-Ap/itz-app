import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Target, Crosshair, Warning, CheckCircle, Clock, Package as PkgIcon,
  Lightning, ArrowRight, Flame, Shield, Barbell,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";

export default function UserOverview() {
  const { user } = useAuth();
  if (!user) return null;

  const now = new Date();
  const exp = user.expires_at ? new Date(user.expires_at) : null;
  const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : null;
  const clicksLeft = user.max_clicks != null ? Math.max(0, user.max_clicks - (user.clicks_used || 0)) : null;
  const expiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  const clicksProgress = user.max_clicks != null
    ? Math.min(100, ((user.clicks_used || 0) / Math.max(1, user.max_clicks)) * 100)
    : null;
  const expiryProgress = exp && daysLeft != null
    ? Math.max(0, Math.min(100, (daysLeft / 30) * 100))
    : null;

  return (
    <div className="space-y-6" data-testid="user-dashboard">
      <WelcomeBanner
        userName={user.name}
        actions={[
          { to: "/app/training/full", label: "Training Baru", icon: Crosshair, primary: true },
          { to: "/app/training/single", label: "Single Drill", icon: Target },
          { to: "/app/training", label: "Hub Latihan", icon: Barbell },
        ]}
      />

      {/* Expiry alerts */}
      {exp && daysLeft <= 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#16161d] border border-[#ef4444]/40 rounded-xl p-5 flex items-center gap-3"
          data-testid="expiry-expired"
        >
          <Warning size={28} weight="fill" className="text-[#ef4444] flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-base text-white">Akun Anda Sudah Expired</div>
            <div className="text-sm text-[#a0a0b0]">Silakan hubungi admin untuk perpanjang paket.</div>
          </div>
        </motion.div>
      )}
      {expiring && (
        <motion.div
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#16161d] border border-[#f59e0b]/40 rounded-xl p-5 flex items-center gap-3"
          data-testid="expiry-warning"
        >
          <Warning size={28} weight="fill" className="text-[#f59e0b] flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-base text-white">Akun akan expired dalam {daysLeft} hari</div>
            <div className="text-sm text-[#a0a0b0]">Perpanjang sekarang agar training tidak terputus.</div>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={PkgIcon}
          iconColor="#00A8FF"
          label="Package"
          value={user.package?.name || "—"}
          subtext={user.package?.description || "Belum ada paket aktif"}
          delay={0.05}
          testId="stat-package"
        />
        <StatCard
          icon={Clock}
          iconColor="#f59e0b"
          label="Expires"
          value={exp ? `${daysLeft} hari` : "Unlimited"}
          subtext={exp ? exp.toLocaleDateString("id-ID") : "Tanpa batas waktu"}
          progress={expiryProgress}
          progressColor={daysLeft != null && daysLeft <= 7 ? "#ef4444" : "#f59e0b"}
          delay={0.1}
          testId="stat-expires"
        />
        <StatCard
          icon={Lightning}
          iconColor="#10b981"
          label="Clicks Remaining"
          value={clicksLeft != null ? clicksLeft : "Unlimited"}
          subtext={`${user.clicks_used || 0} dari ${user.max_clicks || "∞"} terpakai`}
          progress={clicksProgress}
          progressColor="#10b981"
          delay={0.15}
          testId="stat-clicks"
        />
      </div>

      {/* Training modules — quick access (kept like original since user said tactical sniper bagus) */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { to: "/app/training/full", icon: Target, title: "Full Latihan", desc: "Sniper engine multi-prioritas.", badge: "RECOMMENDED" },
          { to: "/app/training/single", icon: Crosshair, title: "Single Drill", desc: "Pilih 1 drill fokus, target auto-filter.", badge: "FOKUS" },
        ].map((m, i) => (
          <Link key={i} to={m.to} data-testid={`overview-module-${m.to.split("/").pop()}`}>
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-[#16161d] border border-white/[0.06] rounded-xl p-6 relative overflow-hidden h-full group hover:border-[rgba(0,168,255,0.4)] hover:shadow-[0_0_24px_rgba(0,168,255,0.12)] transition-all duration-200"
            >
              <m.icon size={140} weight="duotone" className="absolute -right-6 -bottom-6 text-[#00A8FF]/[0.08] group-hover:text-[#00A8FF]/[0.18] transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #00A8FF, #0077CC)" }}
                  >
                    <m.icon size={20} weight="fill" color="#fff" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[rgba(0,168,255,0.15)] text-[#00A8FF] border border-[rgba(0,168,255,0.35)]">
                    {m.badge}
                  </span>
                </div>
                <div className="font-bold text-xl sm:text-2xl text-white">{m.title}</div>
                <div className="text-sm text-[#a0a0b0] mt-1">{m.desc}</div>
                <div className="mt-4 text-[#00A8FF] font-semibold text-xs uppercase tracking-widest group-hover:gap-3 flex items-center gap-2 transition-all">
                  Buka <ArrowRight size={14} weight="bold" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} weight="duotone" className="text-[#10b981]" />
          <h3 className="text-base font-semibold text-white">Tips Cepat</h3>
        </div>
        <ul className="space-y-3 text-sm text-[#a0a0b0]">
          <li className="flex gap-3">
            <CheckCircle size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" weight="fill" />
            <span>Prioritas 1 = atribut utama. Prioritas 2/3 dikerjakan setelah prio 1 tercapai tanpa overshoot.</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" weight="fill" />
            <span>Naikkan "Batas Limit Gelap" hanya jika atribut non-kuncian aman untuk dikorbankan.</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" weight="fill" />
            <span>Single Drill mode: target otomatis muncul dari atribut drill — tidak perlu menulis manual.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
