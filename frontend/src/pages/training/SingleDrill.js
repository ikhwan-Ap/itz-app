import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, CaretLeft, CheckCircle, Warning } from "@phosphor-icons/react";
import { PlayerForm, TargetCard, ResultSection, runCalculator } from "./shared";

export default function SingleDrillPage() {
  const { refresh } = useAuth();
  const [meta, setMeta] = useState(null);
  const [activeRoles, setActiveRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [bonus, setBonus] = useState(0);
  const [greyLimit, setGreyLimit] = useState(40);
  const [playerAge, setPlayerAge] = useState(18);
  const [whiteMultiplier, setWhiteMultiplier] = useState(2);
  const [selectedDrill, setSelectedDrill] = useState("");
  const [selectedTargets, setSelectedTargets] = useState({});
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const [initialOverall, setInitialOverall] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/calculator/meta").then((r) => {
      setMeta(r.data);
      const init = {};
      [...(r.data.all_attrs || []), ...(r.data.gk_all_attrs || [])].forEach((a) => (init[a] = 1));
      setStats(init);
    });
  }, []);

  // Reset drill & results every time position changes
  useEffect(() => {
    setSelectedDrill("");
    setSelectedTargets({});
    setResult(null);
    setStep(1);
  }, [activeRoles]);

  const whiteSet = useMemo(() => {
    if (!meta) return new Set();
    const s = new Set();
    activeRoles.forEach((r) => (meta.roles[r] || []).forEach((a) => s.add(a)));
    return s;
  }, [activeRoles, meta]);

  const drillObj = useMemo(() => {
    if (!meta || !selectedDrill) return null;
    return meta.drills.find((d) => d.name === selectedDrill);
  }, [meta, selectedDrill]);

  // drill attrs filtered to those that are also white (kuncian). If user hasn't picked position, use all drill attrs.
  const drillTargetCandidates = useMemo(() => {
    if (!drillObj) return [];
    return drillObj.attrs.filter((a) => whiteSet.size === 0 || whiteSet.has(a));
  }, [drillObj, whiteSet]);

  const goPickDrill = () => {
    setErr("");
    if (whiteSet.size === 0) { setErr("Pilih minimal 1 posisi."); return; }
    setStep(2);
  };

  const pickDrill = (name) => {
    setSelectedDrill(name);
    // auto-select all drill attrs as target (that match white set)
    const drill = meta.drills.find((d) => d.name === name);
    const next = {};
    drill.attrs.forEach((a) => {
      if (whiteSet.has(a)) next[a] = { prio: 1, goal: 340 };
    });
    setSelectedTargets(next);
    setStep(3);
  };

  const toggleTarget = (a) => {
    setSelectedTargets((prev) => {
      const copy = { ...prev };
      if (copy[a]) delete copy[a];
      else copy[a] = { prio: 1, goal: 340 };
      return copy;
    });
  };

  const updateTarget = (a, f, v) => {
    setSelectedTargets((prev) => ({ ...prev, [a]: { ...prev[a], [f]: v } }));
  };

  const run = async () => {
    setErr(""); setResult(null);
    const targets = Object.entries(selectedTargets).map(([name, v]) => ({
      name, prio: 1, goal: Math.min(340, parseInt(v.goal) || 340),
    }));
    if (!targets.length) { setErr("Pilih minimal 1 atribut target dari drill ini."); return; }
    setLoading(true);
    try {
      // Compute initial overall before drill for delta display
      const isGk = activeRoles.includes("GK");
      const scoreAttrs = isGk ? (meta.gk_all_attrs || []) : (meta.all_attrs || []);
      const initTotal = scoreAttrs.reduce((sum, a) => {
        let v = parseInt(stats[a]) || 1;
        return sum + v;
      }, 0);
      setInitialOverall(Math.round(initTotal / 15));

      const data = await runCalculator({ activeRoles, stats, bonus, greyLimit, targets, singleDrill: selectedDrill, playerAge, whiteMultiplier });
      setResult(data);
      setStep(4);
      setTimeout(() => document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" }), 100);
      await refresh();
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setLoading(false); }
  };

  if (!meta) return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="space-y-6" data-testid="single-drill-page">
      <div>
        <Link to="/app/training" className="text-xs text-[#A0AAB5] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1 transition">
          <CaretLeft size={12} /> Modul Latihan
        </Link>
        <div className="flex items-center gap-2 mt-1 mb-1">
          <Crosshair size={18} className="text-[#38BDF8]" weight="fill" />
          <div className="badge badge-blue">FOKUS 1 DRILL</div>
        </div>
        <h1 className="section-title text-3xl">Single Drill</h1>
        <p className="text-[#A0AAB5] text-sm mt-1">Pilih 1 drill, sistem akan memfilter target otomatis dari atribut drill tersebut.</p>
      </div>

      <PlayerForm meta={meta} stats={stats} setStats={setStats}
        activeRoles={activeRoles} setActiveRoles={setActiveRoles}
        bonus={bonus} setBonus={setBonus} greyLimit={greyLimit} setGreyLimit={setGreyLimit}
        playerAge={playerAge} setPlayerAge={setPlayerAge}
        whiteMultiplier={whiteMultiplier} setWhiteMultiplier={setWhiteMultiplier}>
        <button onClick={goPickDrill} className="btn-primary w-full mt-6" data-testid="sd-next-drill-btn">
          Lanjut: Pilih Drill →
        </button>
        {err && step === 1 && <div className="badge badge-red mt-3 w-full justify-center !py-2">{err}</div>}
      </PlayerForm>

      {/* STEP 2: Pick Drill (card grid with drill's attrs visible) */}
      {step >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 sm:p-6" data-testid="drill-picker">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] text-[#0B0C10] font-black flex items-center justify-center">2</div>
            <div className="font-display font-bold text-xl">Pilih 1 Drill</div>
          </div>
          <p className="text-xs text-[#A0AAB5] mb-4">
            Tiap drill sudah menampilkan atribut yang naik. Klik untuk memilih — target akan auto-terisi dari atribut kuncian.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meta.drills.map((d) => {
              const isGk = activeRoles.includes("GK");
              const validSet = isGk ? new Set(meta.gk_all_attrs || []) : new Set(meta.all_attrs || []);
              const effAttrs = d.attrs.filter((a) => validSet.has(a));
              const kuncianHits = effAttrs.filter((a) => whiteSet.has(a)).length;
              const darkHits = effAttrs.length - kuncianHits;
              const isSel = selectedDrill === d.name;
              const noKunci = kuncianHits === 0 && whiteSet.size > 0;
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => !noKunci && pickDrill(d.name)}
                  disabled={noKunci}
                  className={`text-left card-solid p-4 transition-all duration-200 ${isSel ? "border-2 !border-[#38BDF8] bg-[#38BDF8]/6" : ""} ${noKunci ? "opacity-40 cursor-not-allowed" : "hover-lift cursor-pointer"}`}
                  data-testid={`drill-card-${d.name}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-display font-bold text-white text-base leading-tight">{d.name}</div>
                    {isSel && <CheckCircle size={18} weight="fill" className="text-[#38BDF8] shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#A0AAB5]">
                    <span>{effAttrs.length} attr aktif</span>
                    <span>·</span>
                    <span>Cost: <b className="text-[#FFFFFF]">{d.cost}</b></span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {effAttrs.map((a) => (
                      <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded ${whiteSet.has(a) ? "tag-w" : "tag-g"}`}>{a}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <span className="text-[#3FCA7C]">✓ Kuncian: {kuncianHits}</span>
                    {darkHits > 0 && <span className="text-[#E50914]">⚠ Gelap: {darkHits}</span>}
                    {noKunci && <span className="text-[#E50914]">Tidak ada kuncian</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 3: Refine targets (only from drill attrs) */}
      {step >= 3 && drillObj && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] text-[#0B0C10] font-black flex items-center justify-center">3</div>
            <div>
              <div className="font-display font-bold text-xl">Target dari <span className="text-[#38BDF8]">{drillObj.name}</span></div>
              <div className="text-xs text-[#A0AAB5] mt-0.5">Target otomatis dari atribut kuncian di drill ini. Klik card untuk toggle, atur goal.</div>
            </div>
          </div>

          {/* Info: grey attrs skipped (already above grey_limit) */}
          {(() => {
            const isGk = activeRoles.includes("GK");
            const validSet = isGk ? new Set(meta.gk_all_attrs || []) : new Set(meta.all_attrs || []);
            const greyInDrill = drillObj.attrs.filter((a) => validSet.has(a) && !whiteSet.has(a));
            const skipped = greyInDrill.filter((a) => (parseInt(stats[a]) || 1) >= parseInt(greyLimit));
            if (skipped.length === 0) return null;
            return (
              <div className="flex items-start gap-2 text-xs p-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 mb-4">
                <Warning size={14} className="text-[#f59e0b] shrink-0 mt-0.5" weight="fill" />
                <span className="text-[#f59e0b]">
                  Atribut gelap <b>{skipped.join(", ")}</b> sudah mencapai/melebihi batas limit gelap ({greyLimit}) — atribut ini tidak akan naik, tapi tidak menghalangi drill.
                </span>
              </div>
            );
          })()}

          {drillTargetCandidates.length === 0 ? (
            <div className="badge badge-red w-full justify-center !py-2">Drill ini tidak punya atribut kuncian untuk posisi yang dipilih.</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {drillTargetCandidates.map((a) => (
                <TargetCard key={a} attr={a} stats={stats} bonus={bonus}
                  selected={selectedTargets[a]}
                  onToggle={() => toggleTarget(a)}
                  onChange={(f, v) => updateTarget(a, f, v)}
                  allowedPrios={[1]} />
              ))}
            </div>
          )}
          {err && <div className="badge badge-red mt-4 w-full justify-center !py-2">{err}</div>}
          <button onClick={run} disabled={loading || !drillTargetCandidates.length} className="btn-primary w-full mt-6" data-testid="sd-run-btn">
            {loading ? "Calculating..." : `Jalankan Drill "${drillObj.name}"`}
          </button>
        </motion.div>
      )}

      {step === 4 && result && (
        <ResultSection
          result={result} meta={meta} bonus={bonus} stats={stats}
          initialOverall={initialOverall} gkMode={activeRoles.includes("GK")}
          savePayload={{
            mode: "single",
            position: activeRoles.join(", "),
            roles: activeRoles,
            input_stats: stats,
            targets: Object.entries(selectedTargets).map(([name, v]) => ({ name, prio: 1, goal: parseInt(v.goal) || 340 })),
            grey_limit: parseInt(greyLimit) || 40,
            white_multiplier: parseInt(whiteMultiplier) || 1,
          }}
        />
      )}

      {step === 4 && (
        <div className="flex gap-3">
          <button onClick={() => { setStep(1); setResult(null); setSelectedDrill(""); }} className="btn-outline">Reset</button>
          <button onClick={() => setStep(2)} className="btn-outline">Ganti Drill</button>
          <button onClick={() => setStep(3)} className="btn-outline">Ubah Target</button>
        </div>
      )}
    </div>
  );
}
