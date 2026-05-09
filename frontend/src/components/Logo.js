import React from "react";

export default function Logo({ size = 44, showText = true, compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/assets/itz-logo.png"
        alt="Indo Timezone Football Community"
        style={{ width: size, height: size, borderRadius: "50%", boxShadow: "0 0 18px rgba(0, 168, 255, 0.28)" }}
        className="object-cover shrink-0 ring-1 ring-[#00A8FF]/30"
      />
      {showText && (
        <div>
          <div className={`font-space font-bold leading-none text-white ${compact ? "text-base" : "text-xl"}`}>
            INDO TIMEZONE
          </div>
          <div className="text-[9px] tracking-[0.22em] text-[#00A8FF] mt-1 font-medium uppercase">
            Tactical Edge · Est. 2023
          </div>
        </div>
      )}
    </div>
  );
}
