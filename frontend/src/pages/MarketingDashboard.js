import React, { useEffect, useState } from "react";
import { api, formatRupiah } from "@/lib/api";
import { Ticket, CurrencyDollar, ChartBar } from "@phosphor-icons/react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function MarketingDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/marketing").then((r) => setStats(r.data));
  }, []);

  if (!stats) return <div className="h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  const kpis = [
    { label: "Total Earnings", value: formatRupiah(stats.total_earnings), icon: CurrencyDollar, color: "#00D05E" },
    { label: "Conversions", value: stats.total_conversions, icon: ChartBar, color: "#F5C300" },
    { label: "Active Promos", value: stats.active_promos, icon: Ticket, color: "#00B4D8" },
  ];

  return (
    <div className="space-y-6" data-testid="marketing-dashboard">
      <div>
        <div className="badge badge-gold mb-2">MARKETING</div>
        <h1 className="section-title text-3xl">Marketing Dashboard</h1>
        <p className="text-[#9BA4B5] text-sm mt-1">Performa kode promo & earnings bulan ini.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="card-solid p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-[#9BA4B5]">{k.label}</div>
              <k.icon size={18} color={k.color} weight="fill" />
            </div>
            <div className="font-display font-black text-3xl mt-2" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card-solid p-6">
          <div className="font-display font-bold text-lg mb-4">Earnings Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2B4B" />
              <XAxis dataKey="month" stroke="#9BA4B5" fontSize={11} />
              <YAxis stroke="#9BA4B5" fontSize={11} />
              <Tooltip contentStyle={{ background: "#131E35", border: "1px solid #1C2B4B" }} />
              <Legend />
              <Line type="monotone" dataKey="earnings" stroke="#00D05E" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-solid p-6">
          <div className="font-display font-bold text-lg mb-4">Conversions</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2B4B" />
              <XAxis dataKey="month" stroke="#9BA4B5" fontSize={11} />
              <YAxis stroke="#9BA4B5" fontSize={11} />
              <Tooltip contentStyle={{ background: "#131E35", border: "1px solid #1C2B4B" }} />
              <Bar dataKey="count" fill="#F5C300" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-solid p-6">
        <div className="font-display font-bold text-lg mb-4">Kode Promo Saya</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9BA4B5]">
                <th className="py-2">Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Active</th>
              </tr>
            </thead>
            <tbody>
              {stats.promos.map((p) => (
                <tr key={p.id} className="hover-row border-t border-white/5">
                  <td className="py-2 font-mono font-bold text-[#F5C300]">{p.code}</td>
                  <td>{p.discount_type}</td>
                  <td>{p.discount_type === "percent" ? `${p.discount_value}%` : formatRupiah(p.discount_value)}</td>
                  <td>{p.uses || 0}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td><span className={`badge ${p.active ? "badge-green" : "badge-red"}`}>{p.active ? "ON" : "OFF"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-solid p-6">
        <div className="font-display font-bold text-lg mb-4">Konversi Terbaru</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9BA4B5]">
                <th className="py-2">User</th><th>Package</th><th>Promo</th><th>Commission</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tx.map((t) => (
                <tr key={t.id} className="hover-row border-t border-white/5">
                  <td className="py-2">{t.user_name}</td>
                  <td>{t.package_name}</td>
                  <td><span className="badge badge-gold">{t.promo_code}</span></td>
                  <td className="text-[#00D05E] font-bold">{formatRupiah(t.marketing_cut)}</td>
                  <td className="text-xs text-[#9BA4B5]">{new Date(t.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
