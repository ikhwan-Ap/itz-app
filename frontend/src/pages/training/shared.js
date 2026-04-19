import React, { useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, CaretUp, ArrowRight, Warning, Lightning } from "@phosphor-icons/react";

export const JENJANG_OPTIONS = [
  { value: 0, label: "0 (Polos)" },
  { value: 10, label: "10 (Langka)" },
  { value: 30, label: "30 (Elite)" },
  { value: 50, label: "50 (Berkilau)" },
  { value: 80, label: "80 (Master)" },
  { value: 120, label: "120 (Epik)" },
  { value: 160, label: "160 (Legend)" },
];

/**
 * Shared: player data (positions, attributes, bonus, grey limit) + target selection.
 * onRun is called with the complete calculator payload (minus roles which we inject).
 */
export function PlayerForm({ meta, stats, setStats, activeRoles, setActiveRoles, bonus, setBonus, greyLimit, setGreyLimit, playerAge, setPlayerAge, children }) {
  const whiteSet = useMemo(() => {
    if (!meta) return new Set();
    const s = new Set();
    activeRoles.forEach((r) => (meta.roles[r] || []).forEach((a) => s.add(a)));
    return s;
  }, [activeRoles, meta]);

  const fillSample = () => {
    setActiveRoles(["MC"]);
    setStats({
      Umpan: 140, Dribel: 40, Kreativitas: 65, Tembakan: 40, Tekel: 176, Penjagaan: 182,
      Penempatan: 178, Kebugaran: 145, Agresivitas: 176, UmpanSilang: 45, Penyelesaian: 44,
      Sundulan: 74, Keberanian: 187, Kecepatan: 47, Kekuatan: 80,
    });
    setBonus(0);
    setGreyLimit(40);
  };

  const toggleRole = (r) => {
    setActiveRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  return (
    <div className="card-solid p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A88527] text-[#0A182B] font-black flex items-center justify-center">1</div>
        <div className="font-display font-bold text-xl">Data Pemain</div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-5">
        <div>
          <label className="label-std">Bonus Jenjang (%)</label>
          <select className="input-std" value={bonus} onChange={(e) => setBonus(e.target.value)} data-testid="calc-bonus-select">
            {JENJANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-std">Umur Pemain</label>
          <input type="number" className="input-std" value={playerAge} onChange={(e) => setPlayerAge(e.target.value)} data-testid="calc-age-input" />
        </div>
        <div>
          <label className="label-std">Batas Limit Gelap</label>
          <input type="number" className="input-std" value={greyLimit} onChange={(e) => setGreyLimit(e.target.value)} data-testid="calc-grey-limit-input" />
        </div>
        <div className="flex items-end">
          <button onClick={fillSample} className="btn-outline w-full" data-testid="calc-sample-btn">Isi Contoh (MC)</button>
        </div>
      </div>

      <label className="label-std">Pilih Posisi (Kuncian)</label>
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(meta.roles).map((r) => (
          <button key={r} type="button"
                  className={`pill ${activeRoles.includes(r) ? "active" : ""}`}
                  onClick={() => toggleRole(r)}
                  data-testid={`role-pill-${r}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {["def", "att", "phy"].map((g) => {
          const title = { def: "Pertahanan", att: "Menyerang", phy: "Fisik & Mental" }[g];
          return (
            <div key={g}>
              <div className="font-display font-bold text-sm uppercase tracking-wider mb-3 pb-2 border-b border-[#D4AF37]/20 text-[#D4AF37]">{title}</div>
              {meta.attrs[g].map((a) => {
                const isW = whiteSet.has(a);
                return (
                  <div key={a}
                       className={`flex items-center justify-between px-3 py-2 mb-2 rounded-lg text-sm transition-all duration-200 ${isW ? "bg-[#D4AF37]/8 border-l-2 border-[#D4AF37]" : "bg-white/[0.02] border-l-2 border-transparent"}`}
                       data-testid={`attr-row-${a}`}>
                    <span className={isW ? "text-[#E8C35A] font-bold" : "text-[#9FB0CC]"}>{a}</span>
                    <input type="number" className={`w-20 px-2 py-1 bg-[#060F1F] rounded-md text-center font-bold border border-white/5 transition-all focus:border-[#D4AF37] focus:outline-none ${isW ? "text-[#E8C35A]" : "text-white"}`}
                           value={stats[a] ?? 1}
                           onChange={(e) => setStats((s) => ({ ...s, [a]: parseInt(e.target.value) || 0 }))}
                           data-testid={`attr-input-${a}`} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}

/** Target Card (used by Full Latihan) */
export function TargetCard({ attr, stats, bonus, selected, onToggle, onChange, allowedPrios = [1, 2, 3] }) {
  const curr = parseInt(stats[attr] || 1);
  const baseVal = Math.max(1, curr - parseInt(bonus || 0));
  return (
    <div className={`card-solid p-4 cursor-pointer transition-all border-2 ${selected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-transparent"}`}
         onClick={onToggle}
         data-testid={`target-card-${attr}`}>
      <div className="font-bold text-white">{attr}</div>
      <div className="text-xs text-[#9FB0CC]">Base: {baseVal}%</div>
      {selected && (
        <div className="mt-3 pt-3 border-t border-[#D4AF37]/15 space-y-2" onClick={(e) => e.stopPropagation()}>
          {allowedPrios.length > 1 && (
            <select className="input-std !py-1.5 !text-xs"
                    value={selected.prio}
                    onChange={(e) => onChange("prio", parseInt(e.target.value))}
                    data-testid={`target-prio-${attr}`}>
              {allowedPrios.includes(1) && <option value="1">Prioritas: UTAMA</option>}
              {allowedPrios.includes(2) && <option value="2">Prioritas: KEDUA</option>}
              {allowedPrios.includes(3) && <option value="3">Prioritas: KETIGA</option>}
            </select>
          )}
          <input type="number" className="input-std !py-1.5 !text-xs"
                 value={selected.goal}
                 onChange={(e) => onChange("goal", parseInt(e.target.value))}
                 placeholder="Target Mutu"
                 data-testid={`target-goal-${attr}`} />
        </div>
      )}
    </div>
  );
}

/** Results: overall %, timeline, final grid (shared between modes) */
export function ResultSection({ result, meta, bonus, stats }) {
  const [expanded, setExpanded] = useState({});
  const whiteSet = new Set(result.white_set);

  return (
    <motion.div id="result-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} data-testid="result-section">
      <div className="card-glow p-7 text-center">
        <div className="font-display font-black text-6xl brand-gradient glow-gold" data-testid="result-overall">{result.overall}%</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mt-2">Estimasi Mutu Akhir</div>
        <div className="mt-3 text-xs text-[#9FB0CC]">Total cost: <span className="font-bold text-[#F4EBDC]">{result.total_cost}</span></div>
      </div>

      <div className="mt-6 card-solid p-6">
        <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <Lightning size={22} weight="fill" className="text-[#D4AF37]" /> Rute Latihan Optimal
        </h3>
        {result.history.length === 0 ? (
          <div className="card-solid p-5 border border-[#F0557A]/40 text-center">
            <Warning size={32} className="text-[#F0557A] mx-auto mb-2" />
            <div className="text-[#ffa6bc] font-bold">Tidak ada langkah valid.</div>
            <div className="text-sm text-[#9FB0CC] mt-1">Cek limit gelap atau naikkan batas limit.</div>
          </div>
        ) : (
          <div className="relative timeline">
            {result.history.map((h, i) => (
              <DrillCard key={i} drill={h} whiteSet={whiteSet}
                         expanded={!!expanded[i]}
                         onToggle={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))} />
            ))}
          </div>
        )}
      </div>

      <FinalGrid result={result} meta={meta} bonus={bonus} stats={stats} />
    </motion.div>
  );
}

function DrillCard({ drill, whiteSet, expanded, onToggle }) {
  return (
    <div className="timeline-item mb-4" data-testid={`drill-item-${drill.drill}`}>
      <div className="card-solid p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-display font-bold text-lg text-white">{drill.drill}</div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-navy">P{drill.prioLevel}</span>
            <span className="badge badge-navy">{drill.size} attr</span>
            <button onClick={onToggle} className="btn-ghost !text-xs" data-testid={`drill-toggle-${drill.drill}`}>
              {expanded ? <CaretUp size={12} className="inline" /> : <CaretDown size={12} className="inline" />}
              <span className="ml-1">{expanded ? "Tutup" : "Detail"}</span>
            </button>
          </div>
        </div>
        <div className="font-display font-black text-2xl text-[#D4AF37] mt-2">+{drill.gain}%</div>
        <div className="text-xs text-[#9FB0CC] flex items-center gap-2 mt-1">
          Avg Awal: <b>{drill.startAvg}%</b> <ArrowRight size={12} /> <b className="text-white">{drill.endAvg}%</b>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {Object.entries(drill.changes).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-0.5 rounded ${whiteSet.has(k) ? "tag-w" : "tag-g"}`}>
              {k} +{v}
            </span>
          ))}
        </div>
        <AnimatePresence>
          {expanded && drill.steps?.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mt-3 pt-3 border-t border-[#D4AF37]/15">
              <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Detail Per Siklus</div>
              <div className="space-y-2">
                {drill.steps.map((s, si) => (
                  <div key={si} className="bg-[#060F1F]/60 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-[#E8C35A]">Siklus {si + 1}: +{s.step} setiap attr</span>
                      <span className="text-[#9FB0CC]">Avg setelah: <b className="text-white">{s.endAvg}%</b></span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {Object.entries(s.snapshot).map(([k, v]) => (
                        <div key={k} className={`text-xs px-2 py-1 rounded flex items-center justify-between ${whiteSet.has(k) ? "bg-[#D4AF37]/10 text-[#E8C35A]" : "bg-[#F0557A]/10 text-[#ffa6bc]"}`}>
                          <span>{k}</span>
                          <b>{v}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FinalGrid({ result, meta, bonus, stats }) {
  const whiteSet = new Set(result.white_set);
  const groups = { "Pertahanan": meta.attrs.def, "Menyerang": meta.attrs.att, "Fisik & Mental": meta.attrs.phy };
  return (
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      {Object.entries(groups).map(([gName, attrs]) => (
        <div key={gName} className="card-solid p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-3 text-center">{gName}</div>
          {attrs.map((a) => {
            const finalVal = result.final_stats[a];
            const isW = whiteSet.has(a);
            let startVal = parseInt(stats[a]) || 1;
            const diff = finalVal - startVal;
            return (
              <div key={a} className="flex items-center justify-between py-1.5 text-sm border-b border-white/5 last:border-0">
                <span className={isW ? "text-[#E8C35A] font-bold" : "text-[#9FB0CC]"}>{a}</span>
                <span className="flex items-center gap-2">
                  <b className="text-white">{finalVal}%</b>
                  {diff > 0 && <span className="text-[#3FCA7C] text-xs font-bold">(+{diff})</span>}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Helper: shared API runner */
export async function runCalculator({ activeRoles, stats, bonus, greyLimit, targets, singleDrill, playerAge }) {
  const { data } = await api.post("/calculator/run", {
    roles: activeRoles,
    stats,
    bonus: parseInt(bonus) || 0,
    grey_limit: parseInt(greyLimit) || 40,
    targets,
    single_drill: singleDrill || null,
    player_age: parseInt(playerAge) || 18,
  });
  return data;
}
