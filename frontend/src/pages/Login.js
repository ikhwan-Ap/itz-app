import React, { useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import Turnstile from "@/components/Turnstile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const onTurnstileVerify = useCallback((token) => setTurnstileToken(token), []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(email, password, turnstileToken);
      const dest = loc.state?.from || "/app";
      if (u.role === "marketing") nav("/app/marketing", { replace: true });
      else if (u.role === "admin" || u.role === "superadmin") nav("/app/admin", { replace: true });
      else nav(dest, { replace: true });
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-160px)] relative flex flex-col items-center justify-center pt-28 pb-16 px-4 overflow-hidden bg-[#0B0C10]" data-testid="page-login">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,95vw)] h-[min(640px,95vw)] pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, rgba(229,9,20,0.08) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative z-10 w-full max-w-[440px]">

        <div className="p-6 card-glass sm:p-8">
          <h1 className="font-display font-black text-2xl sm:text-[1.75rem] leading-tight brand-gradient mb-1.5">Welcome Back</h1>
          <p className="text-[#A0AAB5] text-sm mb-4 sm:mb-5">Login untuk lanjut training session Anda.</p>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="label-std">Email</label>
              <input type="email" required className="input-std" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                data-testid="login-email-input" />
            </div>
            <div>
              <label className="label-std">Password</label>
              <input type="password" required className="input-std" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                data-testid="login-password-input" />
            </div>
            {err && (
              <div className="badge badge-red w-full justify-center !py-2" data-testid="login-error">{err}</div>
            )}
            <Turnstile onVerify={onTurnstileVerify} />
            <button type="submit" disabled={loading} className="w-full btn-primary" data-testid="login-submit-btn">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-[#A0AAB5] hover:text-[#38BDF8]" data-testid="login-forgot-password-link">Lupa password?</Link>
          </div>

          <div className="mt-3 text-center text-sm text-[#A0AAB5]">
            Belum punya akun? <Link to="/register" className="text-[#38BDF8] font-bold hover:text-[#7DD3FC]" data-testid="login-to-register-link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
