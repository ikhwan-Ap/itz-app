import React from "react";
import HeroSection from "@/components/public/HeroSection";
import ScrollReveal from "@/components/public/ScrollReveal";

const teamMembers = [
  { name: "Kevin", role: "Founder & Lead Dev", bio: "Top Eleven veteran since 2015. Built ITZ from a simple spreadsheet into a full platform." },
  { name: "Dewi", role: "Community Manager", bio: "Manages our Discord and in-game associations. The glue that keeps us connected." },
  { name: "Bayu", role: "Head Analyst", bio: "Creates training formulas and tests every calculator update against live game data." },
  { name: "Sari", role: "Content Lead", bio: "Writes guides, produces tutorial videos, and localizes strategies for Indonesian managers." },
  { name: "Rian", role: "Events Coordinator", bio: "Organizes tournaments, live Q&A sessions, and community challenges." },
  { name: "Mira", role: "Moderator Team", bio: "Keeps the community safe, welcoming, and free from toxicity." },
];

export default function About() {
  return (
    <div data-testid="page-about">
      <HeroSection
        eyebrow="ABOUT ITZ"
        headlineLine1="Built by Managers,"
        headlineLine2="For Managers"
        subheadline="ITZ is the largest Indonesian community for Top Eleven Football Manager. We're on a mission to help every manager reach their full potential through data-driven tools and collaborative learning."
        ctaText="Join Our Community"
        ctaLink="/community"
        gradient="radial-gradient(ellipse at 50% 0%, rgba(0, 168, 255, 0.10) 0%, transparent 60%)"
      />

      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            <ScrollReveal>
              <p className="text-eyebrow mb-4">OUR MISSION</p>
              <h2 className="text-h2 text-white">Democratize Tactical Excellence</h2>
              <p className="mt-6 text-base leading-relaxed text-[#A0AAB5]">
                Setiap manager Top Eleven berhak akses ke tools profesional. Tidak ada paywall berlebihan, tidak ada gatekeeping —
                hanya pure football knowledge yang dibagikan ke komunitas dengan biaya terjangkau untuk menutup ongkos kerja & server.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="text-eyebrow-red mb-4">OUR VISION</p>
              <h2 className="text-h2 text-white">The Home of Indonesian Top Eleven</h2>
              <p className="mt-6 text-base leading-relaxed text-[#A0AAB5]">
                Pada 2027, ITZ menjadi sumber definitif bagi Indonesian-speaking Top Eleven managers — dengan localized guides,
                turnamen regional, dan jaringan asosiasi yang berkembang.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#161B22]">
        <div className="content-max-width">
          <ScrollReveal>
            <p className="text-eyebrow mb-4">THE SQUAD</p>
            <h2 className="text-h2 text-white">Meet the Starting XI</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {teamMembers.map((m, i) => (
              <ScrollReveal key={i} delay={0.07 * (i + 1)}>
                <div className="text-center rounded-xl p-8 border border-[#2A2F36] bg-[#0B0C10] h-full" data-testid={`team-${i}`}>
                  <div className="w-20 h-20 rounded-full gradient-avatar mx-auto" />
                  <h3 className="text-white text-lg font-space font-semibold mt-5">{m.name}</h3>
                  <p className="text-sm mt-1 text-[#00A8FF]">{m.role}</p>
                  <p className="text-sm mt-3 leading-relaxed text-[#A0AAB5]">{m.bio}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <ScrollReveal>
            <div className="relative rounded-xl overflow-hidden">
              <img
                src="/images/hero-manager.jpg"
                alt="ITZ team analyzing tactics"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: "500px" }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <p className="text-eyebrow mb-2">THE GRIND</p>
                <p className="text-lg md:text-xl max-w-2xl text-white">
                  Setiap taktik, setiap formasi, setiap rencana training — dibangun dengan passion oleh manager yang hidup & bernapas Top Eleven.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
