import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CaretLeft } from "@phosphor-icons/react";
import { PlayerForm, TargetCard, ResultSection, runCalculator } from "./shared";

const ACTIVE_ROLES = ["GK"];

export default function GKLatihan() {
  const { refresh } = useAuth();
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState({});
  const [bonus, setBonus] = useState(0);
  const [greyLimit, setGreyLimit] = useState(40);
  const [playerAge, setPlayerAge] = useState(18);
  const [whiteMultiplier, setWhiteMultiplier] = useState(2);
  const [selectedTargets, setSelectedTargets] = useState({});
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/calculator/meta").then((r) => {
      setMeta(r.data);
      const init = {};
      (r.data.gk_all_attrs || []).forEach((a) => (init[a] = 1));
      setStats(init);
    });
  }, []);

  const whiteSet = useMemo(() => {
    if (!meta) return new Set();
    return new Set(meta.roles["GK"] || []);
  }, [meta]);

  const nextTargets = () => {
    setErr("");
    setSelectedTargets({});
    setStep(2);
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
      name, prio: parseInt(v.prio), goal: Math.min(340, parseInt(v.goal) || 340),
    }));
    if (!targets.length) { setErr("Pilih minimal 1 atribut target."); return; }
    setLoading(true);
    try {
      const data = await runCalculator({ activeRoles: ACTIVE_ROLES, stats, bonus, greyLimit, targets, playerAge, whiteMultiplier });
      setResult(data);
      setStep(3);
      setTimeout(() => document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" }), 100);
      await refresh();
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setLoading(false); }
  };

  if (!meta) return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="space-y-6" data-testid="gk-latihan-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/app/training" className="text-xs text-[#A0AAB5] font-semibold hover:text-[#00A8FF] inline-flex items-center gap-1 transition">
            <CaretLeft size={12} /> Modul Latihan
          </Link>
          <div className="flex items-center gap-2 mt-1 mb-1">
            <Shield size={18} className="text-[#00A8FF]" weight="fill" />
            <div className="badge badge-gold">KIPER</div>
          </div>
          <h1 className="section-title text-3xl">GK Latihan</h1>
          <p className="text-[#A0AAB5] text-sm mt-1">Algoritma sniper khusus untuk kiper — atribut kiper semua terang kecuali Fisik (hanya Kebugaran terang).</p>
        </div>
      </div>

      <PlayerForm meta={meta} stats={stats} setStats={setStats}
                  activeRoles={ACTIVE_ROLES} setActiveRoles={() => {}}
                  bonus={bonus} setBonus={setBonus} greyLimit={greyLimit} setGreyLimit={setGreyLimit}
                  playerAge={playerAge} setPlayerAge={setPlayerAge}
                  whiteMultiplier={whiteMultiplier} setWhiteMultiplier={setWhiteMultiplier}
                  gkMode={true}>
        <button onClick={nextTargets} className="btn-primary w-full mt-6" data-testid="gk-next-target-btn">
          Lanjut: Pilih Target →
        </button>
        {err && step === 1 && <div className="badge badge-red mt-3 w-full justify-center !py-2">{err}</div>}
      </PlayerForm>

      {step >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-solid p-5 sm:p-6" data-testid="gk-target-section">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A8FF] to-[#0077CC] text-[#0B0C10] font-black flex items-center justify-center">2</div>
            <div className="font-display font-bold text-xl">Pilih Target & Prioritas</div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(whiteSet).sort().map((a) => (
              <TargetCard key={a} attr={a} stats={stats} bonus={bonus}
                          selected={selectedTargets[a]}
                          onToggle={() => toggleTarget(a)}
                          onChange={(f, v) => updateTarget(a, f, v)} />
            ))}
          </div>
          {err && <div className="badge badge-red mt-4 w-full justify-center !py-2" data-testid="gk-error">{err}</div>}
          <button onClick={run} disabled={loading} className="btn-primary w-full mt-6" data-testid="gk-run-btn">
            {loading ? "Calculating..." : "Jalankan Kalkulasi GK"}
          </button>
        </motion.div>
      )}

      {step === 3 && result && <ResultSection result={result} meta={meta} bonus={bonus} stats={stats} gkMode={true} />}

      {step === 3 && (
        <div className="flex gap-3">
          <button onClick={() => { setStep(1); setResult(null); }} className="btn-outline">Reset</button>
          <button onClick={() => setStep(2)} className="btn-outline">Ubah Target</button>
        </div>
      )}
    </div>
  );
}
