import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { SoccerBall, Crosshair, Target, Lightning, CaretDown, CaretUp, Warning, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const JENJANG_OPTIONS = [
  { value: 0, label: "0 (Polos)" },
  { value: 10, label: "10 (Langka)" },
  { value: 30, label: "30 (Elite)" },
  { value: 50, label: "50 (Berkilau)" },
  { value: 80, label: "80 (Master)" },
  { value: 120, label: "120 (Epik)" },
  { value: 160, label: "160 (Legend)" },
];

export default function CalculatorPage() {
  const { user, refresh } = useAuth();
  const [meta, setMeta] = useState(null);
  const [activeRoles, setActiveRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [bonus, setBonus] = useState(0);
  const [greyLimit, setGreyLimit] = useState(40);
  const [playerAge, setPlayerAge] = useState(18);
  const [step, setStep] = useState(1); // 1=input, 2=targets, 3=result
  const [selectedTargets, setSelectedTargets] = useState({}); // { attr: {prio, goal} }
  const [singleDrill, setSingleDrill] = useState(""); // empty = full mode
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/calculator/meta").then((r) => {
      setMeta(r.data);
      const init = {};
      r.data.all_attrs.forEach((a) => (init[a] = 1));
      setStats(init);
    });
  }, []);

  const whiteSet = useMemo(() => {
    if (!meta) return new Set();
    const s = new Set();
    activeRoles.forEach((r) => (meta.roles[r] || []).forEach((a) => s.add(a)));
    return s;
  }, [activeRoles, meta]);

  const fillSample = () => {
    if (!meta) return;
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

  const nextToTargets = () => {
    setErr("");
    if (whiteSet.size === 0) { setErr("Pilih minimal 1 posisi."); return; }
    // default targets: reset each time positions change
    const next = {};
    setSelectedTargets(next);
    setStep(2);
  };

  const toggleTarget = (attr) => {
    setSelectedTargets((prev) => {
      const copy = { ...prev };
      if (copy[attr]) delete copy[attr];
      else copy[attr] = { prio: 1, goal: 300 };
      return copy;
    });
  };

  const updateTarget = (attr, field, val) => {
    setSelectedTargets((prev) => ({ ...prev, [attr]: { ...prev[attr], [field]: val } }));
  };

  const run = async () => {
    setErr(""); setResult(null);
    const targets = Object.entries(selectedTargets).map(([name, v]) => ({
      name, prio: parseInt(v.prio), goal: parseInt(v.goal) || 270,
    }));
    if (targets.length === 0) { setErr("Pilih minimal 1 atribut target."); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/calculator/run", {
        roles: activeRoles,
        stats,
        bonus: parseInt(bonus) || 0,
        grey_limit: parseInt(greyLimit) || 40,
        targets,
        single_drill: singleDrill || null,
        player_age: parseInt(playerAge) || 18,
      });
      setResult(data);
      setStep(3);
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      await refresh();
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!meta) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="calculator-page">
      <div>
        <div className="badge badge-green mb-2"><Crosshair size={12} className="inline mr-1" /> TE SNIPER</div>
        <h1 className="section-title text-3xl">Training Calculator</h1>
        <p className="text-[#9BA4B5] text-sm mt-1">Algoritma Prioritas: Respect Goal Semua Target → Ukuran Kecil → Atribut Gelap Sedikit</p>
      </div>

      {/* STEP 1: INPUT */}
      <div className="card-solid p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#00D05E] text-[#0b1221] font-black flex items-center justify-center">1</div>
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
            <input type="number" className="input-std" value={playerAge}
                   onChange={(e) => setPlayerAge(e.target.value)} data-testid="calc-age-input" />
          </div>
          <div>
            <label className="label-std">Batas Limit Gelap</label>
            <input type="number" className="input-std !border-[#FF3366]/50 !text-[#ff6b88]"
                   value={greyLimit} onChange={(e) => setGreyLimit(e.target.value)} data-testid="calc-grey-limit-input" />
          </div>
          <div className="flex items-end">
            <button onClick={fillSample} className="btn-outline w-full" data-testid="calc-sample-btn">Isi Contoh (MC)</button>
          </div>
        </div>

        <label className="label-std">Pilih Posisi</label>
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(meta.roles).map((r) => (
            <button key={r}
              className={`pill ${activeRoles.includes(r) ? "active" : ""}`}
              onClick={() => toggleRole(r)}
              data-testid={`role-pill-${r}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {["def", "att", "phy"].map((g) => {
            const title = { def: "🛡 Pertahanan", att: "⚽ Menyerang", phy: "💪 Fisik & Mental" }[g];
            return (
              <div key={g}>
                <div className="font-display font-bold text-sm uppercase tracking-wide mb-3 pb-2 border-b border-white/10">{title}</div>
                {meta.attrs[g].map((a) => {
                  const isW = whiteSet.has(a);
                  return (
                    <div key={a}
                         className={`flex items-center justify-between px-3 py-2 mb-2 rounded-lg text-sm ${isW ? "bg-[#00D05E]/10 border-l-2 border-[#00D05E]" : "bg-white/[0.03]"}`}
                         data-testid={`attr-row-${a}`}>
                      <span className={isW ? "text-[#00D05E] font-bold" : "text-[#9BA4B5]"}>{a}</span>
                      <input type="number" className={`w-20 px-2 py-1 bg-[#0b1221] rounded-md text-center font-bold ${isW ? "text-[#00D05E]" : "text-white"} border border-white/5`}
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

        {err && step === 1 && <div className="badge badge-red mt-4 w-full justify-center !py-2">{err}</div>}
        <button onClick={nextToTargets} className="btn-primary w-full mt-6" data-testid="calc-next-target-btn">
          Lanjut: Pilih Target →
        </button>
      </div>

      {/* STEP 2: TARGETS */}
      {step >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 sm:p-6" data-testid="target-section">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#00D05E] text-[#0b1221] font-black flex items-center justify-center">2</div>
            <div className="font-display font-bold text-xl">Pilih Target & Prioritas</div>
          </div>

          <div className="mb-4 p-4 rounded-lg bg-[#00D05E]/5 border border-[#00D05E]/20 text-sm">
            <div className="font-bold text-[#00D05E] mb-1 flex items-center gap-2"><Target size={16} /> Mode</div>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={!singleDrill} onChange={() => setSingleDrill("")} />
                <span>Full Search (semua drill)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={!!singleDrill} onChange={() => setSingleDrill(meta.drills[0].name)} />
                <span>Single Drill Mode</span>
              </label>
              {singleDrill && (
                <select className="input-std !w-auto" value={singleDrill} onChange={(e) => setSingleDrill(e.target.value)} data-testid="single-drill-select">
                  {meta.drills.map((d) => <option key={d.name} value={d.name}>{d.name} ({d.size} attr, cost {d.cost})</option>)}
                </select>
              )}
            </div>
            <div className="text-xs text-[#9BA4B5] mt-2">Single Drill Mode menjalankan hanya 1 drill. Tetap menghormati 180% avg cap + grey limit + target goal.</div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(whiteSet).sort().map((a) => {
              const curr = parseInt(stats[a] || 1);
              const baseVal = Math.max(1, curr - parseInt(bonus || 0));
              const selected = !!selectedTargets[a];
              return (
                <div key={a}
                     className={`card-solid p-4 cursor-pointer transition-all border-2 ${selected ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-white/5 hover:border-white/20"}`}
                     onClick={() => toggleTarget(a)}
                     data-testid={`target-card-${a}`}>
                  <div className="font-bold">{a}</div>
                  <div className="text-xs text-[#9BA4B5]">Base: {baseVal}%</div>
                  {selected && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <select className="input-std !py-1.5 !text-xs"
                              value={selectedTargets[a].prio}
                              onChange={(e) => updateTarget(a, "prio", parseInt(e.target.value))}
                              data-testid={`target-prio-${a}`}>
                        <option value="1">Prioritas: UTAMA</option>
                        <option value="2">Prioritas: KEDUA</option>
                        <option value="3">Prioritas: KETIGA</option>
                      </select>
                      <input type="number" className="input-std !py-1.5 !text-xs"
                             value={selectedTargets[a].goal}
                             onChange={(e) => updateTarget(a, "goal", parseInt(e.target.value))}
                             placeholder="Target Mutu"
                             data-testid={`target-goal-${a}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {err && <div className="badge badge-red mt-4 w-full justify-center !py-2" data-testid="calc-error">{err}</div>}
          <button onClick={run} disabled={loading} className="btn-primary w-full mt-6" data-testid="calc-run-btn">
            {loading ? "Calculating..." : "Jalankan Kalkulasi"}
          </button>
        </motion.div>
      )}

      {/* STEP 3: RESULT */}
      {step === 3 && result && (
        <motion.div id="result-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} data-testid="result-section">
          <div className="card-solid p-6 text-center border border-[#00D05E]/20 bg-[#00D05E]/5">
            <div className="font-display font-black text-6xl text-[#00D05E] glow-brand" data-testid="result-overall">{result.overall}%</div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#9BA4B5] mt-2">Estimasi Mutu Akhir</div>
          </div>

          <div className="mt-6 card-solid p-6">
            <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Lightning size={22} weight="fill" className="text-[#F5C300]" /> Rute Latihan Optimal
            </h3>

            {result.history.length === 0 ? (
              <div className="card-solid p-5 border border-[#FF3366]/40 text-center">
                <Warning size={32} className="text-[#FF3366] mx-auto mb-2" />
                <div className="text-[#ff6b88] font-bold">Tidak ada langkah valid.</div>
                <div className="text-sm text-[#9BA4B5] mt-1">Cek limit gelap atau naikkan batas limit.</div>
              </div>
            ) : (
              <div className="relative pl-0 timeline">
                {result.history.map((h, i) => (
                  <DrillCard key={i} drill={h} whiteSet={new Set(result.white_set)}
                             expanded={!!expanded[i]}
                             onToggle={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))} />
                ))}
              </div>
            )}
          </div>

          <FinalGrid result={result} meta={meta} bonus={bonus} greyLimit={greyLimit} stats={stats} />

          <div className="flex gap-3 mt-6">
            <button onClick={() => { setStep(1); setResult(null); }} className="btn-outline">Reset</button>
            <button onClick={() => setStep(2)} className="btn-outline">Ubah Target</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DrillCard({ drill, whiteSet, expanded, onToggle }) {
  return (
    <div className="timeline-item mb-4" data-testid={`drill-item-${drill.drill}`}>
      <div className="card-solid p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-display font-bold text-lg">{drill.drill}</div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-grey">P{drill.prioLevel}</span>
            <span className="badge badge-grey">{drill.size} attr</span>
            <button onClick={onToggle} className="btn-outline !py-1 !px-3 !text-xs" data-testid={`drill-toggle-${drill.drill}`}>
              {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />} {expanded ? "Sembunyikan" : "Detail"}
            </button>
          </div>
        </div>
        <div className="font-display font-black text-2xl text-[#00B4D8] mt-2">+{drill.gain}%</div>
        <div className="text-xs text-[#9BA4B5] flex items-center gap-2 mt-1">
          Avg Awal: <b className="text-[#9BA4B5]">{drill.startAvg}%</b>
          <ArrowRight size={12} />
          <b className="text-white">{drill.endAvg}%</b>
        </div>

        {/* Total pills */}
        <div className="flex flex-wrap gap-1 mt-3">
          {Object.entries(drill.changes).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-0.5 rounded ${whiteSet.has(k) ? "tag-w" : "tag-g"}`}>
              {k} +{v}
            </span>
          ))}
        </div>

        {/* Expanded: per-step detail */}
        <AnimatePresence>
          {expanded && drill.steps?.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-white/10"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-[#9BA4B5] mb-2">
                Detail Per Siklus (step-by-step)
              </div>
              <div className="space-y-2">
                {drill.steps.map((s, si) => (
                  <div key={si} className="bg-white/[0.03] rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold">Siklus {si + 1}: +{s.step} ke semua attr drill</span>
                      <span className="text-[#9BA4B5]">Avg setelah: <b className="text-white">{s.endAvg}%</b></span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {Object.entries(s.snapshot).map(([k, v]) => (
                        <div key={k} className={`text-xs px-2 py-1 rounded flex items-center justify-between ${whiteSet.has(k) ? "bg-[#00D05E]/10 text-[#00D05E]" : "bg-[#FF3366]/10 text-[#ff6b88]"}`}>
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
  const greyLimit = 40;
  const whiteSet = new Set(result.white_set);
  const groups = { "Pertahanan": meta.attrs.def, "Menyerang": meta.attrs.att, "Fisik & Mental": meta.attrs.phy };
  return (
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      {Object.entries(groups).map(([gName, attrs]) => (
        <div key={gName} className="card-solid p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-[#00B4D8] mb-3 text-center">{gName}</div>
          {attrs.map((a) => {
            const finalVal = result.final_stats[a];
            const isW = whiteSet.has(a);
            let startVal = parseInt(stats[a]) || 1;
            if (isW) startVal = Math.max(1, startVal - parseInt(bonus || 0)) + parseInt(bonus || 0);
            const diff = finalVal - startVal;
            return (
              <div key={a} className="flex items-center justify-between py-1.5 text-sm border-b border-white/5 last:border-0">
                <span className={isW ? "text-[#00D05E] font-bold" : "text-[#9BA4B5]"}>{a}</span>
                <span className="flex items-center gap-2">
                  <b className="text-white">{finalVal}%</b>
                  {diff > 0 && <span className="text-[#00D05E] text-xs font-bold">(+{diff})</span>}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
