import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Plus, Pencil, Trash, X, Ticket, Copy, Check } from "@phosphor-icons/react";

export default function AdminPackages() {
  const [items, setItems] = useState([]);
  const [promos, setPromos] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [modal, setModal] = useState(null);
  const [promoModal, setPromoModal] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    const [pkgRes, promoRes, userRes] = await Promise.all([
      api.get("/packages"),
      api.get("/promos"),
      api.get("/users").catch(() => ({ data: [] })),
    ]);
    setItems(pkgRes.data.items || pkgRes.data || []);
    setPromos(promoRes.data.items || promoRes.data || []);
    setMarketers((userRes.data.items || userRes.data || []).filter((u) => u.role === "marketing"));
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    setErr("");
    try {
      if (modal.mode === "new") await api.post("/packages", data);
      else await api.patch(`/packages/${modal.data.id}`, data);
      setModal(null); await load();
    } catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus package?")) return;
    await api.delete(`/packages/${id}`); load();
  };

  const savePromo = async (data) => {
    setErr("");
    try {
      await api.post("/promos", data);
      setPromoModal(null); await load();
    } catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 1500);
    });
  };

  const getPackagePromos = (pkgId) => promos.filter((p) => p.package_id === pkgId && p.active);

  return (
    <div className="space-y-6" data-testid="admin-packages-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="badge badge-gold mb-2">PACKAGES</div>
          <h1 className="section-title text-3xl">Packages</h1>
        </div>
        <button onClick={() => setModal({ mode: "new", data: { duration_type: "monthly", duration_value: 1, price: 0, features: [], active: true, is_trial: false } })} className="btn-primary" data-testid="pkg-add-btn">
          <Plus size={16} className="inline mr-1" /> Tambah
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => {
          const pkgPromos = getPackagePromos(p.id);
          return (
            <div key={p.id} className="card-solid p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#A0AAB5]">{p.duration_type}</div>
                  <div className="font-display font-black text-xl">{p.name}</div>
                </div>
                {!p.active && <span className="badge badge-red">INACTIVE</span>}
                {p.is_trial && <span className="badge badge-gold">TRIAL</span>}
              </div>
              <div className="font-display font-black text-3xl text-[#38BDF8] mt-2">{formatRupiah(p.price)}</div>
              <div className="text-xs text-[#A0AAB5] mt-1">{p.description}</div>
              <div className="text-xs text-[#A0AAB5] mt-2">Durasi: {p.duration_value} {p.duration_type === "yearly" ? "tahun" : "bulan"}{p.max_clicks ? ` · ${p.max_clicks} clicks` : ""}</div>

              {/* Promo codes for this package */}
              {pkgPromos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <div className="text-[10px] uppercase tracking-widest text-[#A0AAB5] mb-1.5 flex items-center gap-1"><Ticket size={10} /> Promo Codes ({pkgPromos.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {pkgPromos.map((pr) => (
                      <button key={pr.id} onClick={() => copyCode(pr.code)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-mono font-bold hover:bg-[#38BDF8]/20 transition" title="Klik untuk copy">
                        {pr.code}
                        {copiedCode === pr.code ? <Check size={10} weight="bold" /> : <Copy size={10} />}
                        <span className="text-[#A0AAB5] font-sans ml-1">-{pr.discount_type === "percent" ? `${pr.discount_value}%` : formatRupiah(pr.discount_value)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                <button onClick={() => setPromoModal({ package_id: p.id, package_name: p.name })} className="btn-outline !py-1.5 !px-3 !text-xs"><Ticket size={12} className="inline mr-1" /> + Promo</button>
                <button onClick={() => setModal({ mode: "edit", data: { ...p, features_text: (p.features || []).join("\n") } })} className="btn-outline !py-1.5 !px-3 !text-xs"><Pencil size={12} /> Edit</button>
                <button onClick={() => del(p.id)} className="btn-danger"><Trash size={12} /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <PkgModal modal={modal} err={err} onClose={() => setModal(null)} onSave={save} />}
      {promoModal && <QuickPromoModal pkg={promoModal} marketers={marketers} err={err} onClose={() => setPromoModal(null)} onSave={savePromo} />}
    </div>
  );
}

function QuickPromoModal({ pkg, marketers, err, onClose, onSave }) {
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: 10, max_uses: "", valid_until: "", owner_marketing_id: "", package_id: pkg.package_id });
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
          <div>
            <div className="font-display font-bold text-xl">Tambah Promo</div>
            <div className="text-xs text-[#A0AAB5] mt-0.5">Untuk paket: <span className="text-[#38BDF8] font-bold">{pkg.package_name}</span></div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label-std">Code</label><input required className="input-std uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Tipe</label>
              <select className="input-std" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percent">Percent (%)</option><option value="flat">Flat (Rp)</option>
              </select>
            </div>
            <div><label className="label-std">Nilai</label><input type="number" step="0.01" className="input-std" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Max Uses</label><input type="number" className="input-std" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" /></div>
            <div><label className="label-std">Valid Until</label><input type="date" className="input-std" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
          </div>
          {marketers.length > 0 && (
            <div><label className="label-std">Marketing (opsional)</label>
              <select className="input-std" value={form.owner_marketing_id} onChange={(e) => setForm({ ...form, owner_marketing_id: e.target.value })}>
                <option value="">— none —</option>
                {marketers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
              </select>
            </div>
          )}
          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Simpan Promo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PkgModal({ modal, err, onClose, onSave }) {
  const [form, setForm] = useState(modal.data);

  const submit = (e) => {
    e.preventDefault();
    const features = (form.features_text || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = { ...form, features };
    delete payload.features_text;
    payload.price = parseFloat(payload.price) || 0;
    payload.duration_value = parseInt(payload.duration_value) || 1;
    if (payload.max_clicks === "" || payload.max_clicks == null) payload.max_clicks = null;
    else payload.max_clicks = parseInt(payload.max_clicks);
    onSave(payload);
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-xl">{modal.mode === "new" ? "Tambah Package" : "Edit Package"}</div>
          <button onClick={onClose} className="text-[#A0AAB5]"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label-std">Nama</label><input required className="input-std" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="pkg-name" /></div>
          <div><label className="label-std">Deskripsi</label><textarea className="input-std" rows="2" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Tipe</label>
              <select className="input-std" value={form.duration_type} onChange={(e) => setForm({ ...form, duration_type: e.target.value })}>
                <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
            <div><label className="label-std">Durasi (value)</label><input type="number" className="input-std" value={form.duration_value} onChange={(e) => setForm({ ...form, duration_value: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Harga (Rp)</label><input type="number" className="input-std" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="pkg-price" /></div>
            <div><label className="label-std">Max Clicks (opsional)</label><input type="number" className="input-std" value={form.max_clicks ?? ""} onChange={(e) => setForm({ ...form, max_clicks: e.target.value })} /></div>
          </div>
          <div><label className="label-std">Features (1 per baris)</label><textarea rows="3" className="input-std" value={form.features_text ?? (form.features || []).join("\n")} onChange={(e) => setForm({ ...form, features_text: e.target.value })} /></div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_trial} onChange={(e) => setForm({ ...form, is_trial: e.target.checked })} /> Trial</label>
          </div>
          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" data-testid="pkg-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
