import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Plus, Pencil, Trash, X } from "@phosphor-icons/react";

function makeCms(resource, label) {
  return function Cms() {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [err, setErr] = useState("");

    const load = () => api.get(`/${resource}?published_only=false`).then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const save = async (data) => {
      setErr("");
      try {
        if (modal.mode === "new") await api.post(`/${resource}`, data);
        else await api.patch(`/${resource}/${modal.data.id}`, data);
        setModal(null); await load();
      } catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
    };
    const del = async (id) => {
      if (!window.confirm("Delete?")) return;
      await api.delete(`/${resource}/${id}`); load();
    };

    const isEvents = resource === "events";
    return (
      <div className="space-y-6" data-testid={`admin-${resource}-page`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="badge badge-gold mb-2">{label.toUpperCase()}</div>
            <h1 className="section-title text-3xl">{label} CMS</h1>
          </div>
          <button onClick={() => setModal({ mode: "new", data: { published: true, registration_required: true } })} className="btn-primary" data-testid={`${resource}-add-btn`}>
            <Plus size={16} className="inline mr-1" /> Tambah
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((n) => (
            <div key={n.id} className="card-solid overflow-hidden">
              {n.image_url && <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${n.image_url})` }} />}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {n.published ? <span className="badge badge-green">PUBLISHED</span> : <span className="badge badge-grey">DRAFT</span>}
                  {isEvents && n.event_date && <span className="badge badge-gold">{new Date(n.event_date).toLocaleDateString("id-ID")}</span>}
                </div>
                <div className="font-display font-bold text-lg">{n.title}</div>
                <div className="text-sm text-[#9BA4B5] line-clamp-3 mt-1">{n.content}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setModal({ mode: "edit", data: n })} className="btn-outline !py-1 !px-3 !text-xs"><Pencil size={12} /> Edit</button>
                  <button onClick={() => del(n.id)} className="btn-danger"><Trash size={12} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {modal && <Modal modal={modal} isEvents={isEvents} err={err} onClose={() => setModal(null)} onSave={save} />}
      </div>
    );
  };
}

function Modal({ modal, isEvents, err, onClose, onSave }) {
  const [form, setForm] = useState(modal.data);
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (isEvents && payload.event_date && payload.event_date.length === 10) {
      payload.event_date = new Date(payload.event_date).toISOString();
    }
    onSave(payload);
  };
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-xl">{modal.mode === "new" ? "Tambah" : "Edit"}</div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label-std">Title</label><input required className="input-std" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="cms-title" /></div>
          <div><label className="label-std">Image URL</label><input className="input-std" value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
          {isEvents && (
            <>
              <div><label className="label-std">Event Date</label><input type="date" className="input-std" value={form.event_date ? form.event_date.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.registration_required} onChange={(e) => setForm({ ...form, registration_required: e.target.checked })} /> Butuh Registrasi</label>
            </>
          )}
          <div><label className="label-std">Content</label><textarea required rows="6" className="input-std" value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} data-testid="cms-content" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" data-testid="cms-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const AdminNews = makeCms("news", "News");
export const AdminEvents = makeCms("events", "Events");
