import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Barbell, Target, SoccerBall, Crosshair, ArrowRight, Lightning } from "@phosphor-icons/react";

const modules = [
  {
    key: "full",
    to: "/app/training/full",
    icon: Target,
    title: "Full Latihan",
    subtitle: "Sniper Engine",
    desc: "Sistem cerdas mencari kombinasi drill paling hemat untuk mencapai target mutu pemain Anda. Cocok untuk optimasi maksimal.",
    features: [
      "Multi-prioritas (1, 2, 3)",
      "Semua drill dieksplorasi otomatis",
      "Hasil: urutan drill paling efisien",
      "Cocok untuk kenaikan massal",
    ],
    tag: "RECOMMENDED",
    badge: "badge-gold",
  },
  {
    key: "single",
    to: "/app/training/single",
    icon: Crosshair,
    title: "Single Drill",
    subtitle: "Fokus 1 Drill",
    desc: "Pilih 1 drill tertentu, lihat berapa banyak yang bisa dinaikkan dari drill itu saja. Cocok untuk eksperimen & latihan harian.",
    features: [
      "Hanya 1 drill yang dieksekusi",
      "Target otomatis dari atribut drill",
      "Hasil cepat & terfokus",
      "Ideal untuk drill favorit",
    ],
    tag: "FOKUS",
    badge: "badge-blue",
  },
];

export default function TrainingHub() {
  return (
    <div className="space-y-7" data-testid="training-hub">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Barbell size={16} className="text-[#D4AF37]" weight="fill" />
          <div className="badge badge-gold">TRAINING</div>
        </div>
        <h1 className="section-title text-4xl">Modul Latihan</h1>
        <p className="text-[#9FB0CC] text-sm mt-2 max-w-2xl">
          Pilih metode latihan yang Anda butuhkan. Semua modul menghormati cap 180% + batas atribut gelap.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Link to={m.to} className="block group" data-testid={`training-module-${m.key}`}>
              <div className="card-glow p-7 hover-lift h-full relative overflow-hidden">
                {/* Floating watermark icon */}
                <m.icon
                  size={160}
                  weight="duotone"
                  className="absolute -right-6 -bottom-6 text-[#D4AF37]/10 group-hover:text-[#D4AF37]/20 transition-colors"
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#A88527] flex items-center justify-center shrink-0 glow-gold">
                      <m.icon size={28} weight="fill" color="#0A182B" />
                    </div>
                    <span className={`badge ${m.badge}`}>{m.tag}</span>
                  </div>
                  <div className="text-xs text-[#D4AF37] font-bold tracking-widest uppercase">{m.subtitle}</div>
                  <h2 className="font-display font-black text-3xl mt-1 text-white">{m.title}</h2>
                  <p className="text-[#9FB0CC] text-sm mt-3 leading-relaxed">{m.desc}</p>
                  <ul className="mt-5 space-y-1.5">
                    {m.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-[#F4EBDC]">
                        <Lightning size={12} weight="fill" className="text-[#D4AF37] mt-1 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-[#D4AF37] font-bold text-sm uppercase tracking-widest font-display group-hover:gap-4 transition-all duration-300">
                    Buka Modul <ArrowRight size={18} weight="bold" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="card-solid p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center shrink-0">
          <SoccerBall size={20} weight="duotone" className="text-[#D4AF37]" />
        </div>
        <div className="text-sm text-[#9FB0CC]">
          <span className="text-white font-bold">Tips:</span> Mulai dengan <span className="text-[#D4AF37] font-semibold">Full Latihan</span> untuk optimasi jangka panjang. Gunakan <span className="text-[#D4AF37] font-semibold">Single Drill</span> untuk cek seberapa kuat efek 1 drill tertentu terhadap target Anda.
        </div>
      </div>
    </div>
  );
}
