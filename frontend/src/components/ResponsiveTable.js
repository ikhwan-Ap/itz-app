import React, { useState } from "react";
import { CaretDown, CaretUp, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Responsive data table with optional server-side pagination.
 *
 * Props:
 *  - columns:      [{ key, label, render?, primary?, hideOnMobile? }]
 *  - data:         array of rows (current page only when using pagination)
 *  - rowKey:       (row) => string
 *  - actions:      (row) => ReactNode
 *  - testIdPrefix: string (optional)
 *
 * Pagination props (all optional — omit for non-paginated tables):
 *  - meta:         { page, limit, total, pages, has_next, has_prev }
 *  - onPageChange: (newPage: number) => void
 *  - loading:      bool — shows skeleton rows while fetching
 */
export default function ResponsiveTable({
  columns,
  data,
  rowKey,
  actions,
  testIdPrefix = "row",
  meta,
  onPageChange,
  loading = false,
}) {
  const primaryCols = columns.filter((c) => c.primary);
  const otherCols = columns.filter((c) => !c.primary);

  return (
    <div className="space-y-3">
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
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {columns.map((c) => (
                      <td key={c.key} className="p-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                    {actions && <td className="p-3"><div className="h-4 bg-white/5 rounded animate-pulse w-16" /></td>}
                  </tr>
                ))
                : data.map((row) => (
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
        {!loading && data.length === 0 && (
          <div className="p-6 text-center text-sm text-[#A0AAB5]">Tidak ada data.</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {!loading && data.length === 0 && (
          <div className="card-solid p-6 text-center text-sm text-[#A0AAB5]">Tidak ada data.</div>
        )}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-solid p-4 space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
            </div>
          ))
          : data.map((row) => (
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

      {/* Pagination Controls */}
      {meta && meta.pages > 1 && onPageChange && (
        <PaginationBar meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function PaginationBar({ meta, onPageChange }) {
  const { page, pages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 px-1 text-sm text-[#A0AAB5]" data-testid="pagination-bar">
      <span className="text-xs">
        {total === 0 ? "0 data" : `${from}–${to} dari ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.has_prev}
          className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:border-[#38BDF8]/50 hover:text-[#38BDF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-prev"
          aria-label="Halaman sebelumnya"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {/* Page numbers — show max 5 around current */}
        {getPageNumbers(page, pages).map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded border text-xs font-bold transition-colors ${p === page
                  ? "border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/10"
                  : "border-white/10 hover:border-[#38BDF8]/50 hover:text-[#38BDF8]"
                }`}
              data-testid={`pagination-page-${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.has_next}
          className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:border-[#38BDF8]/50 hover:text-[#38BDF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-next"
          aria-label="Halaman berikutnya"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
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
        <div className="shrink-0 mt-1 w-8 h-8 rounded-full border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center">
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
