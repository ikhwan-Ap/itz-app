import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  SignOut, ChartBar, Users, Ticket, Package as PkgIcon, Newspaper,
  CalendarDots, CreditCard, Crown, Briefcase, Gauge, Barbell, List, X,
  CaretLeft, CaretRight, MagnifyingGlass, CaretDown, User as UserIcon, GearSix, Crosshair,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import CommandPalette from "@/components/dashboard/CommandPalette";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";

const ALL_NAV = [
  { to: "/app", label: "Dashboard", icon: Gauge, roles: ["user", "admin", "superadmin", "marketing"], end: true },
  { to: "/app/training", label: "Tactical Sniper", icon: Crosshair, roles: ["user", "admin", "superadmin"] },
  { to: "/app/training/full", label: "Full Latihan", icon: Crosshair, roles: ["user", "admin", "superadmin"], indent: true },
  { to: "/app/training/single", label: "Single Drill", icon: Crosshair, roles: ["user", "admin", "superadmin"], indent: true },
  { to: "/app/training/gk", label: "GK Latihan", icon: Crosshair, roles: ["user", "admin", "superadmin"], indent: true },
  { to: "/app/admin", label: "Admin", icon: Crown, roles: ["admin", "superadmin"] },
  { to: "/app/admin/users", label: "Users", icon: Users, roles: ["admin", "superadmin"] },
  { to: "/app/admin/packages", label: "Packages", icon: PkgIcon, roles: ["admin", "superadmin"] },
  { to: "/app/admin/promos", label: "Promo Codes", icon: Ticket, roles: ["admin", "superadmin", "marketing"] },
  { to: "/app/admin/transactions", label: "Transactions", icon: ChartBar, roles: ["admin", "superadmin"] },
  { to: "/app/admin/news", label: "News CMS", icon: Newspaper, roles: ["admin", "superadmin"] },
  { to: "/app/admin/events", label: "Events CMS", icon: CalendarDots, roles: ["admin", "superadmin"] },
  { to: "/app/admin/payment", label: "Payment Config", icon: CreditCard, roles: ["superadmin"] },
  { to: "/app/marketing", label: "Marketing", icon: Briefcase, roles: ["marketing", "admin", "superadmin"] },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const role = user?.role;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("dash_sidebar_collapsed") === "1";
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { setDrawerOpen(false); setProfileOpen(false); }, [loc.pathname]);
  useEffect(() => { localStorage.setItem("dash_sidebar_collapsed", collapsed ? "1" : "0"); }, [collapsed]);

  const items = ALL_NAV.filter((it) => it.roles.includes(role));

  const initials = (user?.name || user?.email || "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  // Page title from active nav — pick most-specific (longest) match
  const activeItem = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((it) => it.end
      ? loc.pathname === it.to
      : (loc.pathname === it.to || loc.pathname.startsWith(it.to + "/"))
    ) || items[0];

  const handleLogout = async () => { await logout(); nav("/login"); };

  const NavLinks = ({ onItemClick }) => (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 no-scrollbar">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={!!it.end}
          onClick={onItemClick}
          className={({ isActive }) =>
            `relative flex items-center gap-3 h-11 rounded-lg transition-all duration-150 group ` +
            (it.indent ? "pl-7 pr-3" : "px-3") +
            " " +
            (isActive
              ? "text-[#38BDF8] bg-[rgba(56,189,248,0.13)]"
              : "text-[#5a5a6a] hover:text-[#a0a0b0] hover:bg-[#1c1c25]")
          }
          data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="dash-sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-sm bg-[#38BDF8]"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <it.icon size={it.indent ? 15 : 18} weight="duotone" className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`font-medium tracking-wide whitespace-nowrap ${it.indent ? "text-[12px]" : "text-[13px]"}`}
                  >
                    {it.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const SidebarLogo = () => (
    <div className="px-5 pt-5 pb-4">
      <Link to="/app" className="flex items-center gap-3" data-testid="sidebar-logo">
        <img
          src="/assets/itz-logo.png"
          alt="Indo Timezone"
          style={{
            width: 38, height: 38, borderRadius: "50%",
            boxShadow: "0 0 18px rgba(56, 189, 248, 0.32)",
          }}
          className="object-cover shrink-0 ring-1 ring-[#38BDF8]/40"
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="font-semibold text-sm tracking-wide text-white uppercase leading-tight">Indo Timezone</div>
              <div className="text-[11px] tracking-[0.1em] uppercase text-[#38BDF8] leading-tight mt-0.5">Tactical Center</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </div>
  );

  const SidebarBottom = () => (
    <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center gap-3 h-10 px-3 rounded-lg w-full text-[#5a5a6a] hover:text-[#a0a0b0] hover:bg-[#1c1c25] transition-colors duration-150"
        data-testid="sidebar-collapse-toggle"
      >
        {collapsed ? <CaretRight size={18} /> : <CaretLeft size={18} />}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-medium tracking-widest uppercase whitespace-nowrap"
            >
              Collapse
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 h-10 px-3 rounded-lg w-full text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors duration-150"
        data-testid="btn-logout"
      >
        <SignOut size={18} className="flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-medium tracking-wide whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-[#0a0a0f] dashboard-shell">
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden lg:flex fixed left-0 top-0 h-screen z-50 flex-col border-r border-white/[0.06]"
        style={{ backgroundColor: "#141419" }}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        data-testid="dashboard-sidebar"
      >
        <SidebarLogo />
        <div className="mx-5 mb-3 h-px bg-white/[0.06]" />
        <NavLinks />
        <SidebarBottom />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              data-testid="drawer-overlay"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#141419] border-r border-white/[0.06] z-50 lg:hidden flex flex-col"
              data-testid="mobile-drawer"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <SidebarLogo />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#5a5a6a] hover:text-white hover:bg-[#1c1c25]"
                  data-testid="drawer-close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mx-5 mb-3 h-px bg-white/[0.06]" />
              <NavLinks onItemClick={() => setDrawerOpen(false)} />
              <SidebarBottom />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0" style={{ marginLeft: 0 }}>
        {/* Fixed Topbar */}
        <header
          className="fixed top-0 right-0 h-16 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]"
          style={{
            left: 0,
            paddingLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth + 32 : 16,
            backgroundColor: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(12px)",
          }}
          data-testid="dashboard-topbar"
        >
          {/* Left side: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-[#a0a0b0] hover:bg-[#1c1c25] transition-colors"
              data-testid="hamburger-btn"
            >
              <List size={20} weight="bold" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate" data-testid="topbar-title">
                {activeItem?.label || "Dashboard"}
              </h1>
              <span className="hidden sm:inline text-[11px] text-[#5a5a6a] tracking-wider uppercase">
                {role}
              </span>
            </div>
          </div>

          {/* Right side: search, notification, profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-lg bg-[#16161d] hover:bg-[#1c1c25] text-[#5a5a6a] hover:text-[#a0a0b0] transition-colors"
              data-testid="topbar-search"
              onClick={() => setPaletteOpen(true)}
              title="Cari (⌘K)"
            >
              <MagnifyingGlass size={18} />
              <span className="text-[13px] hidden md:inline">Cari...</span>
              <kbd className="hidden md:inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-mono bg-[#0f0f14] text-[#5a5a6a] border border-white/[0.06]">⌘K</kbd>
            </button>
            <NotificationsPanel />
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 sm:gap-3 h-10 pl-1.5 pr-2 sm:pr-3 rounded-lg bg-[#16161d] hover:bg-[#1c1c25] transition-colors"
                data-testid="topbar-profile"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #38BDF8, #8b5cf6)" }}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <div className="text-[13px] font-medium text-white leading-tight truncate max-w-[120px]" data-testid="profile-name">{user?.name}</div>
                  <div className="text-[11px] text-[#5a5a6a] leading-tight uppercase">{role}</div>
                </div>
                <CaretDown size={14} className="text-[#5a5a6a] hidden sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-56 rounded-xl border border-white/[0.06] overflow-hidden z-50"
                    style={{ backgroundColor: "#16161d", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
                    data-testid="profile-dropdown"
                  >
                    <div className="p-3 border-b border-white/[0.06]">
                      <div className="text-[13px] font-semibold text-white truncate">{user?.name}</div>
                      <div className="text-[11px] text-[#5a5a6a] truncate">{user?.email}</div>
                    </div>
                    <div className="p-2">
                      <button className="flex items-center gap-3 w-full h-10 px-3 rounded-lg text-[#a0a0b0] hover:bg-[#1c1c25] hover:text-white transition-colors text-[13px]" disabled title="Coming soon">
                        <UserIcon size={16} />Profile
                      </button>
                      <button className="flex items-center gap-3 w-full h-10 px-3 rounded-lg text-[#a0a0b0] hover:bg-[#1c1c25] hover:text-white transition-colors text-[13px]" disabled title="Coming soon">
                        <GearSix size={16} />Settings
                      </button>
                    </div>
                    <div className="h-px bg-white/[0.06] mx-2" />
                    <div className="p-2">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full h-10 px-3 rounded-lg text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors text-[13px]" data-testid="profile-dropdown-logout">
                        <SignOut size={16} />Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden transition-[margin] duration-300"
          style={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth : 0 }}
        >
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-22 lg:pt-24 max-w-[1440px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={loc.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
