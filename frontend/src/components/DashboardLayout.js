import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  SignOut, ChartBar, Users, Ticket, Package as PkgIcon, Newspaper,
  CalendarDots, CreditCard, Crown, Briefcase, Gauge, Barbell, List, X
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const role = user?.role;
  const [drawerOpen, setDrawerOpen] = useState(false);

  React.useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

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

  const NavItems = ({ onClick }) => (
    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
      {visible.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/app"}
          onClick={onClick}
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
  );

  const UserFooter = () => (
    <div className="p-3 border-t border-white/5 shrink-0">
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
  );

  return (
    <div className="min-h-screen flex bg-ambient bg-grain relative">
      {/* Desktop sidebar */}
      <aside className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-[#060F1F]/85 backdrop-blur-md shrink-0 sticky top-0 h-screen z-20">
        <Link to="/app" className="p-5 flex items-center border-b border-white/5 hover:bg-white/[0.02] transition-colors shrink-0">
          <Logo size={40} showText={true} compact={true} />
        </Link>
        <NavItems />
        <UserFooter />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              data-testid="drawer-overlay"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#060F1F] border-r border-[#D4AF37]/20 z-50 lg:hidden flex flex-col"
              data-testid="mobile-drawer"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <Link to="/app" onClick={() => setDrawerOpen(false)}><Logo size={38} compact={true} /></Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-[#9FB0CC] hover:text-white hover:border-[#D4AF37]"
                  data-testid="drawer-close"
                >
                  <X size={18} />
                </button>
              </div>
              <NavItems onClick={() => setDrawerOpen(false)} />
              <UserFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 min-w-0 relative z-10 overflow-x-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#060F1F]/90 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
            aria-label="Open menu"
            data-testid="hamburger-btn"
          >
            <List size={20} weight="bold" />
          </button>
          <Link to="/app" className="flex-1 flex justify-center mx-3">
            <Logo size={32} showText={true} compact={true} />
          </Link>
          <div className="w-10 h-10" />
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto page-enter">{children}</div>
      </main>
    </div>
  );
}
