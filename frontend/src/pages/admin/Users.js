import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash, X } from "@phosphor-icons/react";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [modal, setModal] = useState(null); // {mode: 'new'|'edit', data}
  const [err, setErr] = useState("");

  const load = async () => {
    const [u, p] = await Promise.all([api.get("/users"), api.get("/packages")]);
    setUsers(u.data); setPackages(p.data);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    setErr("");
    try {
      if (modal.mode === "new") await api.post("/users", data);
      else await api.patch(`/users/${modal.data.id}`, data);
      setModal(null); await load();
    } catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus user ini?")) return;
    try { await api.delete(`/users/${id}`); load(); }
    catch (e) { alert(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6" data-testid="admin-users-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="badge badge-gold mb-2">USERS</div>
          <h1 className="section-title text-3xl">Manajemen User</h1>
        </div>
        <button onClick={() => setModal({ mode: "new", data: { role: "user", is_trial: true } })} className="btn-primary" data-testid="user-add-btn">
          <Plus size={16} className="inline mr-1" /> Tambah User
        </button>
      </div>

      <div className="card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#9FB0CC] border-b border-white/5">
                <th className="p-3">Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th>Clicks</th><th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover-row border-b border-white/5" data-testid={`user-row-${u.email}`}>
                  <td className="p-3">{u.name}<div className="text-xs text-[#9FB0CC]">{u.association || "-"}</div></td>
                  <td className="text-[#9FB0CC]">{u.email}</td>
                  <td><span className="badge badge-blue uppercase">{u.role}</span></td>
                  <td><span className={`badge ${u.status === "active" ? "badge-green" : u.status === "pending" ? "badge-gold" : "badge-red"}`}>{u.status}</span></td>
                  <td className="text-xs">{u.expires_at ? new Date(u.expires_at).toLocaleDateString("id-ID") : "—"}</td>
                  <td className="text-xs">{u.clicks_used || 0} / {u.max_clicks ?? "∞"}</td>
                  <td>
                    <button onClick={() => setModal({ mode: "edit", data: u })} className="btn-outline !py-1 !px-2 mr-1" data-testid={`user-edit-${u.email}`}><Pencil size={14} /></button>
                    {me.role === "superadmin" && u.id !== me.id && (
                      <button onClick={() => del(u.id)} className="btn-danger" data-testid={`user-del-${u.email}`}><Trash size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <UserModal modal={modal} packages={packages} me={me} err={err} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function UserModal({ modal, packages, me, err, onClose, onSave }) {
  const [form, setForm] = useState(modal.mode === "new"
    ? { email: "", password: "", password2: "", name: "", role: "user", association: "", package_id: "", max_clicks: 50, expires_at: "", is_trial: true }
    : { ...modal.data });

  const isTrialForm = form.is_trial;

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (modal.mode === "edit") {
      delete payload.email; delete payload.password; delete payload.password2; delete payload.is_trial;
    }
    if (!payload.expires_at) delete payload.expires_at;
    if (!payload.package_id) delete payload.package_id;
    if (payload.max_clicks === "" || payload.max_clicks == null) payload.max_clicks = null;
    else payload.max_clicks = parseInt(payload.max_clicks);
    onSave(payload);
  };

  const roles = me.role === "superadmin"
    ? ["user", "marketing", "admin", "superadmin"]
    : ["user"];

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-xl">{modal.mode === "new" ? "Tambah User" : `Edit: ${form.name}`}</div>
          <button onClick={onClose} className="text-[#9FB0CC] hover:text-white" data-testid="modal-close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {modal.mode === "new" && (
            <>
              <div><label className="label-std">Email</label><input required type="email" className="input-std" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="modal-email" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-std">Password</label><input required type="password" className="input-std" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div><label className="label-std">2nd Password</label><input required type="password" className="input-std" value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} /></div>
              </div>
            </>
          )}
          <div><label className="label-std">Nama</label><input required className="input-std" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="modal-name" /></div>
          <div><label className="label-std">Asosiasi</label><input className="input-std" value={form.association || ""} onChange={(e) => setForm({ ...form, association: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Role</label>
              <select className="input-std" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="modal-role">
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label-std">Status</label>
              <select className="input-std" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">active</option>
                <option value="pending">pending</option>
                <option value="suspended">suspended</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
          </div>
          <div><label className="label-std">Package</label>
            <select className="input-std" value={form.package_id || ""} onChange={(e) => setForm({ ...form, package_id: e.target.value })}>
              <option value="">— none —</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Expires (YYYY-MM-DD)</label>
              <input type="date" className="input-std" value={form.expires_at ? form.expires_at.slice(0, 10) : ""}
                     onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
            </div>
            <div><label className="label-std">Max Clicks (trial)</label>
              <input type="number" className="input-std" value={form.max_clicks ?? ""} onChange={(e) => setForm({ ...form, max_clicks: e.target.value })} />
            </div>
          </div>
          {modal.mode === "new" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!isTrialForm} onChange={(e) => setForm({ ...form, is_trial: e.target.checked })} /> Free Trial Account
            </label>
          )}
          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" data-testid="modal-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
