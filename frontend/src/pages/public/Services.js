import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/public/HeroSection";
import ScrollReveal from "@/components/public/ScrollReveal";
import { Check, Crosshair, SquaresFour, ChartLineUp, UsersThree } from "@phosphor-icons/react";
import { api, formatRupiah } from "@/lib/api";

// Map design services to backend packages (price-source dynamic)
const SERVICES = [
  {
    num: "01",
    icon: Crosshair,
    key: "tactical-sniper",
    title: "Tactical Sniper",
    pkgIndex: 0, // Trial Free
    desc: "Input current attributes, target quality & posisi pemain. Algoritma kami menghitung kombinasi drill yang tepat untuk mencapai target dalam sesi paling sedikit. Termasuk Full Latihan & Single Drill mode.",
    features: [
      "Multi-priority sniper engine",
      "Single drill picker dengan auto-target",
      "Step-by-step drill simulation",
      "Goal cap & average cap respect",
    ],
  },
  {
    num: "02",
    icon: SquaresFour,
    key: "formation-lab",
    title: "Formation Lab",
    pkgIndex: 1, // Starter Monthly
    desc: "Eksplorasi formasi proven untuk setiap gaya taktik. Setiap setup mencakup player roles, pressing intensity, & passing focus — sudah dites oleh top association managers.",
    features: [
      "30+ formasi dengan analisis lengkap",
      "Drag & drop role assignment",
      "Pressing & tactical instructions preset",
      "Export ke share-link",
    ],
  },
  {
    num: "03",
    icon: ChartLineUp,
    key: "training-analytics",
    title: "Training Analytics",
    pkgIndex: 1, // Starter Monthly
    desc: "Visualisasi pertumbuhan squad-mu dari waktu ke waktu. Identifikasi pemain yang berkembang paling cepat dan posisi yang butuh perhatian segera.",
    features: [
      "Live attribute progression chart",
      "Position weakness detection",
      "Training efficiency score",
      "Weekly progress report",
    ],
  },
  {
    num: "04",
    icon: UsersThree,
    key: "association-toolkit",
    title: "Association Toolkit",
    pkgIndex: 2, // Pro Yearly
    desc: "Recruitment template, match scheduling tools, & internal league management — semua yang dibutuhkan association leader untuk mengelola tim premium.",
    features: [
      "Member management & rotasi",
      "Internal tournament builder",
      "Match scheduling otomatis",
      "Priority support 24/7",
    ],
  },
];

export default function Services() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    api.get("/packages").then((r) => setPackages(r.data || [])).catch(() => {});
  }, []);

  const priceFor = (idx) => {
    const p = packages[idx];
    if (!p) return { label: "—", note: "" };
    if (p.is_trial) return { label: "Free Trial", note: `${p.duration_value || 7} hari coba gratis` };
    return {
      label: formatRupiah(p.price),
      note: `Per ${p.duration_value} ${p.duration_type === "yearly" ? "tahun" : "bulan"}`,
    };
  };

  return (
    <div data-testid="page-services">
      <HeroSection
        eyebrow="SERVICES"
        eyebrowColor="red"
        headlineLine1="Tools That"
        headlineLine2="Give You the Edge"
        subheadline="Dari training calculator sampai association toolkit — semua yang kamu butuhkan untuk mengalahkan lawan."
        gradient="radial-gradient(ellipse at 50% 0%, rgba(229, 9, 20, 0.07) 0%, transparent 60%)"
      />

      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <div className="space-y-0">
            {SERVICES.map((s, i) => {
              const pr = priceFor(s.pkgIndex);
              return (
                <ScrollReveal key={i} delay={0.08 * i}>
                  <div className="grid grid-cols-1 md:grid-cols-[28%_1fr_22%] gap-8 md:gap-10 py-10 md:py-14 border-b border-[#2A2F36]" data-testid={`service-${s.key}`}>
                    <div className="flex items-start gap-5">
                      <span className="font-space font-bold text-5xl md:text-7xl text-[#38BDF8] leading-none">
                        {s.num}
                      </span>
                      <s.icon size={36} weight="duotone" className="text-[#38BDF8] mt-3 hidden md:block" />
                    </div>
                    <div>
                      <h3 className="text-h3 text-white">{s.title}</h3>
                      <p className="mt-3 text-base max-w-xl leading-relaxed text-[#A0AAB5]">{s.desc}</p>
                      <ul className="mt-5 space-y-2 max-w-xl">
                        {s.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-white">
                            <Check size={16} weight="bold" className="text-[#38BDF8] mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs uppercase tracking-widest text-[#5C6670]">Mulai dari</p>
                      <p className="font-space font-bold text-3xl md:text-4xl text-[#38BDF8] mt-1" data-testid={`service-price-${s.key}`}>
                        {pr.label}
                      </p>
                      <p className="text-xs text-[#A0AAB5] mt-1">{pr.note}</p>
                      <Link to="/register" className="btn-primary mt-5 !text-xs !py-2.5">Get Access</Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing transparency */}
      <section className="py-20 md:py-24 bg-[#161B22]">
        <div className="content-max-width text-center max-w-3xl mx-auto">
          <ScrollReveal>
            <p className="text-eyebrow mb-3">FAIR & TRANSPARENT</p>
            <h2 className="text-h2 text-white">Kenapa Berbayar?</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#A0AAB5]">
              Biaya yang kami kenakan menutupi <span className="text-white font-medium">ongkos kerja developer</span>,
              <span className="text-white font-medium"> server cloud</span>, database, dan riset training data harian.
              Dengan harga yang adil, kami bisa menjaga tools tetap update setiap musim Top Eleven.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary">Mulai Trial Gratis</Link>
              <Link to="/contact" className="btn-secondary">Hubungi Kami</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
