import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { Check } from "@phosphor-icons/react";
import Turnstile from "@/components/Turnstile";

export default function RegisterPage() {
  const [sp] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [packageId, setPackageId] = useState(sp.get("package") || "");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [name, setName] = useState("");
  const [association, setAssociation] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onTurnstileVerify = useCallback((token) => setTurnstileToken(token), []);

  useEffect(() => {
    api.get("/packages").then((r) => {
      setPackages(r.data);
      if (!packageId && r.data.length) setPackageId(r.data[0].id);
    });
  }, []);

  const selectedPkg = packages.find((p) => p.id === packageId);

  const validatePromo = async () => {
    setErr(""); setPromoResult(null);
    if (!promoCode || !packageId) return;
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
    if (pw !== pw2) { setErr("Password dan 2nd password harus sama"); return; }
    if (pw2.length < 4) { setErr("Second password minimal 4 karakter"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        email, password: pw, password2: pw2, name,
        association: association || null,
        package_id: packageId,
        promo_code: promoCode || null,
        turnstile_token: turnstileToken,
      });
      const selectedPkg = packages.find((p) => p.id === packageId);
      if (selectedPkg?.is_trial || data.final_amount === 0) {
        setOk("Registrasi trial berhasil! Akun langsung aktif. Mengarahkan ke login...");
        setTimeout(() => nav("/login"), 2000);
      } else {
        setOk("Registrasi berhasil. Menuju pembayaran...");
        setTimeout(() => nav(`/payment?tx=${data.transaction_id}`), 1500);
      }
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-160px)] relative flex flex-col items-center pt-28 pb-16 px-4 overflow-hidden bg-[#0B0C10]" data-testid="page-register">
      {/* Soft gradient aurora glow - centered */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(720px,95vw)] h-[min(720px,95vw)] pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, rgba(229,9,20,0.08) 38%, transparent 72%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative z-10 w-full max-w-3xl">

        <div className="p-6 card-glass sm:p-8">
          <h1 className="font-display font-black text-2xl sm:text-[1.75rem] leading-tight brand-gradient mb-1.5">Bergabung dengan Komunitas</h1>
          <p className="text-[#A0AAB5] text-sm mb-4 sm:mb-5">Registrasi masuk antrian approval admin. Welcome to Indo Timezone.</p>

          <form onSubmit={submit} className="space-y-5" data-testid="register-form">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label-std">Nama Lengkap</label>
                <input required className="input-std" value={name} onChange={(e) => setName(e.target.value)}
                       placeholder="Nama lengkap" data-testid="register-name-input" />
              </div>
              <div>
                <label className="label-std">Email</label>
                <input required type="email" className="input-std" value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com" data-testid="register-email-input" />
              </div>
              <div>
                <label className="label-std">Password</label>
                <input required type="password" className="input-std" value={pw} onChange={(e) => setPw(e.target.value)}
                       placeholder="Minimal 6 karakter" data-testid="register-password-input" />
              </div>
              <div>
                <label className="label-std">2nd Password (keamanan tambahan)</label>
                <input required type="password" className="input-std" value={pw2} onChange={(e) => setPw2(e.target.value)}
                       placeholder="Password kedua" data-testid="register-password2-input" />
              </div>
              <div className="md:col-span-2">
                <label className="label-std">Asosiasi (Opsional)</label>
                <input className="input-std" value={association} onChange={(e) => setAssociation(e.target.value)}
                       placeholder="Nama asosiasi / klub / tim" data-testid="register-assoc-input" />
              </div>
            </div>

            <div>
              <label className="label-std">Pilih Paket</label>
              <div className="grid gap-3 md:grid-cols-3">
                {packages.map((p) => (
                  <label
                    key={p.id}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${packageId === p.id ? "border-[#38BDF8] bg-[#38BDF8]/10" : "border-white/10 hover:border-white/30"}`}
                    data-testid={`register-pkg-${p.id}`}
                  >
                    <input type="radio" name="pkg" className="hidden" checked={packageId === p.id}
                           onChange={() => setPackageId(p.id)} />
                    <div className="text-xs font-bold uppercase tracking-widest text-[#A0AAB5]">{p.duration_type}</div>
                    <div className="mt-1 text-lg font-bold font-display">{p.name}</div>
                    <div className="font-display font-black text-2xl text-[#38BDF8] mt-2">{formatRupiah(p.price)}</div>
                    {p.is_trial && <div className="mt-2 badge badge-gold">FREE TRIAL</div>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label-std">Promo Code (opsional)</label>
              <div className="flex gap-2">
                <input className="input-std" value={promoCode}
                       onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                       placeholder="WELCOME20" data-testid="register-promo-input" />
                <button type="button" onClick={validatePromo} className="btn-outline whitespace-nowrap" data-testid="register-promo-validate-btn">Cek</button>
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
                  <span className="font-display font-black text-2xl text-[#38BDF8]" data-testid="register-total">
                    {formatRupiah(promoResult ? promoResult.final_amount : selectedPkg.price)}
                  </span>
                </div>
              </div>
            )}

            {err && <div className="badge badge-red w-full justify-center !py-2" data-testid="register-error">{err}</div>}
            {ok && <div className="badge badge-green w-full justify-center !py-2" data-testid="register-success"><Check size={14} className="mr-1" />{ok}</div>}

            <Turnstile onVerify={onTurnstileVerify} />
            <button type="submit" disabled={loading} className="w-full btn-primary" data-testid="register-submit-btn">
              {loading ? "Processing..." : "Daftar & Kirim ke Approval"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#A0AAB5]">
            Sudah punya akun? <Link to="/login" className="text-[#38BDF8] font-bold hover:text-[#7DD3FC]">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
