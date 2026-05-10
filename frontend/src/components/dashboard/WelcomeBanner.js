import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * WelcomeBanner — dashboard greeting card with pitch grid overlay.
 * Props:
 *  - userName: string
 *  - subtitle (optional): small line below greeting (e.g. role description)
 *  - actions: array of { to, icon, label, primary?: bool, onClick?: fn }
 */
export default function WelcomeBanner({ userName, subtitle, actions = [], children }) {
  const now = new Date();
  const dateString = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6 relative overflow-hidden"
      data-testid="welcome-banner"
    >
      {/* Pitch grid overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(56,189,248,0.13) 0px, transparent 1px, transparent 40px, rgba(56,189,248,0.13) 41px),
            repeating-linear-gradient(90deg, rgba(56,189,248,0.13) 0px, transparent 1px, transparent 40px, rgba(56,189,248,0.13) 41px)
          `,
          backgroundColor: "rgba(56,189,248,0.025)",
        }}
      />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Selamat datang kembali, <span className="text-[#38BDF8]">{userName}</span>
          </h2>
          <p className="text-[11px] text-[#5a5a6a] mt-1 uppercase tracking-[0.08em]">
            {subtitle || dateString}
          </p>
        </div>
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((a, i) => {
              const className = a.primary
                ? "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-wider bg-[#38BDF8] text-white hover:bg-[#7DD3FC] hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-all duration-200"
                : "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-wider border border-white/[0.06] text-[#a0a0b0] hover:border-[rgba(56,189,248,0.4)] hover:text-white transition-all duration-200";
              if (a.onClick) {
                return (
                  <button key={i} onClick={a.onClick} className={className} data-testid={`welcome-action-${i}`}>
                    {a.icon && <a.icon size={16} weight="bold" />}
                    {a.label}
                  </button>
                );
              }
              return (
                <Link key={i} to={a.to} className={className} data-testid={`welcome-action-${i}`}>
                  {a.icon && <a.icon size={16} weight="bold" />}
                  {a.label}
                </Link>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
