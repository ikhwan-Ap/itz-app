import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(email, password);
      const dest = loc.state?.from || "/app";
      // Role-based landing
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
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-ambient bg-grain px-4 py-6 sm:py-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,95vw)] h-[min(640px,95vw)] pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(212,175,55,0.18) 0%, rgba(30,58,107,0.12) 35%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <Link to="/" className="flex items-center justify-center mb-6 sm:mb-8">
          <Logo size={52} />
        </Link>

        <div className="card-glass p-5 sm:p-8">
          <h1 className="font-display font-black text-3xl sm:text-[2rem] leading-tight brand-gradient mb-2">Welcome Back</h1>
          <p className="text-[#9FB0CC] text-sm mb-5 sm:mb-6">Login untuk lanjut training session Anda.</p>

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
            <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="login-submit-btn">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#9FB0CC]">
            Belum punya akun? <Link to="/register" className="text-[#D4AF37] font-bold hover:text-[#E8C35A]" data-testid="login-to-register-link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
