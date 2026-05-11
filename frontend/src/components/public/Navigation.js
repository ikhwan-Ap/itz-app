import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Tools", path: "/tools" },
  { label: "Community", path: "/community" },
  { label: "Contact", path: "/contact" },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const ctaTo = user ? "/app" : "/register";
  const ctaLabel = user ? "Dashboard" : "Get Started";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
          isScrolled
            ? "bg-[rgba(11,12,16,0.92)] backdrop-blur-xl border-b border-[#2A2F36]"
            : "bg-transparent"
        }`}
        data-testid="public-nav"
      >
        <div className="flex items-center justify-between h-16 content-max-width md:h-20">
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <Logo size={36} compact={true} />
          </Link>

          <div className="items-center hidden gap-8 md:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative font-inter text-sm font-medium uppercase tracking-[0.05em] transition-colors duration-200 ${
                    active ? "text-white" : "text-[#A0AAB5] hover:text-white"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#38BDF8]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="items-center hidden gap-3 md:flex">
            {!user && (
              <Link to="/login" className="text-sm font-medium text-[#A0AAB5] hover:text-white transition-colors" data-testid="nav-login">
                Login
              </Link>
            )}
            <Link to={ctaTo} className="btn-primary !text-xs !py-2.5 !px-5" data-testid="nav-cta">
              {ctaLabel}
            </Link>
          </div>

          <button
            className="p-2 text-white md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            data-testid="nav-mobile-toggle"
          >
            {isMobileMenuOpen ? <X size={26} /> : <List size={26} />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[900] md:hidden bg-[#0B0C10]" data-testid="nav-mobile-menu">
          <div className="flex flex-col items-center justify-center h-full px-6 gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="font-space text-3xl font-semibold text-white hover:text-[#38BDF8] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 mt-2">
              {!user && (
                <Link to="/login" className="btn-secondary">Login</Link>
              )}
              <Link to={ctaTo} className="btn-primary">{ctaLabel}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
