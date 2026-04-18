import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import { SoccerBall } from "@phosphor-icons/react";

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
    <div className="min-h-screen relative flex items-center justify-center bg-grain pitch-bg p-4">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1776160043138-52e2cf9c6e4e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHN0YWRpdW0lMjBsaWdodHMlMjBuaWdodHxlbnwwfHx8fDE3NzY1MzI0NzN8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
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
          <h1 className="section-title mb-2">Welcome Back</h1>
          <p className="text-[#9BA4B5] text-sm mb-6">Login to continue your training session.</p>

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

          <div className="mt-6 text-center text-sm text-[#9BA4B5]">
            Don't have an account? <Link to="/register" className="text-[#00D05E] font-bold hover:underline" data-testid="login-to-register-link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
