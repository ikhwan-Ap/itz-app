import React, { useEffect, useState } from "react";
import { api, formatRupiah } from "@/lib/api";
import { Users, Ticket, ChartBar, Warning, ArrowUp, CheckCircle, Clock, CreditCard } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, LineChart, Legend } from "recharts";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/admin").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  const kpis = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "#D4AF37" },
    { label: "Active", value: stats.active_users, icon: CheckCircle, color: "#D4AF37" },
    { label: "Pending", value: stats.pending_users, icon: Clock, color: "#F5C300" },
    { label: "Expiring 7D", value: stats.expiring_soon, icon: Warning, color: "#F0557A" },
  ];
  const fin = [
    { label: "Gross Revenue", value: formatRupiah(stats.gross), icon: ChartBar, color: "#D4AF37" },
    { label: "Net Revenue", value: formatRupiah(stats.net), icon: ArrowUp, color: "#F5C300" },
    { label: "Marketing Cut", value: formatRupiah(stats.marketing_total), icon: Ticket, color: "#00B4D8" },
    { label: "Total Discount", value: formatRupiah(stats.discount_total), icon: CreditCard, color: "#F0557A" },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <div className="badge badge-gold mb-2">ADMIN</div>
        <h1 className="section-title text-3xl">Admin Dashboard</h1>
        <p className="text-[#9FB0CC] text-sm mt-1">Global overview · Users · Revenue · Pending approvals</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="card-solid p-5" data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-[#9FB0CC]">{k.label}</div>
              <k.icon size={18} color={k.color} weight="fill" />
            </div>
            <div className="font-display font-black text-3xl mt-2" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fin.map((k, i) => (
          <div key={i} className="card-solid p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-[#9FB0CC]">{k.label}</div>
              <k.icon size={18} color={k.color} weight="fill" />
            </div>
            <div className="font-display font-black text-2xl mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card-solid p-6">
          <div className="font-display font-bold text-lg mb-4">Revenue (6 Bulan)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16305A" />
              <XAxis dataKey="month" stroke="#9FB0CC" fontSize={11} />
              <YAxis stroke="#9FB0CC" fontSize={11} />
              <Tooltip contentStyle={{ background: "#102440", border: "1px solid #16305A" }} />
              <Legend />
              <Bar dataKey="gross" fill="#D4AF37" name="Gross" />
              <Bar dataKey="net" fill="#F5C300" name="Net" />
              <Bar dataKey="marketing" fill="#00B4D8" name="Marketing" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-solid p-6">
          <div className="font-display font-bold text-lg mb-4">Profit Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16305A" />
              <XAxis dataKey="month" stroke="#9FB0CC" fontSize={11} />
              <YAxis stroke="#9FB0CC" fontSize={11} />
              <Tooltip contentStyle={{ background: "#102440", border: "1px solid #16305A" }} />
              <Legend />
              <Line type="monotone" dataKey="net" stroke="#D4AF37" strokeWidth={3} />
              <Line type="monotone" dataKey="gross" stroke="#F5C300" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.expiring_list.length > 0 && (
        <div className="card-solid p-6 border border-[#F5C300]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-lg flex items-center gap-2">
              <Warning size={20} className="text-[#F5C300]" weight="fill" /> Akan Expired dalam 7 Hari
            </div>
            <Link to="/app/admin/users" className="btn-outline !py-1.5 !px-3 !text-xs">Kelola User</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-[#9FB0CC]">
                  <th className="py-2">Nama</th><th>Email</th><th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {stats.expiring_list.map((u) => (
                  <tr key={u.id} className="hover-row border-t border-white/5">
                    <td className="py-2">{u.name}</td>
                    <td className="text-[#9FB0CC]">{u.email}</td>
                    <td className="text-[#F5C300]">{new Date(u.expires_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card-solid p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-lg">Recent Transactions</div>
          <Link to="/app/admin/transactions" className="btn-outline !py-1.5 !px-3 !text-xs">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9FB0CC]">
                <th className="py-2">User</th><th>Package</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tx.map((t) => (
                <tr key={t.id} className="hover-row border-t border-white/5">
                  <td className="py-2">{t.user_name}<div className="text-xs text-[#9FB0CC]">{t.user_email}</div></td>
                  <td>{t.package_name}</td>
                  <td>{formatRupiah(t.final_amount)}</td>
                  <td><span className={`badge ${t.status === "approved" ? "badge-green" : t.status === "pending" ? "badge-gold" : "badge-red"}`}>{t.status}</span></td>
                  <td className="text-[#9FB0CC]">{new Date(t.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
