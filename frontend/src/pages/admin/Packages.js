import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Plus, Pencil, Trash, X } from "@phosphor-icons/react";

export default function AdminPackages() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api.get("/packages").then((r) => setItems(r.data));
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
        {items.map((p) => (
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
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal({ mode: "edit", data: { ...p, features_text: (p.features || []).join("\n") } })} className="btn-outline !py-1.5 !px-3 !text-xs"><Pencil size={12} /> Edit</button>
              <button onClick={() => del(p.id)} className="btn-danger"><Trash size={12} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && <PkgModal modal={modal} err={err} onClose={() => setModal(null)} onSave={save} />}
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
