import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { SoccerBall, Check } from "@phosphor-icons/react";

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
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

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
    if (pw !== pw2 && pw2.length < 4) { setErr("Second password minimal 4 karakter"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        email, password: pw, password2: pw2, name,
        association: association || null,
        package_id: packageId,
        promo_code: promoCode || null,
      });
      setOk(`Registrasi berhasil! ID transaksi: ${data.transaction_id.slice(0, 8)}. Akun akan diaktifkan setelah admin approve.`);
      setTimeout(() => nav("/login"), 4000);
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-10 bg-grain pitch-bg p-4">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1776160043138-52e2cf9c6e4e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHN0YWRpdW0lMjBsaWdodHMlMjBuaWdodHxlbnwwfHx8fDE3NzY1MzI0NzN8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: "cover", backgroundPosition: "center", filter: "blur(3px)",
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#00D05E] flex items-center justify-center glow-brand">
            <SoccerBall size={26} weight="fill" color="#0b1221" />
          </div>
          <div>
            <div className="font-display font-black text-2xl leading-none">TE SNIPER</div>
            <div className="text-xs text-[#9BA4B5] tracking-widest uppercase mt-0.5">Training Calculator</div>
          </div>
        </Link>

        <div className="card-glass p-8">
          <h1 className="section-title mb-2">Create Your Account</h1>
          <p className="text-[#9BA4B5] text-sm mb-6">Registrasi akan masuk antrian approval admin terlebih dahulu.</p>

          <form onSubmit={submit} className="space-y-5" data-testid="register-form">
            <div className="grid md:grid-cols-2 gap-4">
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
              <div className="grid md:grid-cols-3 gap-3">
                {packages.map((p) => (
                  <label
                    key={p.id}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${packageId === p.id ? "border-[#00D05E] bg-[#00D05E]/10" : "border-white/10 hover:border-white/30"}`}
                    data-testid={`register-pkg-${p.id}`}
                  >
                    <input type="radio" name="pkg" className="hidden" checked={packageId === p.id}
                           onChange={() => setPackageId(p.id)} />
                    <div className="text-xs font-bold uppercase tracking-widest text-[#9BA4B5]">{p.duration_type}</div>
                    <div className="font-display font-bold text-lg mt-1">{p.name}</div>
                    <div className="font-display font-black text-2xl text-[#00D05E] mt-2">{formatRupiah(p.price)}</div>
                    {p.is_trial && <div className="badge badge-gold mt-2">FREE TRIAL</div>}
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
              <div className="card-solid p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9BA4B5]">Harga paket</span>
                  <span className="font-bold">{formatRupiah(selectedPkg.price)}</span>
                </div>
                {promoResult && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-[#9BA4B5]">Diskon promo</span>
                    <span className="font-bold text-[#00D05E]">- {formatRupiah(promoResult.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="font-display font-bold uppercase text-sm">Total</span>
                  <span className="font-display font-black text-2xl text-[#00D05E]" data-testid="register-total">
                    {formatRupiah(promoResult ? promoResult.final_amount : selectedPkg.price)}
                  </span>
                </div>
              </div>
            )}

            {err && <div className="badge badge-red w-full justify-center !py-2" data-testid="register-error">{err}</div>}
            {ok && <div className="badge badge-green w-full justify-center !py-2" data-testid="register-success"><Check size={14} className="mr-1" />{ok}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="register-submit-btn">
              {loading ? "Processing..." : "Daftar & Kirim ke Approval"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#9BA4B5]">
            Sudah punya akun? <Link to="/login" className="text-[#00D05E] font-bold hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
