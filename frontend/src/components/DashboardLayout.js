import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  SignOut, SoccerBall, ChartBar, Users, Ticket, Package as PkgIcon, Newspaper,
  CalendarDots, CreditCard, Crown, Briefcase, Gauge, Barbell
} from "@phosphor-icons/react";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const role = user?.role;

  const items = [];
  items.push({ to: "/app", label: "Overview", icon: Gauge, roles: ["user", "admin", "superadmin", "marketing"] });
  items.push({ to: "/app/training", label: "Modul Latihan", icon: Barbell, roles: ["user", "admin", "superadmin"] });
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
    <div className="min-h-screen flex bg-ambient bg-grain relative">
      {/* Sidebar */}
      <aside className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-[#060F1F]/85 backdrop-blur-md shrink-0">
        <Link to="/app" className="p-5 flex items-center border-b border-white/5 hover:bg-white/[0.02] transition-colors">
          <Logo size={40} showText={true} compact={true} />
        </Link>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visible.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ` +
                (isActive
                  ? "bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#E8C35A] border-l-2 border-[#D4AF37]"
                  : "text-[#9FB0CC] hover:bg-white/[0.04] hover:text-white border-l-2 border-transparent")
              }
              data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <it.icon size={18} weight="duotone" className="group-hover:scale-110 transition-transform" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="text-[10px] tracking-widest text-[#D4AF37] font-bold px-2 mb-1 uppercase">Signed in</div>
          <div className="px-2 mb-3">
            <div className="text-sm font-bold truncate text-white" data-testid="sidebar-user-name">{user?.name}</div>
            <div className="text-xs text-[#9FB0CC] uppercase tracking-wider">{user?.role}</div>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 hover:border-[#F0557A] hover:text-[#F0557A] text-sm font-semibold text-[#9FB0CC] transition-all duration-200"
            data-testid="btn-logout"
          >
            <SignOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 relative z-10">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#060F1F]/90 backdrop-blur-md sticky top-0 z-20">
          <Link to="/app"><Logo size={34} showText={true} compact={true} /></Link>
          <button onClick={async () => { await logout(); nav("/login"); }} className="btn-outline !py-1.5 !px-3 !text-xs">Logout</button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto page-enter">{children}</div>
      </main>
    </div>
  );
}
