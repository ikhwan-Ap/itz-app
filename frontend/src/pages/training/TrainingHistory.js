import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ClockCounterClockwise, CaretLeft, Trash, NotePencil, ArrowRight,
  Target, Crosshair, Shield, Lightning, X, Check, Play,
} from "@phosphor-icons/react";
import ResponsiveTable from "@/components/ResponsiveTable";

const MODE_META = {
  full: { label: "Full Latihan", icon: Target, color: "#38BDF8" },
  single: { label: "Single Drill", icon: Crosshair, color: "#8b5cf6" },
  gk: { label: "GK Latihan", icon: Shield, color: "#10b981" },
};

function ModeTag({ mode }) {
  const m = MODE_META[mode] || MODE_META.full;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40` }}>
      <Icon size={10} weight="fill" /> {m.label}
    </span>
  );
}

// =========================================================
// RESULT DETAIL MODAL (P2-SR-05 / P2-HL-03)
// =========================================================
function ResultDetailModal({ result, onClose, onDelete, onNoteUpdate, onResume }) {
  const [note, setNote] = useState(result.note || "");
  const [editingNote, setEditingNote] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    try {
      await api.patch(`/training-results/${result.id}/note`, { note });
      onNoteUpdate(result.id, note);
      setEditingNote(false);
    } catch (e) {
      alert(formatApiErrorDetail(e.response?.data?.detail));
    } finally { setSaving(false); }
  };

  const whiteSet = new Set(result.white_set || []);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-glass p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <ModeTag mode={result.mode} />
            <div className="font-display font-bold text-xl mt-1 text-white">
              {result.title || result.position || "Sesi Latihan"}
            </div>
            <div className="text-xs text-[#a0a0b0] mt-0.5">
              {result.overall}% Overall · Cost {result.total_cost} sesi {result.position && `· ${result.position}`}
            </div>
            <div className="text-xs text-[#5a5a6a] mt-0.5">
              {new Date(result.created_at).toLocaleString("id-ID")}
            </div>
          </div>
          <button onClick={onClose} className="text-[#5a5a6a] hover:text-white"><X size={20} /></button>
        </div>

        {/* Note */}
        <div className="mb-4 p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06]">
          {editingNote ? (
            <div className="space-y-2">
              <textarea
                className="input-std w-full resize-none text-sm"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan..."
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveNote} disabled={saving} className="btn-primary !py-1.5 !px-3 !text-xs">
                  {saving ? "Saving..." : "Simpan"}
                </button>
                <button onClick={() => { setEditingNote(false); setNote(result.note || ""); }} className="btn-outline !py-1.5 !px-3 !text-xs">Batal</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[#a0a0b0] flex-1">{note || <span className="italic text-[#5a5a6a]">Belum ada catatan</span>}</p>
              <button onClick={() => setEditingNote(true)} className="text-[#38BDF8] hover:text-[#7DD3FC] shrink-0">
                <NotePencil size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Final Stats Grid */}
        {result.final_stats && Object.keys(result.final_stats).length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#5a5a6a] mb-2">Final Stats</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {Object.entries(result.final_stats).map(([attr, val]) => (
                <div key={attr} className={`text-xs px-2 py-1.5 rounded flex items-center justify-between gap-1 ${
                  whiteSet.has(attr) ? "bg-[#38BDF8]/10 text-[#7DD3FC]" : "bg-white/[0.03] text-[#a0a0b0]"
                }`}>
                  <span className="truncate">{attr}</span>
                  <b>{val}</b>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drill History */}
        {result.history?.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#5a5a6a] mb-2">Rute Latihan ({result.history.length} drill)</div>
            <div className="space-y-2">
              {result.history.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{h.drill}</span>
                    <span className="text-[#38BDF8] font-bold text-sm">{h.gain} sesi</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.changes && Object.entries(h.changes).map(([k, v]) => (
                      <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${whiteSet.has(k) ? "tag-w" : "tag-g"}`}>
                        {k} +{v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
          <button onClick={() => onResume(result)} className="btn-primary !text-xs flex-1" data-testid="resume-training-btn">
            <Play size={14} weight="fill" className="inline mr-1" /> Lanjutkan Latihan
          </button>
          <button onClick={() => onDelete(result.id)} className="btn-danger !text-xs">
            <Trash size={14} className="inline mr-1" /> Hapus
          </button>
          <button onClick={onClose} className="btn-outline !text-xs">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// TRAINING HISTORY PAGE (P2-HL-01 / P2-HL-02)
// =========================================================
export default function TrainingHistory() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [page, setPage] = useState(1);
  const [modeFilter, setModeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (modeFilter) params.set("mode", modeFilter);
      const r = await api.get(`/training-results?${params}`);
      setItems(r.data.items || []);
      setMeta(r.data.meta);
      if (r.data.capacity) setCapacity(r.data.capacity);
    } catch (e) {
      // silent
    } finally { setLoading(false); }
  }, [page, modeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus hasil latihan ini?")) return;
    try {
      await api.delete(`/training-results/${id}`);
      setSelected(null);
      load();
    } catch (e) {
      alert(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleNoteUpdate = (id, note) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, note } : it));
    if (selected?.id === id) setSelected((s) => ({ ...s, note }));
  };

  const handleResume = (result) => {
    const modeRoutes = { full: "/app/training/full", single: "/app/training/single", gk: "/app/training/gk" };
    const route = modeRoutes[result.mode] || modeRoutes.full;
    sessionStorage.setItem("resume_session", JSON.stringify({
      stats: result.final_stats,
      roles: result.roles || [],
      grey_limit: result.grey_limit,
      white_multiplier: result.white_multiplier,
      mode: result.mode,
      session_number: result.session_number,
      title: result.title,
    }));
    nav(route);
  };

  const columns = [
    {
      key: "session",
      label: "#",
      render: (r) => <span className="font-display font-bold text-[#38BDF8]">#{r.session_number || "—"}</span>,
    },
    {
      key: "mode",
      label: "Sesi",
      primary: true,
      render: (r) => (
        <div>
          <ModeTag mode={r.mode} />
          <div className="text-white font-semibold mt-1 line-clamp-1">{r.title || r.position || "Tanpa judul"}</div>
          {r.position && r.title && <div className="text-[10px] text-[#5a5a6a] uppercase tracking-wider mt-0.5">{r.position}</div>}
          {r.note && <div className="text-xs text-[#5a5a6a] mt-0.5 truncate max-w-[180px]">{r.note}</div>}
        </div>
      ),
    },
    {
      key: "overall",
      label: "Overall",
      primary: true,
      render: (r) => (
        <div className="flex items-center gap-2 mt-1">
          <span className="font-display font-black text-2xl text-[#38BDF8]">{r.overall}%</span>
          <Lightning size={14} className="text-[#38BDF8]" weight="fill" />
        </div>
      ),
    },
    {
      key: "cost",
      label: "Cost",
      render: (r) => <span className="text-[#a0a0b0]">{r.total_cost} sesi</span>,
    },
    {
      key: "date",
      label: "Tanggal",
      render: (r) => <span className="text-xs text-[#5a5a6a]">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>,
    },
  ];

  const actions = (r) => (
    <div className="flex gap-2">
      <button onClick={() => setSelected(r)} className="btn-ghost !text-xs">
        <ArrowRight size={12} className="inline mr-1" /> Detail
      </button>
      <button onClick={() => handleDelete(r.id)} className="btn-danger">
        <Trash size={12} className="inline" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="training-history-page">
      <div>
        <Link to="/app/training" className="text-xs text-[#A0AAB5] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1 transition">
          <CaretLeft size={12} /> Modul Latihan
        </Link>
        <div className="flex items-center gap-2 mt-1 mb-1">
          <ClockCounterClockwise size={18} className="text-[#38BDF8]" weight="fill" />
          <div className="badge badge-blue">HISTORY</div>
        </div>
        <h1 className="section-title text-3xl">Riwayat Latihan</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">
          Semua hasil simulasi yang pernah Anda simpan.
          {capacity && !capacity.unlimited && capacity.max && (
            <> Maks {capacity.max} sesi tersimpan — hubungi admin untuk menambah kapasitas.</>
          )}
        </p>
      </div>

      {/* Capacity badge */}
      {capacity && !capacity.unlimited && capacity.max && (
        <div className="text-xs text-[#5a5a6a]">
          <span className={capacity.used >= capacity.max ? "text-[#ff8aa0] font-bold" : ""}>{capacity.used}</span> / {capacity.max} sesi tersimpan
          {capacity.used >= capacity.max && <span className="ml-2 text-[#ff8aa0]">— hapus sesi lama untuk menyimpan baru.</span>}
        </div>
      )}
      {capacity?.unlimited && (
        <div className="text-xs text-[#5a5a6a]">
          <span className="text-[#3FCA7C] font-bold">{capacity.used}</span> sesi tersimpan (unlimited)
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "full", "single", "gk"].map((m) => (
          <button
            key={m}
            onClick={() => { setModeFilter(m); setPage(1); }}
            className={`pill ${modeFilter === m ? "active" : ""}`}
          >
            {m === "" ? "Semua" : MODE_META[m]?.label || m}
          </button>
        ))}
      </div>

      {items.length === 0 && !loading ? (
        <div className="card-solid p-10 text-center">
          <ClockCounterClockwise size={40} className="text-[#5a5a6a] mx-auto mb-3" />
          <div className="text-[#a0a0b0] font-semibold">Belum ada riwayat latihan</div>
          <p className="text-sm text-[#5a5a6a] mt-1">Jalankan simulasi dan klik "Simpan Hasil" untuk menyimpan ke sini.</p>
          <Link to="/app/training" className="btn-primary inline-flex mt-4 !text-sm">Mulai Latihan</Link>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          actions={actions}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          loading={loading}
          testIdPrefix="history-row"
        />
      )}

      {selected && (
        <ResultDetailModal
          result={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onNoteUpdate={handleNoteUpdate}
          onResume={handleResume}
        />
      )}
    </div>
  );
}
