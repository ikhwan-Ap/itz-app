import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Gauge, SoccerBall, Clock, Warning, CheckCircle } from "@phosphor-icons/react";

export default function UserOverview() {
  const { user } = useAuth();
  if (!user) return null;

  const now = new Date();
  const exp = user.expires_at ? new Date(user.expires_at) : null;
  const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : null;
  const clicksLeft = user.max_clicks != null ? Math.max(0, user.max_clicks - (user.clicks_used || 0)) : null;
  const expiring = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="space-y-6" data-testid="user-dashboard">
      <div>
        <div className="badge badge-green mb-2"><Gauge size={12} className="inline mr-1" /> DASHBOARD</div>
        <h1 className="section-title text-3xl">Welcome, {user.name}</h1>
        <p className="text-[#9BA4B5] text-sm mt-1">Role: <span className="uppercase font-bold">{user.role}</span></p>
      </div>

      {/* Expiry warning */}
      {exp && daysLeft <= 0 && (
        <div className="card-solid p-5 border-[#FF3366]/40 border">
          <div className="flex items-center gap-3">
            <Warning size={28} weight="fill" className="text-[#FF3366]" />
            <div>
              <div className="font-display font-bold text-lg">Akun Anda Sudah Expired</div>
              <div className="text-sm text-[#9BA4B5]">Silakan perpanjang paket untuk melanjutkan.</div>
            </div>
          </div>
        </div>
      )}
      {exp && daysLeft > 0 && expiring && (
        <div className="card-solid p-5 border-[#F5C300]/40 border" data-testid="expiry-warning">
          <div className="flex items-center gap-3">
            <Warning size={28} weight="fill" className="text-[#F5C300]" />
            <div>
              <div className="font-display font-bold text-lg">Akun Akan Expired dalam {daysLeft} hari</div>
              <div className="text-sm text-[#9BA4B5]">Perpanjang sekarang agar training tidak terputus.</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-solid p-5">
          <div className="text-xs text-[#9BA4B5] uppercase tracking-widest font-bold">Package</div>
          <div className="font-display font-black text-2xl mt-1">{user.package?.name || "—"}</div>
          <div className="text-xs text-[#9BA4B5] mt-1">{user.package?.description || "Tidak ada paket aktif"}</div>
        </div>
        <div className="card-solid p-5">
          <div className="text-xs text-[#9BA4B5] uppercase tracking-widest font-bold">Expires</div>
          <div className="font-display font-black text-2xl mt-1">{exp ? `${daysLeft} hari` : "Unlimited"}</div>
          <div className="text-xs text-[#9BA4B5] mt-1">{exp ? exp.toLocaleDateString("id-ID") : "Tanpa batas waktu"}</div>
        </div>
        <div className="card-solid p-5">
          <div className="text-xs text-[#9BA4B5] uppercase tracking-widest font-bold">Clicks Remaining</div>
          <div className="font-display font-black text-2xl mt-1">{clicksLeft != null ? clicksLeft : "Unlimited"}</div>
          <div className="text-xs text-[#9BA4B5] mt-1">{user.clicks_used || 0} dari {user.max_clicks || "∞"} terpakai</div>
        </div>
      </div>

      <div className="card-solid p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-[#00D05E]/15 flex items-center justify-center text-[#00D05E]">
          <SoccerBall size={32} weight="fill" />
        </div>
        <div className="flex-1">
          <div className="font-display font-black text-2xl">Sniper Calculator</div>
          <div className="text-sm text-[#9BA4B5] mt-1">Cari rute drill paling efisien untuk mencapai target mutu pemain Anda.</div>
        </div>
        <Link to="/app/calculator" className="btn-primary whitespace-nowrap" data-testid="open-calculator-btn">
          Open Calculator
        </Link>
      </div>

      <div className="card-solid p-6">
        <div className="font-display font-bold text-lg mb-3">Tips</div>
        <ul className="space-y-2 text-sm text-[#9BA4B5]">
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#00D05E] shrink-0" /> Prioritas 1 = atribut utama. Prioritas 2/3 akan dikerjakan setelah prio 1 selesai.</li>
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#00D05E] shrink-0" /> Naikkan "Batas Limit Gelap" hanya jika atribut non-kuncian aman untuk dikorbankan.</li>
          <li className="flex gap-2"><CheckCircle size={18} className="text-[#00D05E] shrink-0" /> Single Drill mode: cocok untuk cek efek 1 drill tertentu terhadap target Anda.</li>
        </ul>
      </div>
    </div>
  );
}
