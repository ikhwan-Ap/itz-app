import React from "react";
import { motion } from "framer-motion";

/**
 * StatCard — dashboard reusable card.
 * Props:
 *  - icon: phosphor/lucide ElementType
 *  - iconColor: hex
 *  - label: small uppercase label
 *  - value: big number/text
 *  - subtext: small description
 *  - progress (optional): 0-100
 *  - progressColor (optional): hex
 *  - delay: animation delay
 */
export default function StatCard({
  icon: Icon,
  iconColor = "#38BDF8",
  label,
  value,
  subtext,
  progress,
  progressColor,
  delay = 0,
  testId,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#16161d] border border-white/[0.06] rounded-xl p-5 sm:p-6 hover:border-[rgba(56,189,248,0.4)] hover:shadow-[0_0_24px_rgba(56,189,248,0.12)] hover:-translate-y-0.5 transition-all duration-200"
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        {Icon && <Icon size={20} weight="duotone" style={{ color: iconColor }} />}
        <span className="text-[11px] font-medium text-[#5a5a6a] uppercase tracking-[0.08em]">
          {label}
        </span>
      </div>
      <div className="text-[24px] sm:text-[28px] font-extrabold text-white tracking-tight leading-none mb-1 break-words">
        {value}
      </div>
      <div className="text-[12px] sm:text-[13px] text-[#a0a0b0] mb-4">{subtext}</div>
      {progress !== undefined && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-[#0f0f14] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: progressColor || iconColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums" style={{ color: progressColor || iconColor }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
