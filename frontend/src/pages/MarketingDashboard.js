import React, { useEffect, useState } from "react";
import { api, formatRupiah } from "@/lib/api";
import { Ticket, CurrencyDollar, ChartBar, Briefcase } from "@phosphor-icons/react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { useAuth } from "@/context/AuthContext";

export default function MarketingDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get("/dashboard/marketing").then((r) => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return <div className="h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  const tooltipStyle = {
    backgroundColor: "#16161d",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };

  return (
    <div className="space-y-6" data-testid="marketing-dashboard">
      <WelcomeBanner
        userName={user?.name || "Marketing"}
        subtitle="Performa kode promo & earnings"
        actions={[
          { to: "/app/admin/promos", label: "Kelola Promo", icon: Ticket, primary: true },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={CurrencyDollar} iconColor="#00A8FF" label="Total Earnings" value={formatRupiah(stats.total_earnings)} subtext="Akumulasi komisi" delay={0.05} testId="kpi-earnings" />
        <StatCard icon={ChartBar} iconColor="#10b981" label="Conversions" value={String(stats.total_conversions)} subtext="Transaksi pakai promo" delay={0.1} testId="kpi-conversions" />
        <StatCard icon={Ticket} iconColor="#8b5cf6" label="Active Promos" value={String(stats.active_promos)} subtext="Kode promo aktif" delay={0.15} testId="kpi-active-promos" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-4">Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a0a0b0" }} />
              <Line type="monotone" dataKey="earnings" stroke="#00A8FF" strokeWidth={2.5} dot={{ r: 3, fill: "#00A8FF" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-4">Conversions</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a6a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,168,255,0.05)" }} />
              <Bar dataKey="count" fill="#10b981" name="Count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-4">Kode Promo Saya</h3>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-[#5a5a6a] border-b border-white/[0.06]">
                <th className="py-2.5">Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Active</th>
              </tr>
            </thead>
            <tbody>
              {stats.promos.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-mono font-bold text-[#00A8FF]">{p.code}</td>
                  <td className="text-[#a0a0b0]">{p.discount_type}</td>
                  <td className="text-white">{p.discount_type === "percent" ? `${p.discount_value}%` : formatRupiah(p.discount_value)}</td>
                  <td className="text-[#a0a0b0]">{p.uses || 0}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      p.active ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                              : "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30"
                    }`}>{p.active ? "ON" : "OFF"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-2">
          {stats.promos.map((p) => (
            <div key={p.id} className="p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono font-bold text-[#00A8FF]">{p.code}</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${p.active ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30" : "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30"}`}>
                  {p.active ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#a0a0b0]">
                <span>{p.discount_type === "percent" ? `${p.discount_value}%` : formatRupiah(p.discount_value)}</span>
                <span>{p.uses || 0}{p.max_uses ? ` / ${p.max_uses}` : ""} uses</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-4">Konversi Terbaru</h3>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-[#5a5a6a] border-b border-white/[0.06]">
                <th className="py-2.5">User</th><th>Package</th><th>Promo</th><th>Commission</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tx.map((t) => (
                <tr key={t.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 text-white">{t.user_name}</td>
                  <td className="text-[#a0a0b0]">{t.package_name}</td>
                  <td><span className="font-mono text-[#00A8FF] text-xs">{t.promo_code}</span></td>
                  <td className="text-[#10b981] font-bold">{formatRupiah(t.marketing_cut)}</td>
                  <td className="text-[11px] text-[#5a5a6a]">{new Date(t.created_at).toLocaleDateString("id-ID")}</td>
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
                <span className="font-mono text-[#00A8FF] text-xs shrink-0">{t.promo_code}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[#5a5a6a]">{new Date(t.created_at).toLocaleDateString("id-ID")}</span>
                <span className="font-bold text-[#10b981]">{formatRupiah(t.marketing_cut)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
