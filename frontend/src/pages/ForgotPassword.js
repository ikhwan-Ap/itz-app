import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/forgot-password", { email });
            setMsg(data?.message || "Jika email terdaftar, link reset password akan dikirim.");
            setSent(true);
        } catch (e) {
            setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-[calc(100dvh-160px)] relative flex flex-col items-center justify-center pt-28 pb-16 px-4 overflow-hidden bg-[#0B0C10]"
            data-testid="page-forgot-password"
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
                        Lupa Password
                    </h1>
                    <p className="text-[#A0AAB5] text-sm mb-4 sm:mb-5">
                        Masukkan email akun Anda. Kami akan kirim link reset password jika
                        email terdaftar.
                    </p>

                    {sent ? (
                        <div className="space-y-4" data-testid="forgot-password-sent">
                            <div className="badge badge-green w-full justify-center !py-3 text-center whitespace-normal">
                                {msg}
                            </div>
                            <p className="text-sm text-[#A0AAB5]">
                                Cek inbox email Anda (juga folder spam). Link hanya berlaku 60 menit.
                            </p>
                            <Link
                                to="/login"
                                className="block w-full btn-primary text-center"
                                data-testid="forgot-password-back-login"
                            >
                                Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-4" data-testid="forgot-password-form">
                            <div>
                                <label className="label-std">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input-std"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    data-testid="forgot-password-email-input"
                                />
                            </div>
                            {err && (
                                <div
                                    className="badge badge-red w-full justify-center !py-2"
                                    data-testid="forgot-password-error"
                                >
                                    {err}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary"
                                data-testid="forgot-password-submit-btn"
                            >
                                {loading ? "Mengirim..." : "Kirim Link Reset"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-[#A0AAB5]">
                        <Link
                            to="/login"
                            className="text-[#38BDF8] font-bold hover:text-[#7DD3FC]"
                            data-testid="forgot-password-to-login-link"
                        >
                            Kembali ke Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
