import React from "react";

export default function Logo({ size = 44, showText = true, compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/assets/itz-logo.png"
        alt="Indo Timezone Football Community"
        style={{ width: size, height: size, borderRadius: "50%", boxShadow: "0 0 18px rgba(212, 175, 55, 0.28)" }}
        className="object-cover shrink-0"
      />
      {showText && (
        <div>
          <div className={`font-display font-black leading-none brand-gradient ${compact ? "text-base" : "text-xl"}`}>
            INDO TIMEZONE
          </div>
          <div className="text-[9px] tracking-[0.28em] text-[#D4AF37] mt-0.5 font-semibold uppercase font-serif italic">
            Football Community · Est. 2023
          </div>
        </div>
      )}
    </div>
  );
}
