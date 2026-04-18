import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PaymentConfig() {
  const { user } = useAuth();
  const [cfg, setCfg] = useState(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const disabled = user.role !== "superadmin";

  useEffect(() => {
    api.get("/payment-config").then((r) => setCfg(r.data));
  }, []);

  const save = async () => {
    setErr(""); setSaved(false);
    try { await api.patch("/payment-config", cfg); setSaved(true); }
    catch (e) { setErr(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  if (!cfg) return <div className="spinner mx-auto my-20" />;

  return (
    <div className="space-y-6" data-testid="admin-payment-page">
      <div>
        <div className="badge badge-gold mb-2">PAYMENT CONFIG</div>
        <h1 className="section-title text-3xl">Payment Gateway</h1>
        <p className="text-[#9BA4B5] text-sm mt-1">Konfigurasi approval manual, Xendit, & Midtrans. Otomatis siap aktif jika diisi.</p>
      </div>

      <div className="card-solid p-6 space-y-5">
        <Section title="Manual (Default)" desc="Approval transaksi dilakukan manual oleh admin.">
          <label className="flex items-center gap-2 text-sm"><input disabled={disabled} type="checkbox" checked={!!cfg.manual_enabled} onChange={(e) => setCfg({ ...cfg, manual_enabled: e.target.checked })} /> Manual Enabled</label>
          <div className="mt-3"><label className="label-std">Bank Info / Payment Instructions</label><textarea disabled={disabled} rows="3" className="input-std" value={cfg.bank_info || ""} onChange={(e) => setCfg({ ...cfg, bank_info: e.target.value })} /></div>
        </Section>

        <Section title="Xendit" desc="Pembayaran otomatis (siap aktif saat keys diisi).">
          <label className="flex items-center gap-2 text-sm"><input disabled={disabled} type="checkbox" checked={!!cfg.xendit_enabled} onChange={(e) => setCfg({ ...cfg, xendit_enabled: e.target.checked })} /> Xendit Enabled</label>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div><label className="label-std">API Key</label><input disabled={disabled} type="password" className="input-std" value={cfg.xendit_api_key || ""} onChange={(e) => setCfg({ ...cfg, xendit_api_key: e.target.value })} /></div>
            <div><label className="label-std">Webhook Token</label><input disabled={disabled} type="password" className="input-std" value={cfg.xendit_webhook_token || ""} onChange={(e) => setCfg({ ...cfg, xendit_webhook_token: e.target.value })} /></div>
          </div>
        </Section>

        <Section title="Midtrans" desc="Pembayaran otomatis (siap aktif saat keys diisi).">
          <label className="flex items-center gap-2 text-sm"><input disabled={disabled} type="checkbox" checked={!!cfg.midtrans_enabled} onChange={(e) => setCfg({ ...cfg, midtrans_enabled: e.target.checked })} /> Midtrans Enabled</label>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div><label className="label-std">Server Key</label><input disabled={disabled} type="password" className="input-std" value={cfg.midtrans_server_key || ""} onChange={(e) => setCfg({ ...cfg, midtrans_server_key: e.target.value })} /></div>
            <div><label className="label-std">Client Key</label><input disabled={disabled} className="input-std" value={cfg.midtrans_client_key || ""} onChange={(e) => setCfg({ ...cfg, midtrans_client_key: e.target.value })} /></div>
          </div>
        </Section>

        {err && <div className="badge badge-red w-full justify-center !py-2">{err}</div>}
        {saved && <div className="badge badge-green w-full justify-center !py-2">Config saved.</div>}
        {!disabled && (
          <button onClick={save} className="btn-primary w-full" data-testid="payment-save-btn">Save Configuration</button>
        )}
        {disabled && <div className="text-xs text-[#9BA4B5] text-center">Hanya Superadmin yang dapat mengubah konfigurasi pembayaran.</div>}
      </div>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
      <div className="font-display font-bold text-lg">{title}</div>
      <div className="text-xs text-[#9BA4B5] mb-3">{desc}</div>
      {children}
    </div>
  );
}
