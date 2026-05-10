import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash, X } from "@phosphor-icons/react";
import ResponsiveTable from "@/components/ResponsiveTable";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [modal, setModal] = useState(null);
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

  const columns = [
    {
      key: "name",
      label: "Nama",
      primary: true,
      render: (u) => (
        <div>
          <div className="font-semibold text-white">{u.name}</div>
          <div className="text-xs text-[#A0AAB5]">{u.email}</div>
          {u.association && <div className="text-[10px] text-[#A0AAB5] mt-0.5">{u.association}</div>}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      primary: true,
      render: (u) => (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="badge badge-blue uppercase">{u.role}</span>
          <span className={`badge ${u.status === "active" ? "badge-green" : u.status === "pending" ? "badge-gold" : "badge-red"}`}>{u.status}</span>
        </div>
      ),
    },
    {
      key: "expires",
      label: "Expires",
      render: (u) => u.expires_at ? new Date(u.expires_at).toLocaleDateString("id-ID") : "—",
    },
    {
      key: "clicks",
      label: "Clicks",
      render: (u) => <>{u.clicks_used || 0} / {u.max_clicks ?? "∞"}</>,
    },
    {
      key: "package_id",
      label: "Package",
      render: (u) => {
        const p = packages.find((x) => x.id === u.package_id);
        return p ? p.name : "—";
      },
    },
  ];

  const actions = (u) => (
    <div className="flex gap-2">
      <button onClick={() => setModal({ mode: "edit", data: u })} className="btn-ghost !text-xs" data-testid={`user-edit-${u.email}`}>
        <Pencil size={12} className="inline mr-1" /> Edit
      </button>
      {me.role === "superadmin" && u.id !== me.id && (
        <button onClick={() => del(u.id)} className="btn-danger" data-testid={`user-del-${u.email}`}>
          <Trash size={12} className="inline mr-1" /> Hapus
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="admin-users-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="badge badge-gold mb-2">USERS</div>
          <h1 className="section-title text-3xl">Manajemen User</h1>
        </div>
        <button onClick={() => setModal({ mode: "new", data: { role: "user", is_trial: true } })} className="btn-primary" data-testid="user-add-btn">
          <Plus size={16} className="inline mr-1" /> Tambah User
        </button>
      </div>

      <ResponsiveTable
        columns={columns}
        data={users}
        rowKey={(u) => u.email}
        actions={actions}
        testIdPrefix="user-row"
      />

      {modal && <UserModal modal={modal} packages={packages} me={me} err={err} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function UserModal({ modal, packages, me, err, onClose, onSave }) {
  const [form, setForm] = useState(modal.mode === "new"
    ? {
        email: "", password: "", name: "", role: "user", association: "",
        package_id: "", max_clicks: "", expires_at: "", status: "active", is_trial: false,
      }
    : { ...modal.data });

  // When package changes: auto-fill trial flag & max_clicks from package; clear manual fields
  const handlePackageChange = (pkgId) => {
    if (!pkgId) {
      setForm((f) => ({ ...f, package_id: "", max_clicks: "", expires_at: "", is_trial: false }));
      return;
    }
    const pkg = packages.find((p) => p.id === pkgId);
    setForm((f) => ({
      ...f,
      package_id: pkgId,
      is_trial: pkg?.is_trial ?? false,
      max_clicks: pkg?.max_clicks ?? null,
      expires_at: "",  // package handles duration; admin doesn't set manually
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    const hasPkg = !!payload.package_id;
    if (modal.mode === "edit") {
      delete payload.email; delete payload.password; delete payload.is_trial;
    }
    // When package is selected: clear manual expires_at & max_clicks (backend/package defines limits)
    if (hasPkg) {
      delete payload.expires_at;
      // Keep max_clicks from package auto-fill (already set in form state)
      if (payload.max_clicks === "" || payload.max_clicks == null) payload.max_clicks = null;
      else payload.max_clicks = parseInt(payload.max_clicks);
    } else {
      if (!payload.expires_at) delete payload.expires_at;
      else payload.expires_at = new Date(payload.expires_at.slice(0, 10)).toISOString();
      if (payload.max_clicks === "" || payload.max_clicks == null) payload.max_clicks = null;
      else payload.max_clicks = parseInt(payload.max_clicks);
      delete payload.package_id;
    }
    onSave(payload);
  };

  const roles = me.role === "superadmin"
    ? ["user", "marketing", "admin", "superadmin"]
    : ["user"];

  const isNew = modal.mode === "new";

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-bold text-xl">{isNew ? "Tambah User" : `Edit: ${form.name}`}</div>
            {isNew && <div className="text-xs text-[#A0AAB5] mt-0.5">Akun langsung aktif, bisa login langsung.</div>}
          </div>
          <button onClick={onClose} className="text-[#A0AAB5] hover:text-white" data-testid="modal-close"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isNew && (
            <>
              <div><label className="label-std">Email</label>
                <input required type="email" className="input-std" value={form.email}
                       onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="modal-email" />
              </div>
              <div><label className="label-std">Password</label>
                <input required type="password" className="input-std" value={form.password}
                       onChange={(e) => setForm({ ...form, password: e.target.value })}
                       placeholder="Password untuk login" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Nama Lengkap</label>
              <input required className="input-std" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="modal-name" />
            </div>
            <div><label className="label-std">Asosiasi</label>
              <input className="input-std" value={form.association || ""}
                     onChange={(e) => setForm({ ...form, association: e.target.value })}
                     placeholder="Opsional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-std">Role</label>
              <select className="input-std" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="modal-role">
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label-std">Status</label>
              <select className="input-std" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">✅ active (bisa login)</option>
                <option value="pending">⏳ pending (tunggu approval)</option>
                <option value="suspended">🚫 suspended</option>
              </select>
            </div>
          </div>

          {/* Package selector */}
          <div><label className="label-std">Paket</label>
            <select className="input-std" value={form.package_id || ""}
                    onChange={(e) => handlePackageChange(e.target.value)}>
              <option value="">— tanpa paket (akun free/trial manual) —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.is_trial ? " (Trial)" : ""}{p.max_clicks ? ` — ${p.max_clicks} klik` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Trial toggle: hanya tampil jika TIDAK ada paket */}
          {isNew && !form.package_id && (
            <label className="flex items-center gap-2 text-sm p-3 rounded-lg border border-white/10 bg-white/[0.03] cursor-pointer">
              <input type="checkbox" checked={!!form.is_trial} onChange={(e) => setForm({ ...form, is_trial: e.target.checked })} />
              <span className="font-semibold text-white">Akun Trial / Free</span>
              <span className="text-[#A0AAB5] text-xs ml-1">(tandai sebagai trial tanpa paket)</span>
            </label>
          )}

          {/* Expires & max_clicks: hanya tampil jika TIDAK ada paket */}
          {!form.package_id && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-std">Expires (opsional)</label>
                <input type="date" className="input-std"
                       value={form.expires_at ? form.expires_at.slice(0, 10) : ""}
                       onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                <div className="text-[10px] text-[#A0AAB5] mt-0.5">Kosong = tidak ada batas waktu</div>
              </div>
              <div>
                <label className="label-std">Maks Klik</label>
                <input type="number" min="1" className="input-std"
                       value={form.max_clicks ?? ""}
                       onChange={(e) => setForm({ ...form, max_clicks: e.target.value })} />
                <div className="text-[10px] text-[#A0AAB5] mt-0.5">Kosong = tidak terbatas</div>
              </div>
            </div>
          )}

          {/* Info paket terpilih */}
          {form.package_id && (() => {
            const pkg = packages.find((p) => p.id === form.package_id);
            return pkg ? (
              <div className="text-xs text-[#A0AAB5] p-2 rounded-lg border border-white/10 bg-white/[0.03]">
                📦 Paket <span className="text-white font-semibold">{pkg.name}</span>:&nbsp;
                {pkg.max_clicks ? `${pkg.max_clicks} klik` : "klik tidak terbatas"}.&nbsp;
                Durasi & klik diatur otomatis dari paket.
              </div>
            ) : null;
          })()}

          {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" data-testid="modal-save">
              {isNew ? "Buat Akun" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
