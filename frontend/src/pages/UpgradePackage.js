import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Check, ArrowUp, CaretLeft } from "@phosphor-icons/react";

export default function UpgradePackagePage() {
  const { user, refresh } = useAuth();
  const [packages, setPackages] = useState([]);
  const [packageId, setPackageId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/packages").then((r) => {
      // hide trial packages from upgrade flow
      const list = (r.data || []).filter((p) => !p.is_trial);
      setPackages(list);
    });
  }, []);

  const selectedPkg = packages.find((p) => p.id === packageId);
  const isCurrentPackage = user?.package_id === packageId;

  const validatePromo = async () => {
    setErr(""); setPromoResult(null);
    if (!promoCode || !packageId) {
      setErr("Pilih paket dulu, lalu masukkan promo code");
      return;
    }
    try {
      const { data } = await api.get(`/promos/validate/${promoCode.trim().toUpperCase()}?package_id=${packageId}`);
      setPromoResult(data);
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    if (!packageId) { setErr("Pilih paket dulu"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/upgrade-package", {
        package_id: packageId,
        promo_code: promoCode || null,
      });
      const action = data.tx_type === "renewal" ? "perpanjang" : "upgrade";
      setOk(`Permintaan ${action} dibuat. Mengarahkan ke pembayaran...`);
      await refresh();
      setTimeout(() => nav(`/app/payment?tx=${data.transaction_id}`), 1500);
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="upgrade-package-page">
      <div>
        <Link to="/app" className="text-xs text-[#A0AAB5] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1 transition">
          <CaretLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-center gap-2 mt-1 mb-1">
          <ArrowUp size={18} className="text-[#38BDF8]" weight="fill" />
          <div className="badge badge-gold">UPGRADE</div>
        </div>
        <h1 className="section-title text-3xl">Upgrade / Perpanjang Paket</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">
          Pilih paket baru atau perpanjang paket yang sama. Setelah disetujui admin, paket aktif otomatis.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label-std">Pilih Paket</label>
          <div className="grid gap-3 md:grid-cols-3">
            {packages.map((p) => {
              const isCurrent = user?.package_id === p.id;
              return (
                <label
                  key={p.id}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${packageId === p.id ? "border-[#38BDF8] bg-[#38BDF8]/10" : "border-white/10 hover:border-white/30"}`}
                  data-testid={`upgrade-pkg-${p.id}`}
                >
                  <input type="radio" name="pkg" className="hidden" checked={packageId === p.id}
                         onChange={() => { setPackageId(p.id); setPromoResult(null); }} />
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#A0AAB5]">{p.duration_type}</div>
                    {isCurrent && <span className="badge badge-blue !text-[10px]">PAKET SAAT INI</span>}
                  </div>
                  <div className="mt-1 text-lg font-bold font-display">{p.name}</div>
                  <div className="font-display font-black text-2xl text-[#38BDF8] mt-2">{formatRupiah(p.price)}</div>
                  <div className="text-xs text-[#A0AAB5] mt-1">{p.duration_value} {p.duration_type === "yearly" ? "tahun" : "bulan"}</div>
                  {(p.features || []).slice(0, 3).map((f, i) => (
                    <div key={i} className="text-xs text-[#A0AAB5] mt-1 flex items-start gap-1">
                      <Check size={10} className="text-[#3FCA7C] mt-0.5 shrink-0" /> {f}
                    </div>
                  ))}
                </label>
              );
            })}
          </div>
          {isCurrentPackage && (
            <div className="mt-2 text-xs text-[#7DD3FC]">
              Anda memilih paket yang sama → ini akan diproses sebagai <b>perpanjangan</b> (durasi ditambah dari expiry saat ini).
            </div>
          )}
        </div>

        <div>
          <label className="label-std">Promo Code (opsional)</label>
          <div className="flex gap-2">
            <input className="input-std" value={promoCode}
                   onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                   placeholder="WELCOME20" data-testid="upgrade-promo-input" />
            <button type="button" onClick={validatePromo} className="btn-outline whitespace-nowrap" data-testid="upgrade-promo-validate-btn">Cek</button>
          </div>
          {promoResult && (
            <div className="mt-2 badge badge-green">
              Diskon {formatRupiah(promoResult.discount)} · Total bayar: {formatRupiah(promoResult.final_amount)}
            </div>
          )}
        </div>

        {selectedPkg && (
          <div className="p-4 card-solid">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#A0AAB5]">Harga paket</span>
              <span className="font-bold">{formatRupiah(selectedPkg.price)}</span>
            </div>
            {promoResult && (
              <div className="flex items-center justify-between mt-1 text-sm">
                <span className="text-[#A0AAB5]">Diskon promo</span>
                <span className="font-bold text-[#38BDF8]">- {formatRupiah(promoResult.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
              <span className="text-sm font-bold uppercase font-display">Total</span>
              <span className="font-display font-black text-2xl text-[#38BDF8]" data-testid="upgrade-total">
                {formatRupiah(promoResult ? promoResult.final_amount : selectedPkg.price)}
              </span>
            </div>
          </div>
        )}

        {err && <div className="badge badge-red w-full justify-center !py-2" data-testid="upgrade-error">{err}</div>}
        {ok && <div className="badge badge-green w-full justify-center !py-2" data-testid="upgrade-success"><Check size={14} className="mr-1" />{ok}</div>}

        <button type="submit" disabled={loading || !packageId} className="w-full btn-primary" data-testid="upgrade-submit-btn">
          {loading ? "Processing..." : isCurrentPackage ? "Kirim Permintaan Perpanjangan" : "Kirim Permintaan Upgrade"}
        </button>
      </form>
    </div>
  );
}
