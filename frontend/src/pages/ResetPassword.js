import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = useMemo(() => params.get("token") || "", [params]);
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [done, setDone] = useState(false);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErr("");

        if (!token) {
            setErr("Token reset tidak ada. Silakan minta link baru.");
            return;
        }
        if (password.length < 6) {
            setErr("Password minimal 6 karakter");
            return;
        }
        if (password !== password2) {
            setErr("Konfirmasi password tidak cocok");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password, password2 });
            setDone(true);
            setTimeout(() => nav("/login", { replace: true }), 2500);
        } catch (e) {
            setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-[calc(100dvh-160px)] relative flex flex-col items-center justify-center pt-28 pb-16 px-4 overflow-hidden bg-[#0B0C10]"
            data-testid="page-reset-password"
        >
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,95vw)] h-[min(640px,95vw)] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, rgba(229,9,20,0.08) 35%, transparent 70%)",
                    filter: "blur(40px)",
                }}
            />
            <div className="relative z-10 w-full max-w-[440px]">
                <div className="p-6 card-glass sm:p-8">
                    <h1 className="font-display font-black text-2xl sm:text-[1.75rem] leading-tight brand-gradient mb-1.5">
                        Reset Password
                    </h1>
                    <p className="text-[#A0AAB5] text-sm mb-4 sm:mb-5">
                        Masukkan password baru untuk akun Anda.
                    </p>

                    {!token && (
                        <div
                            className="badge badge-red w-full justify-center !py-3 mb-4 whitespace-normal text-center"
                            data-testid="reset-password-no-token"
                        >
                            Token tidak ditemukan di URL. Silakan minta link reset baru.
                        </div>
                    )}

                    {done ? (
                        <div className="space-y-4" data-testid="reset-password-success">
                            <div className="badge badge-green w-full justify-center !py-3 text-center whitespace-normal">
                                Password berhasil direset. Mengarahkan ke halaman login...
                            </div>
                            <Link to="/login" className="block w-full btn-primary text-center">
                                Login Sekarang
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-4" data-testid="reset-password-form">
                            <div>
                                <label className="label-std">Password Baru</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="input-std"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    data-testid="reset-password-input"
                                />
                            </div>
                            <div>
                                <label className="label-std">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="input-std"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    placeholder="••••••••"
                                    data-testid="reset-password-confirm-input"
                                />
                            </div>
                            {err && (
                                <div
                                    className="badge badge-red w-full justify-center !py-2 whitespace-normal text-center"
                                    data-testid="reset-password-error"
                                >
                                    {err}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full btn-primary"
                                data-testid="reset-password-submit-btn"
                            >
                                {loading ? "Memproses..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-[#A0AAB5]">
                        <Link
                            to="/login"
                            className="text-[#38BDF8] font-bold hover:text-[#7DD3FC]"
                            data-testid="reset-password-to-login-link"
                        >
                            Kembali ke Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
