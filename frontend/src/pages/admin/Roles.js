import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import {
  Crown, Shield, Briefcase, User as UserIcon, CheckCircle, XCircle,
  ArrowRight, Info, Users,
} from "@phosphor-icons/react";

const ROLE_INFO = {
  superadmin: {
    icon: Crown,
    color: "#FFD700",
    label: "Super Admin",
    desc: "Akses penuh tanpa batasan. Hanya boleh 1 akun aktif di sistem.",
    count: 1,
  },
  admin: {
    icon: Shield,
    color: "#38BDF8",
    label: "Admin",
    desc: "Manajemen user, paket, transaksi, CMS. Tidak bisa ubah payment config atau delete data kritis.",
    count: null,
  },
  marketing: {
    icon: Briefcase,
    color: "#8b5cf6",
    label: "Marketing",
    desc: "Hanya kelola promo code milik sendiri + lihat dashboard marketing (earnings + konversi).",
    count: null,
  },
  user: {
    icon: UserIcon,
    color: "#10b981",
    label: "User",
    desc: "Akses fitur latihan (Full/Single/GK) sesuai paket. Tidak bisa akses area admin.",
    count: null,
  },
};

// Group permissions by category for display
const PERMISSION_GROUPS = {
  Dashboard: ["VIEW_DASHBOARD", "VIEW_ADMIN_STATS", "VIEW_MARKETING_STATS", "VIEW_USER_STATS"],
  Training: ["VIEW_TRAINING", "RUN_CALCULATOR"],
  "User Management": ["VIEW_USERS", "CREATE_USER", "UPDATE_USER", "DELETE_USER"],
  "Package & Promo": ["VIEW_PACKAGES", "MANAGE_PACKAGES", "VIEW_PROMOS", "MANAGE_PROMOS"],
  Transaction: ["VIEW_TRANSACTIONS", "APPROVE_TRANSACTION"],
  "Content Management": ["VIEW_CMS", "MANAGE_CMS"],
  "Payment Config": ["VIEW_PAYMENT_CONFIG", "MANAGE_PAYMENT_CONFIG"],
  Marketing: ["VIEW_MARKETING_DASHBOARD"],
  "Audit & Security": ["VIEW_AUDIT_LOGS"],
};

const ALL_ROLES = ["superadmin", "admin", "marketing", "user"];

function PermissionCell({ permission, role }) {
  const allowed = PERMISSIONS[permission]?.includes(role);
  return (
    <td className="text-center p-2">
      {allowed ? (
        <CheckCircle size={16} weight="fill" className="text-[#10b981] inline" />
      ) : (
        <XCircle size={16} weight="fill" className="text-[#5a5a6a]/40 inline" />
      )}
    </td>
  );
}

export default function AdminRoles() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";

  return (
    <div className="space-y-6" data-testid="admin-roles-page">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Crown size={16} className="text-[#FFD700]" weight="fill" />
          <div className="badge badge-gold">ROLE & PERMISSIONS</div>
        </div>
        <h1 className="section-title text-3xl">Role Management</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">
          Referensi lengkap role dan permission di sistem. Untuk ubah role user, buka menu Users.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-[#16161d] border border-[#38BDF8]/30 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} weight="fill" className="text-[#38BDF8] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-white mb-1">Cara ubah role user</div>
          <p className="text-sm text-[#a0a0b0]">
            Role ditetapkan per-user di menu <Link to="/app/admin/users" className="text-[#38BDF8] hover:text-[#7DD3FC] font-semibold">Users</Link>.
            Klik Edit pada user yang ingin diubah, pilih role baru, lalu Simpan.
            {!isSuperadmin && " Hanya Superadmin yang bisa memberikan role admin/superadmin/marketing."}
          </p>
        </div>
        <Link to="/app/admin/users" className="btn-primary shrink-0 !text-xs">
          <Users size={14} className="inline mr-1" /> Kelola Users
        </Link>
      </div>

      {/* Role Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Daftar Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_ROLES.map((roleKey) => {
            const info = ROLE_INFO[roleKey];
            const Icon = info.icon;
            const permCount = Object.keys(PERMISSIONS).filter(p => PERMISSIONS[p].includes(roleKey)).length;
            return (
              <div key={roleKey} className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${info.color}20`, border: `1px solid ${info.color}40` }}
                  >
                    <Icon size={22} weight="fill" color={info.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{info.label}</span>
                      <span className="text-[10px] font-mono text-[#5a5a6a] bg-[#0a0a0f] px-1.5 py-0.5 rounded">{roleKey}</span>
                    </div>
                    <p className="text-sm text-[#a0a0b0] mt-1">{info.desc}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="text-[#5a5a6a]">
                        <b className="text-[#38BDF8]">{permCount}</b> permissions
                      </span>
                      {info.count !== null && (
                        <span className="text-[#5a5a6a]">
                          Max <b className="text-[#FFD700]">{info.count}</b> akun
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Permission Matrix</h2>
        <div className="bg-[#16161d] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0f] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left p-3 text-[11px] uppercase tracking-widest text-[#5a5a6a] font-semibold">Permission</th>
                  {ALL_ROLES.map((r) => {
                    const info = ROLE_INFO[r];
                    const Icon = info.icon;
                    return (
                      <th key={r} className="p-3 text-center" style={{ minWidth: "90px" }}>
                        <div className="flex flex-col items-center gap-1">
                          <Icon size={16} weight="fill" style={{ color: info.color }} />
                          <span className="text-[10px] font-bold uppercase" style={{ color: info.color }}>{info.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => (
                  <React.Fragment key={groupName}>
                    <tr className="bg-[#0a0a0f]/50 border-t border-white/[0.06]">
                      <td colSpan={ALL_ROLES.length + 1} className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-[#38BDF8]">
                        {groupName}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={perm} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-mono text-xs">{perm}</td>
                        {ALL_ROLES.map((r) => <PermissionCell key={r} permission={perm} role={r} />)}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-[#5a5a6a] mt-2">
          <CheckCircle size={12} weight="fill" className="text-[#10b981] inline mr-1" /> = Diizinkan ·
          <XCircle size={12} weight="fill" className="text-[#5a5a6a]/60 inline mx-1" /> = Ditolak
        </p>
      </div>

      {/* Quick action */}
      <div className="flex justify-center pt-2">
        <Link to="/app/admin/users" className="btn-primary">
          <Users size={16} className="inline mr-2" />
          Buka Users untuk Ubah Role
          <ArrowRight size={14} className="inline ml-2" />
        </Link>
      </div>
    </div>
  );
}
