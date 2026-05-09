import React, { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Responsive data table.
 * - Desktop (md+): renders full <table>
 * - Mobile: renders expandable card rows showing `primary` always, rest collapsed.
 *
 * Props:
 *  - columns: [{ key, label, render?: (row) => ReactNode, primary?: boolean, hideOnMobile?: boolean }]
 *  - data:    array of rows
 *  - rowKey:  (row) => string
 *  - actions: (row) => ReactNode  — rendered in card footer on mobile / table cell on desktop
 *  - testIdPrefix: string (optional) for data-testid on each row
 */
export default function ResponsiveTable({ columns, data, rowKey, actions, testIdPrefix = "row" }) {
  const primaryCols = columns.filter((c) => c.primary);
  const otherCols = columns.filter((c) => !c.primary);

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#A0AAB5] border-b border-white/5">
                {columns.map((c) => (
                  <th key={c.key} className="p-3">{c.label}</th>
                ))}
                {actions && <th className="p-3 w-36">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={rowKey(row)} className="hover-row border-b border-white/5" data-testid={`${testIdPrefix}-${rowKey(row)}`}>
                  {columns.map((c) => (
                    <td key={c.key} className="p-3 align-top">
                      {c.render ? c.render(row) : (row[c.key] ?? "-")}
                    </td>
                  ))}
                  {actions && <td className="p-3">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && <div className="p-6 text-center text-sm text-[#A0AAB5]">Tidak ada data.</div>}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.length === 0 && (
          <div className="card-solid p-6 text-center text-sm text-[#A0AAB5]">Tidak ada data.</div>
        )}
        {data.map((row) => (
          <ExpandableCard
            key={rowKey(row)}
            id={rowKey(row)}
            primaryCols={primaryCols}
            otherCols={otherCols}
            row={row}
            actions={actions}
            testIdPrefix={testIdPrefix}
          />
        ))}
      </div>
    </>
  );
}

function ExpandableCard({ id, primaryCols, otherCols, row, actions, testIdPrefix }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-solid overflow-hidden" data-testid={`${testIdPrefix}-${id}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        data-testid={`${testIdPrefix}-${id}-toggle`}
      >
        <div className="flex-1 min-w-0">
          {primaryCols.map((c) => (
            <div key={c.key} className="mb-1 last:mb-0">
              {c.render ? c.render(row) : <span className="text-white font-semibold">{row[c.key] ?? "-"}</span>}
            </div>
          ))}
        </div>
        <div className="shrink-0 mt-1 w-8 h-8 rounded-full border border-[#00A8FF]/30 text-[#00A8FF] flex items-center justify-center">
          {open ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-2">
              {otherCols.map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[#A0AAB5] text-xs uppercase tracking-wider font-bold">{c.label}</span>
                  <div className="text-right flex-1">{c.render ? c.render(row) : (row[c.key] ?? "-")}</div>
                </div>
              ))}
              {actions && (
                <div className="pt-3 border-t border-white/5 flex gap-2 flex-wrap">
                  {actions(row)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
