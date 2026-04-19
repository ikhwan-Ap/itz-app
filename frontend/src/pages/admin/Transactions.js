import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Check, X } from "@phosphor-icons/react";

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");

  const load = () => api.get("/transactions").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const note = window.prompt("Note (opsional):") ?? "";
    try { await api.post(`/transactions/${id}/approve`, { note }); load(); }
    catch (e) { alert(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const reject = async (id) => {
    const note = window.prompt("Alasan reject:") ?? "";
    try { await api.post(`/transactions/${id}/reject`, { note }); load(); }
    catch (e) { alert(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const visible = items.filter((t) => filter === "all" ? true : t.status === filter);

  return (
    <div className="space-y-6" data-testid="admin-tx-page">
      <div>
        <div className="badge badge-gold mb-2">TRANSACTIONS</div>
        <h1 className="section-title text-3xl">Transaksi & Approval</h1>
      </div>
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f}
                  onClick={() => setFilter(f)}
                  className={`pill ${filter === f ? "active" : ""}`}
                  data-testid={`tx-filter-${f}`}>{f}</button>
        ))}
      </div>

      <div className="card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9FB0CC] border-b border-white/5">
                <th className="p-3">User</th><th>Package</th><th>Amount</th><th>Promo</th><th>Final</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="hover-row border-b border-white/5" data-testid={`tx-row-${t.id}`}>
                  <td className="p-3">{t.user_name}<div className="text-xs text-[#9FB0CC]">{t.user_email}</div></td>
                  <td>{t.package_name}</td>
                  <td>{formatRupiah(t.amount)}</td>
                  <td>
                    {t.promo_code ? <span className="badge badge-gold">{t.promo_code}<span className="ml-1 text-[10px]">-{formatRupiah(t.discount_amount)}</span></span> : "-"}
                  </td>
                  <td className="font-bold text-[#D4AF37]">{formatRupiah(t.final_amount)}</td>
                  <td><span className={`badge ${t.status === "approved" ? "badge-green" : t.status === "pending" ? "badge-gold" : "badge-red"}`}>{t.status}</span></td>
                  <td className="text-xs text-[#9FB0CC]">{new Date(t.created_at).toLocaleDateString("id-ID")}</td>
                  <td>
                    {t.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => approve(t.id)} className="btn-primary !py-1 !px-2 !text-xs" data-testid={`tx-approve-${t.id}`}><Check size={12} /></button>
                        <button onClick={() => reject(t.id)} className="btn-danger" data-testid={`tx-reject-${t.id}`}><X size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
