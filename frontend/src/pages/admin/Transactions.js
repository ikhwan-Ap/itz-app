import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Check, X } from "@phosphor-icons/react";
import ResponsiveTable from "@/components/ResponsiveTable";

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

  const columns = [
    {
      key: "user",
      label: "User",
      primary: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-white">{t.user_name}</div>
          <div className="text-xs text-[#A0AAB5]">{t.user_email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      primary: true,
      render: (t) => (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className={`badge ${t.status === "approved" ? "badge-green" : t.status === "pending" ? "badge-gold" : "badge-red"}`}>{t.status}</span>
          <span className="text-xs text-[#38BDF8] font-bold">{formatRupiah(t.final_amount)}</span>
        </div>
      ),
    },
    { key: "package", label: "Package", render: (t) => t.package_name },
    { key: "amount", label: "Amount", render: (t) => formatRupiah(t.amount) },
    {
      key: "promo",
      label: "Promo",
      render: (t) => t.promo_code
        ? <span className="badge badge-gold">{t.promo_code} <span className="ml-1 text-[10px]">-{formatRupiah(t.discount_amount)}</span></span>
        : "-",
    },
    { key: "final", label: "Final", render: (t) => <span className="font-bold text-[#38BDF8]">{formatRupiah(t.final_amount)}</span> },
    { key: "date", label: "Date", render: (t) => new Date(t.created_at).toLocaleDateString("id-ID") },
    { key: "note", label: "Note", render: (t) => t.note || "-" },
  ];

  const actions = (t) => {
    if (t.status !== "pending") return null;
    return (
      <div className="flex gap-2">
        <button onClick={() => approve(t.id)} className="btn-primary !py-1.5 !px-3 !text-xs" data-testid={`tx-approve-${t.id}`}>
          <Check size={12} className="inline mr-1" /> Approve
        </button>
        <button onClick={() => reject(t.id)} className="btn-danger" data-testid={`tx-reject-${t.id}`}>
          <X size={12} className="inline mr-1" /> Reject
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="admin-tx-page">
      <div>
        <div className="badge badge-gold mb-2">TRANSACTIONS</div>
        <h1 className="section-title text-3xl">Transaksi & Approval</h1>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f}
                  onClick={() => setFilter(f)}
                  className={`pill ${filter === f ? "active" : ""} shrink-0`}
                  data-testid={`tx-filter-${f}`}>{f}</button>
        ))}
      </div>

      <ResponsiveTable
        columns={columns}
        data={visible}
        rowKey={(t) => t.id}
        actions={actions}
        testIdPrefix="tx-row"
      />
    </div>
  );
}
