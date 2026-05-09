import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import {
  Users, Ticket, ChartBar, Warning, ArrowUp, CheckCircle, Clock, CreditCard,
  Crown, Crosshair,
} from "@phosphor-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, LineChart, Legend,
} from "recharts";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/admin").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "#16161d",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <WelcomeBanner
        userName={user?.name || "Admin"}
        subtitle="Global overview · Users · Revenue · Pending approvals"
        actions={[
          { to: "/app/admin/users", label: "Kelola Users", icon: Users, primary: true },
          { to: "/app/admin/transactions", label: "Transaksi", icon: ChartBar },
        ]}
      />

      {/* User KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard icon={Users} iconColor="#00A8FF" label="Total Users" value={String(stats.total_users)} subtext="Semua user terdaftar" delay={0.05} testId="kpi-total-users" />
        <StatCard icon={CheckCircle} iconColor="#10b981" label="Active" value={String(stats.active_users)} subtext="Approved & belum expired" delay={0.1} testId="kpi-active" />
        <StatCard icon={Clock} iconColor="#f59e0b" label="Pending" value={String(stats.pending_users)} subtext="Menunggu approval admin" delay={0.15} testId="kpi-pending" />
        <StatCard icon={Warning} iconColor="#ef4444" label="Expiring 7D" value={String(stats.expiring_soon)} subtext="Akan expired dalam 7 hari" delay={0.2} testId="kpi-expiring" />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard icon={ChartBar} iconColor="#00A8FF" label="Gross Revenue" value={formatRupiah(stats.gross)} subtext="Total approved" delay={0.05} testId="kpi-gross" />
        <StatCard icon={ArrowUp} iconColor="#10b981" label="Net Revenue" value={formatRupiah(stats.net)} subtext="Setelah promo & marketing" delay={0.1} testId="kpi-net" />
        <StatCard icon={Ticket} iconColor="#8b5cf6" label="Marketing Cut" value={formatRupiah(stats.marketing_total)} subtext="Komisi marketing" delay={0.15} testId="kpi-marketing" />
        <StatCard icon={CreditCard} iconColor="#ef4444" label="Total Discount" value={formatRupiah(stats.discount_total)} subtext="Promo discount applied" delay={0.2} testId="kpi-discount" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-4">Revenue (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,168,255,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a0a0b0" }} />
              <Bar dataKey="gross" fill="#00A8FF" name="Gross" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#10b981" name="Net" radius={[4, 4, 0, 0]} />
              <Bar dataKey="marketing" fill="#8b5cf6" name="Marketing" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A8FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00A8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a0a0b0" }} />
              <Line type="monotone" dataKey="net" stroke="#00A8FF" strokeWidth={2.5} dot={{ r: 3, fill: "#00A8FF" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expiring users */}
      {stats.expiring_list.length > 0 && (
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Warning size={18} weight="duotone" className="text-[#f59e0b]" />
              Akan Expired dalam 7 Hari
            </h3>
            <Link to="/app/admin/users" className="text-[12px] text-[#00A8FF] hover:text-[#33BBFF] transition-colors">Kelola →</Link>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-[#5a5a6a] border-b border-white/[0.06]">
                  <th className="py-2.5">Nama</th><th>Email</th><th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {stats.expiring_list.map((u) => (
                  <tr key={u.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-white">{u.name}</td>
                    <td className="text-[#a0a0b0]">{u.email}</td>
                    <td className="text-[#f59e0b] font-medium">{new Date(u.expires_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {stats.expiring_list.map((u) => (
              <div key={u.id} className="p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06] flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{u.name}</div>
                  <div className="text-xs text-[#a0a0b0] truncate">{u.email}</div>
                </div>
                <span className="text-xs text-[#f59e0b] font-bold whitespace-nowrap">{new Date(u.expires_at).toLocaleDateString("id-ID")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
          <Link to="/app/admin/transactions" className="text-[12px] text-[#00A8FF] hover:text-[#33BBFF] transition-colors">Semua →</Link>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-[#5a5a6a] border-b border-white/[0.06]">
                <th className="py-2.5">User</th><th>Package</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tx.map((t) => (
                <tr key={t.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 text-white">{t.user_name}<div className="text-xs text-[#a0a0b0]">{t.user_email}</div></td>
                  <td className="text-[#a0a0b0]">{t.package_name}</td>
                  <td className="text-white font-medium">{formatRupiah(t.final_amount)}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      t.status === "approved" ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                      : t.status === "pending" ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                      : "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30"
                    }`}>{t.status}</span>
                  </td>
                  <td className="text-[#5a5a6a]">{new Date(t.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-2">
          {stats.recent_tx.map((t) => (
            <div key={t.id} className="p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06]">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{t.user_name}</div>
                  <div className="text-xs text-[#a0a0b0] truncate">{t.package_name}</div>
                </div>
                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  t.status === "approved" ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                  : t.status === "pending" ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                  : "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30"
                }`}>{t.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[#5a5a6a]">{new Date(t.created_at).toLocaleDateString("id-ID")}</span>
                <span className="font-bold text-[#00A8FF]">{formatRupiah(t.final_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
