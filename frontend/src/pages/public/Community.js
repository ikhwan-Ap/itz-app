import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/public/HeroSection";
import ScrollReveal from "@/components/public/ScrollReveal";
import { ChatCircleDots, YoutubeLogo, Trophy } from "@phosphor-icons/react";
import { api } from "@/lib/api";

const hubs = [
  {
    icon: ChatCircleDots,
    name: "Discord Community",
    desc: "Real-time chat, voice channels saat match, dan room dedicated untuk training discussion. Disinilah magic happens.",
    count: "6,800+ members",
    cta: "Join Server",
    link: "#",
  },
  {
    icon: YoutubeLogo,
    name: "YouTube Channel",
    desc: "Weekly tutorials, match analysis, live streams, dan community highlight reels. Video baru setiap Jumat.",
    count: "12K+ subscribers",
    cta: "Subscribe",
    link: "#",
  },
  {
    icon: Trophy,
    name: "Association Network",
    desc: "Temukan asosiasi yang cocok dengan activity level-mu. Dari casual sampai competitive — ada home untuk setiap manager.",
    count: "80+ associations",
    cta: "Find Yours",
    link: "/register",
  },
];

export default function Community() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/events").then((r) => setEvents((r.data || []).slice(0, 6))).catch(() => {});
  }, []);

  const formatDay = (d) => {
    if (!d) return { day: "—", month: "TBA" };
    const dt = new Date(d);
    return {
      day: String(dt.getDate()).padStart(2, "0"),
      month: dt.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    };
  };

  return (
    <div data-testid="page-community">
      <HeroSection
        eyebrow="COMMUNITY"
        headlineLine1="Stronger"
        headlineLine2="Together"
        subheadline="10,000+ Indonesian managers. Satu passion bersama. Zero toxicity."
        ctaText="Join Discord Server"
        ctaLink="#"
        gradient="radial-gradient(ellipse at 50% 30%, rgba(0, 168, 255, 0.06) 0%, transparent 50%)"
      />

      <section className="section-padding bg-[#161B22]">
        <div className="content-max-width">
          <ScrollReveal>
            <p className="text-eyebrow-red mb-4">GET INVOLVED</p>
            <h2 className="text-h2 text-white">Find Your Place</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {hubs.map((hub, i) => (
              <ScrollReveal key={i} delay={0.08 * (i + 1)}>
                <div className="card-hover rounded-xl p-9 h-full bg-[#0B0C10]" data-testid={`hub-${i}`}>
                  <hub.icon size={32} weight="duotone" className="text-[#00A8FF]" />
                  <h3 className="font-space text-lg text-white font-semibold mt-5">{hub.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#A0AAB5]">{hub.desc}</p>
                  <p className="mt-4 text-sm font-medium text-[#5C6670]">{hub.count}</p>
                  <Link to={hub.link} className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#00A8FF] hover:gap-2 transition-all">
                    {hub.cta} →
                  </Link>
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
                src="/images/feature-community.jpg"
                alt="ITZ community discussing strategies"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: "450px" }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <p className="text-eyebrow mb-2">TOGETHER WE GROW</p>
                <p className="text-lg text-white max-w-2xl">
                  Dari casual meetup sampai turnamen kompetitif, komunitas ITZ tempat persahabatan dan taktik dilahirkan.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-[#0B0C10]">
        <div className="content-max-width">
          <ScrollReveal>
            <p className="text-eyebrow mb-3">UPCOMING</p>
            <h2 className="text-h2 text-white">Community Events</h2>
          </ScrollReveal>
          {events.length === 0 ? (
            <div className="rounded-xl p-10 text-center text-[#A0AAB5] border border-[#2A2F36] mt-10">
              Belum ada event. Pantau Discord kami untuk update.
            </div>
          ) : (
            <div className="space-y-4 mt-10">
              {events.map((event, i) => {
                const d = formatDay(event.event_date);
                return (
                  <ScrollReveal key={event.id} delay={0.07 * i}>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-7 rounded-xl border border-[#2A2F36] bg-[#161B22] transition-all duration-200 hover:border-[#00A8FF]/40 hover:bg-[#00A8FF]/[0.04]" data-testid={`event-${i}`}>
                      <div className="flex-shrink-0 text-center min-w-[60px]">
                        <p className="font-space font-bold text-3xl text-[#00A8FF]">{d.day}</p>
                        <p className="text-xs font-medium mt-1 text-[#5C6670]">{d.month}</p>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-space text-base text-white font-semibold">{event.title}</h3>
                        <p className="mt-1 text-sm text-[#A0AAB5] line-clamp-2">{event.content}</p>
                      </div>
                      <Link to="/login" className="flex-shrink-0 text-sm font-medium text-[#00A8FF] hover:underline">
                        RSVP →
                      </Link>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
