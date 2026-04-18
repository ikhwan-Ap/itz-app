import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SignOut, SoccerBall, ChartBar, Users, Ticket, Package as PkgIcon, Newspaper, CalendarDots, CreditCard, Crown, Briefcase, Gauge } from "@phosphor-icons/react";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const role = user?.role;

  const items = [];
  items.push({ to: "/app", label: "Overview", icon: Gauge, roles: ["user", "admin", "superadmin", "marketing"] });
  items.push({ to: "/app/calculator", label: "Sniper Calculator", icon: SoccerBall, roles: ["user", "admin", "superadmin"] });
  items.push({ to: "/app/admin", label: "Admin Dashboard", icon: Crown, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/users", label: "Users", icon: Users, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/packages", label: "Packages", icon: PkgIcon, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/promos", label: "Promo Codes", icon: Ticket, roles: ["admin", "superadmin", "marketing"] });
  items.push({ to: "/app/admin/transactions", label: "Transactions", icon: ChartBar, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/news", label: "News CMS", icon: Newspaper, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/events", label: "Events CMS", icon: CalendarDots, roles: ["admin", "superadmin"] });
  items.push({ to: "/app/admin/payment", label: "Payment Config", icon: CreditCard, roles: ["superadmin"] });
  items.push({ to: "/app/marketing", label: "Marketing Dashboard", icon: Briefcase, roles: ["marketing", "admin", "superadmin"] });

  const visible = items.filter((it) => it.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-grain pitch-bg relative">
      {/* Sidebar */}
      <aside className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-[#0b1221]/80 backdrop-blur-md">
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-lg bg-[#00D05E] flex items-center justify-center glow-brand">
            <SoccerBall size={22} weight="fill" color="#0b1221" />
          </div>
          <div>
            <div className="font-display font-black text-xl leading-none">TE SNIPER</div>
            <div className="text-xs text-[#9BA4B5] mt-0.5">Training Calculator</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visible.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ` +
                (isActive
                  ? "bg-[#00D05E]/15 text-[#00D05E] border border-[#00D05E]/30"
                  : "text-[#9BA4B5] hover:bg-white/5 hover:text-white")
              }
              data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <it.icon size={18} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="text-xs text-[#9BA4B5] px-2 mb-2">Signed in as</div>
          <div className="px-2 mb-3">
            <div className="text-sm font-bold truncate" data-testid="sidebar-user-name">{user?.name}</div>
            <div className="text-xs text-[#9BA4B5] uppercase tracking-wide">{user?.role}</div>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 hover:border-[#FF3366] hover:text-[#FF3366] text-sm font-semibold text-[#9BA4B5] transition-all"
            data-testid="btn-logout"
          >
            <SignOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 relative z-10">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0b1221]/80 backdrop-blur-md sticky top-0 z-20">
          <Link to="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#00D05E] flex items-center justify-center">
              <SoccerBall size={18} weight="fill" color="#0b1221" />
            </div>
            <span className="font-display font-black">TE SNIPER</span>
          </Link>
          <button onClick={async () => { await logout(); nav("/login"); }} className="btn-outline !py-1.5 !px-3">Logout</button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
