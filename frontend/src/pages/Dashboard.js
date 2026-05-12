import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getDashboardSections } from "@/lib/permissions";
import {
  Users, Ticket, ChartBar, Warning, ArrowUp, CheckCircle, Clock, CreditCard,
  Crosshair, Target, Lightning, Flame, Package as PkgIcon, ArrowRight,
  CurrencyDollar, Barbell, Shield,
} from "@phosphor-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, LineChart, Legend,
} from "recharts";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";

const tooltipStyle = {
  backgroundColor: "#16161d",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
};

// =========================================================
// SECTION: Admin KPIs + Charts
// =========================================================
function AdminSection({ stats }) {
  if (!stats) return <div className="h-32 flex items-center justify-center"><div className="spinner" /></div>;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="badge badge-gold">ADMIN OVERVIEW</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} iconColor="#38BDF8" label="Total Users" value={String(stats.total_users)} subtext="Semua user terdaftar" delay={0.05} testId="kpi-total-users" />
        <StatCard icon={CheckCircle} iconColor="#10b981" label="Active" value={String(stats.active_users)} subtext="Approved & aktif" delay={0.1} testId="kpi-active" />
        <StatCard icon={Clock} iconColor="#f59e0b" label="Pending" value={String(stats.pending_users)} subtext="Menunggu approval" delay={0.15} testId="kpi-pending" />
        <StatCard icon={Warning} iconColor="#ef4444" label="Expiring 7D" value={String(stats.expiring_soon)} subtext="Akan expired" delay={0.2} testId="kpi-expiring" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ChartBar} iconColor="#38BDF8" label="Gross Revenue" value={formatRupiah(stats.gross)} subtext="Total approved" delay={0.05} testId="kpi-gross" />
        <StatCard icon={ArrowUp} iconColor="#10b981" label="Net Revenue" value={formatRupiah(stats.net)} subtext="Setelah promo" delay={0.1} testId="kpi-net" />
        <StatCard icon={Ticket} iconColor="#8b5cf6" label="Marketing Cut" value={formatRupiah(stats.marketing_total)} subtext="Komisi marketing" delay={0.15} testId="kpi-marketing" />
        <StatCard icon={CreditCard} iconColor="#ef4444" label="Pending TX" value={String(stats.pending_tx_count)} subtext="Butuh approval" delay={0.2} testId="kpi-pending-tx" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Revenue 6 Bulan</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(56,189,248,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a0a0b0" }} />
              <Bar dataKey="gross" fill="#38BDF8" name="Gross" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#10b981" name="Net" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="net" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.expiring_list?.length > 0 && (
        <div className="bg-[#16161d] border border-[#f59e0b]/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Warning size={16} weight="fill" className="text-[#f59e0b]" /> Akan Expired 7 Hari
            </h3>
            <Link to="/app/admin/users" className="text-xs text-[#38BDF8] hover:text-[#7DD3FC]">Kelola →</Link>
          </div>
          <div className="space-y-2">
            {stats.expiring_list.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[#0a0a0f]">
                <div>
                  <span className="text-white font-medium">{u.name}</span>
                  <span className="text-[#5a5a6a] ml-2 text-xs">{u.email}</span>
                </div>
                <span className="text-[#f59e0b] text-xs font-bold">{new Date(u.expires_at).toLocaleDateString("id-ID")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.recent_tx?.length > 0 && (
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            <Link to="/app/admin/transactions" className="text-xs text-[#38BDF8] hover:text-[#7DD3FC]">Semua →</Link>
          </div>
          <div className="space-y-2">
            {stats.recent_tx.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[#0a0a0f]">
                <div className="min-w-0 flex-1">
                  <span className="text-white font-medium truncate block">{t.user_name}</span>
                  <span className="text-[#5a5a6a] text-xs">{t.package_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#38BDF8] font-bold text-xs">{formatRupiah(t.final_amount)}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    t.status === "approved" ? "bg-[#10b981]/15 text-[#10b981]"
                    : t.status === "pending" ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                    : "bg-[#ef4444]/15 text-[#ef4444]"
                  }`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// SECTION: Marketing Stats
// =========================================================
function MarketingSection({ stats }) {
  if (!stats) return <div className="h-24 flex items-center justify-center"><div className="spinner" /></div>;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="badge badge-blue">MARKETING</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CurrencyDollar} iconColor="#38BDF8" label="Total Earnings" value={formatRupiah(stats.total_earnings)} subtext="Akumulasi komisi" delay={0.05} testId="kpi-earnings" />
        <StatCard icon={ChartBar} iconColor="#10b981" label="Conversions" value={String(stats.total_conversions)} subtext="Transaksi pakai promo" delay={0.1} testId="kpi-conversions" />
        <StatCard icon={Ticket} iconColor="#8b5cf6" label="Active Promos" value={String(stats.active_promos)} subtext="Kode promo aktif" delay={0.15} testId="kpi-active-promos" />
      </div>
      <div className="flex justify-end">
        <Link to="/app/marketing" className="text-xs text-[#38BDF8] hover:text-[#7DD3FC]">Lihat detail marketing →</Link>
      </div>
    </div>
  );
}

// =========================================================
// SECTION: User Training Stats
// =========================================================
function UserSection({ user }) {
  const now = new Date();
  const exp = user.expires_at ? new Date(user.expires_at) : null;
  const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : null;
  const clicksLeft = user.max_clicks != null ? Math.max(0, user.max_clicks - (user.clicks_used || 0)) : null;
  const expiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="space-y-5">
      {exp && daysLeft <= 0 && (
        <div className="bg-[#16161d] border border-[#ef4444]/40 rounded-xl p-4 flex items-center gap-3">
          <Warning size={24} weight="fill" className="text-[#ef4444] shrink-0" />
          <div>
            <div className="font-semibold text-white">Akun Sudah Expired</div>
            <div className="text-sm text-[#a0a0b0]">Hubungi admin untuk perpanjang paket.</div>
          </div>
        </div>
      )}
      {expiring && (
        <div className="bg-[#16161d] border border-[#f59e0b]/40 rounded-xl p-4 flex items-center gap-3">
          <Warning size={24} weight="fill" className="text-[#f59e0b] shrink-0" />
          <div>
            <div className="font-semibold text-white">Akun akan expired dalam {daysLeft} hari</div>
            <div className="text-sm text-[#a0a0b0]">Perpanjang sekarang agar training tidak terputus.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} iconColor="#f97316" label="Streak" value={`${user.current_streak || 0} hari`} subtext={`Rekor: ${user.longest_streak || 0} hari`} progress={Math.min(100, ((user.current_streak || 0) / 30) * 100)} progressColor="#f97316" delay={0.05} testId="stat-streak" />
        <StatCard icon={PkgIcon} iconColor="#38BDF8" label="Package" value={user.package?.name || "—"} subtext={user.package?.description || "Belum ada paket"} delay={0.1} testId="stat-package" />
        <StatCard icon={Clock} iconColor="#f59e0b" label="Expires" value={exp ? `${daysLeft} hari` : "Unlimited"} subtext={exp ? exp.toLocaleDateString("id-ID") : "Tanpa batas"} delay={0.15} testId="stat-expires" />
        <StatCard icon={Lightning} iconColor="#10b981" label="Clicks" value={clicksLeft != null ? clicksLeft : "∞"} subtext={`${user.clicks_used || 0} / ${user.max_clicks || "∞"} terpakai`} delay={0.2} testId="stat-clicks" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { to: "/app/training/full", icon: Target, title: "Full Latihan", badge: "RECOMMENDED" },
          { to: "/app/training/single", icon: Crosshair, title: "Single Drill", badge: "FOKUS" },
          { to: "/app/training/gk", icon: Shield, title: "GK Latihan", badge: "KIPER" },
        ].map((m, i) => (
          <Link key={i} to={m.to}>
            <motion.div whileHover={{ y: -2 }} className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 group hover:border-[rgba(56,189,248,0.4)] transition-all duration-200 relative overflow-hidden">
              <m.icon size={80} weight="duotone" className="absolute -right-3 -bottom-3 text-[#38BDF8]/[0.08] group-hover:text-[#38BDF8]/[0.18] transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #38BDF8, #0EA5E9)" }}>
                    <m.icon size={18} weight="fill" color="#fff" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] bg-[rgba(56,189,248,0.1)] px-2 py-0.5 rounded">{m.badge}</span>
                </div>
                <div className="font-bold text-white">{m.title}</div>
                <div className="mt-2 text-[#38BDF8] text-xs flex items-center gap-1 group-hover:gap-2 transition-all">Buka <ArrowRight size={12} weight="bold" /></div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// UNIFIED DASHBOARD — main export
// =========================================================
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const sections = getDashboardSections(role);

  const [adminStats, setAdminStats] = useState(null);
  const [marketingStats, setMarketingStats] = useState(null);

  useEffect(() => {
    if (sections.showAdminStats) {
      api.get("/dashboard/admin").then((r) => setAdminStats(r.data)).catch(() => {});
    }
    if (sections.showMarketingStats) {
      api.get("/dashboard/marketing").then((r) => setMarketingStats(r.data)).catch(() => {});
    }
  }, [sections.showAdminStats, sections.showMarketingStats]);

  if (!user) return null;

  // Welcome banner actions berdasarkan role
  const bannerActions = [];
  if (sections.showAdminStats) {
    bannerActions.push({ to: "/app/admin/users", label: "Kelola Users", icon: Users, primary: true });
    bannerActions.push({ to: "/app/admin/transactions", label: "Transaksi", icon: ChartBar });
  }
  if (sections.showTrainingShortcuts && !sections.showAdminStats) {
    bannerActions.push({ to: "/app/training/full", label: "Training Baru", icon: Crosshair, primary: true });
    bannerActions.push({ to: "/app/training", label: "Hub Latihan", icon: Barbell });
  }
  if (sections.showMarketingStats && !sections.showAdminStats) {
    bannerActions.push({ to: "/app/admin/promos", label: "Kelola Promo", icon: Ticket, primary: true });
  }

  return (
    <div className="space-y-8" data-testid="unified-dashboard">
      <WelcomeBanner
        userName={user.name || user.email}
        subtitle={
          role === "superadmin" ? "Superadmin · Akses penuh semua fitur"
          : role === "admin" ? "Admin · Manajemen user, transaksi & konten"
          : role === "marketing" ? "Marketing · Performa promo & earnings"
          : "Dashboard latihan Anda"
        }
        actions={bannerActions}
      />

      {/* Admin/Superadmin: tampilkan admin stats */}
      {sections.showAdminStats && <AdminSection stats={adminStats} />}

      {/* Marketing stats — tampil untuk marketing, admin, superadmin */}
      {sections.showMarketingStats && (
        <MarketingSection stats={marketingStats} />
      )}

      {/* Training shortcuts — tampil untuk user, dan juga admin/superadmin */}
      {sections.showTrainingShortcuts && (
        <UserSection user={user} />
      )}

      {/* User-only tips */}
      {role === "user" && (
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} weight="duotone" className="text-[#10b981]" />
            <h3 className="text-sm font-semibold text-white">Tips Cepat</h3>
          </div>
          <ul className="space-y-2 text-sm text-[#a0a0b0]">
            <li className="flex gap-2"><CheckCircle size={16} className="text-[#10b981] shrink-0 mt-0.5" weight="fill" /><span>Prioritas 1 = atribut utama. Prioritas 2/3 dikerjakan setelah prio 1 tercapai.</span></li>
            <li className="flex gap-2"><CheckCircle size={16} className="text-[#10b981] shrink-0 mt-0.5" weight="fill" /><span>Naikkan "Batas Limit Gelap" hanya jika atribut non-kuncian aman dikorbankan.</span></li>
            <li className="flex gap-2"><CheckCircle size={16} className="text-[#10b981] shrink-0 mt-0.5" weight="fill" /><span>Single Drill: target otomatis dari atribut drill — tidak perlu input manual.</span></li>
          </ul>
        </div>
      )}
    </div>
  );
}
