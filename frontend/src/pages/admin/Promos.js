import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash, X } from "@phosphor-icons/react";

export default function AdminPromos() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState("");

  const isAdmin = ["admin", "superadmin"].includes(user.role);

  const load = async () => {
    const r = await api.get("/promos"); setItems(r.data);
    if (isAdmin) {
      const u = await api.get("/users");
      setMarketers(u.data.filter((x) => x.role === "marketing"));
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    setErr("");
    try {
      if (modal.mode === "new") await api.post("/promos", data);
      else await api.patch(`/promos/${modal.data.id}`, data);
      setModal(null); await load();
    } catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus promo?")) return;
    await api.delete(`/promos/${id}`); load();
  };

  return (
    <div className="space-y-6" data-testid="admin-promos-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="badge badge-gold mb-2">PROMO CODES</div>
          <h1 className="section-title text-3xl">Promo Codes</h1>
        </div>
        <button onClick={() => setModal({ mode: "new", data: { discount_type: "percent", discount_value: 10, active: true } })} className="btn-primary" data-testid="promo-add-btn">
          <Plus size={16} className="inline mr-1" /> Tambah
        </button>
      </div>

      <div className="card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9BA4B5] border-b border-white/5">
                <th className="p-3">Code</th><th>Type</th><th>Discount</th><th>Uses</th><th>Owner (Mkt)</th><th>Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="hover-row border-b border-white/5" data-testid={`promo-row-${p.code}`}>
                  <td className="p-3 font-mono font-bold text-[#F5C300]">{p.code}</td>
                  <td><span className="badge badge-blue">{p.discount_type}</span></td>
                  <td>{p.discount_type === "percent" ? `${p.discount_value}%` : `Rp ${Number(p.discount_value).toLocaleString("id-ID")}`}</td>
                  <td>{p.uses || 0}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td className="text-xs text-[#9BA4B5]">{p.owner_marketing_id ? (marketers.find((m) => m.id === p.owner_marketing_id)?.name || p.owner_marketing_id.slice(0, 6)) : "-"}</td>
                  <td><span className={`badge ${p.active ? "badge-green" : "badge-red"}`}>{p.active ? "ON" : "OFF"}</span></td>
                  <td>
                    <button onClick={() => setModal({ mode: "edit", data: p })} className="btn-outline !py-1 !px-2 mr-1"><Pencil size={12} /></button>
                    <button onClick={() => del(p.id)} className="btn-danger"><Trash size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <PromoModal modal={modal} marketers={marketers} isAdmin={isAdmin} err={err} onClose={() => setModal(null)} onSave={save} />
      )}
    </div>
  );
}

function PromoModal({ modal, marketers, isAdmin, err, onClose, onSave }) {
  const [form, setForm] = useState(modal.data);
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    payload.discount_value = parseFloat(payload.discount_value) || 0;
    if (payload.max_uses === "" || payload.max_uses == null) payload.max_uses = null;
    else payload.max_uses = parseInt(payload.max_uses);
    if (!payload.valid_until) payload.valid_until = null;
    if (payload.owner_marketing_id === "") payload.owner_marketing_id = null;
    onSave(payload);
  };
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-xl">{modal.mode === "new" ? "Tambah Promo" : "Edit Promo"}</div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {modal.mode === "new" && (
            <div><label className="label-std">Code</label><input required className="input-std uppercase" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} data-testid="promo-code" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Tipe</label>
              <select className="input-std" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percent">Percent (%)</option><option value="flat">Flat (Rp)</option>
              </select>
            </div>
            <div><label className="label-std">Nilai</label>
              <input type="number" step="0.01" className="input-std" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} data-testid="promo-value" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Max Uses</label><input type="number" className="input-std" value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} /></div>
            <div><label className="label-std">Valid Until</label><input type="date" className="input-std" value={form.valid_until ? form.valid_until.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
          </div>
          {isAdmin && (
            <div><label className="label-std">Owner Marketing (opsional)</label>
              <select className="input-std" value={form.owner_marketing_id || ""} onChange={(e) => setForm({ ...form, owner_marketing_id: e.target.value })}>
                <option value="">— none —</option>
                {marketers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" data-testid="promo-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
