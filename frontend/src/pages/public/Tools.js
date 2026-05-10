import React from "react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/public/HeroSection";
import ScrollReveal from "@/components/public/ScrollReveal";
import { Crosshair, GridFour, MagnifyingGlass, Wallet, ArrowRight } from "@phosphor-icons/react";

const tools = [
  {
    icon: Crosshair,
    name: "Tactical Sniper",
    desc: "Hitung urutan drill optimal untuk posisi pemain & target quality apa saja. Updated untuk game engine terbaru.",
    status: "Live",
    statusColor: "#3FCA7C",
    link: "/login",
  },
  {
    icon: GridFour,
    name: "Formation Planner",
    desc: "Drag-and-drop formation builder dengan role assignments, tactical instructions, & export options.",
    status: "Beta",
    statusColor: "#F5C300",
    link: "/login",
  },
  {
    icon: MagnifyingGlass,
    name: "Squad Analyzer",
    desc: "Upload screenshot squad untuk pembacaan attribute & quality assessment instan.",
    status: "Live",
    statusColor: "#3FCA7C",
    link: "/login",
  },
  {
    icon: Wallet,
    name: "Token Tracker",
    desc: "Rencanakan token spending sepanjang season. Budget untuk transfers, stadium upgrades, emergency rests.",
    status: "Coming Soon",
    statusColor: "#5C6670",
    link: "#",
  },
];

export default function Tools() {
  return (
    <div data-testid="page-tools">
      <HeroSection
        eyebrow="TOOLS"
        headlineLine1="Your Tactical"
        headlineLine2="Command Center"
        subheadline="Interactive calculators, visual planners, dan real-time analyzers — semua dibangun untuk serious managers."
        ctaText="Launch Tactical Sniper"
        ctaLink="/login"
        gradient="radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)"
      />

      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tools.map((tool, i) => (
              <ScrollReveal key={i} delay={0.08 * (i + 1)}>
                <div className="rounded-xl overflow-hidden border border-[#2A2F36] card-hover h-full flex flex-col bg-[#161B22]" data-testid={`tool-${i}`}>
                  <div
                    className="min-h-[200px] flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.10), rgba(229, 9, 20, 0.05))" }}
                  >
                    <tool.icon size={56} weight="duotone" style={{ color: "rgba(56, 189, 248, 0.5)" }} />
                  </div>
                  <div className="p-7 sm:p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-space text-lg sm:text-xl text-white font-semibold">{tool.name}</h3>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${tool.statusColor}20`, color: tool.statusColor }}
                      >
                        {tool.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed flex-1 text-[#A0AAB5]">{tool.desc}</p>
                    {tool.status !== "Coming Soon" && (
                      <Link to={tool.link} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#38BDF8] hover:gap-2 transition-all">
                        Open Tool <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#161B22]">
        <div className="content-max-width">
          <ScrollReveal>
            <div className="relative rounded-xl overflow-hidden">
              <img
                src="/images/feature-tactical.jpg"
                alt="Football tactical board"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: "450px" }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161B22] via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <p className="text-eyebrow mb-2">TACTICAL BOARD</p>
                <p className="text-lg text-white max-w-2xl">
                  Setiap formasi, setiap drill, setiap keputusan — dipetakan presisi oleh komunitas expert managers.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
