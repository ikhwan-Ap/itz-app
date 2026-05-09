import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import FootballPitchCanvas from "@/components/public/FootballPitchCanvas";
import ScrollReveal from "@/components/public/ScrollReveal";
import { Target, Users, ChartBar, Quotes } from "@phosphor-icons/react";
import { api } from "@/lib/api";

export default function Home() {
  const heroRef = useRef(null);
  const [stats, setStats] = useState({ users: "10K+", drills: "50+", support: "24/7" });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const eyebrow = hero.querySelector(".hero-eyebrow");
    const h1 = hero.querySelector(".hero-headline-1");
    const h2 = hero.querySelector(".hero-headline-2");
    const sub = hero.querySelector(".hero-sub");
    const cta = hero.querySelector(".hero-cta");
    const statsEl = hero.querySelector(".hero-stats");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(eyebrow, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.3);
    tl.fromTo(h1, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4);
    tl.fromTo(h2, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.5);
    tl.fromTo(sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.6);
    tl.fromTo(cta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.75);
    tl.fromTo(statsEl, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, 0.9);
    return () => tl.kill();
  }, []);

  return (
    <div data-testid="page-home">
      {/* Hero with animated pitch */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <FootballPitchCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0C10]/30 to-[#0B0C10]" />
        <div className="relative z-10 content-max-width text-center pt-20">
          <p className="hero-eyebrow text-eyebrow mb-5 opacity-0">
            INDONESIAN TOP ELEVEN COMMUNITY
          </p>
          <h1 className="text-display text-white">
            <span className="hero-headline-1 block opacity-0">Optimize Your</span>
            <span className="hero-headline-2 block opacity-0 mt-2">
              <span className="text-glow-blue text-[#00A8FF]">Tactical</span> Edge
            </span>
          </h1>
          <p className="hero-sub mt-7 italic font-light text-base sm:text-lg max-w-xl mx-auto text-[#A0AAB5] opacity-0">
            "Unity in Time — We Suffer, We Grow, We Achieve."
          </p>
          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
            <Link to="/tools" className="btn-primary" data-testid="home-explore-cta">Explore Tools</Link>
            <Link to="/about" className="btn-secondary" data-testid="home-learn-cta">Learn More</Link>
          </div>
          <div
            className="hero-stats mt-14 inline-flex flex-col sm:flex-row items-center gap-7 sm:gap-12 px-7 sm:px-12 py-5 rounded-xl border border-[#2A2F36] opacity-0"
            style={{ backgroundColor: "rgba(22, 27, 34, 0.6)", backdropFilter: "blur(12px)" }}
          >
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">{stats.users}</p>
              <p className="text-xs mt-1 text-[#5C6670]">Active Managers</p>
            </div>
            <div className="w-px h-8 bg-[#2A2F36] hidden sm:block" />
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">{stats.drills}</p>
              <p className="text-xs mt-1 text-[#5C6670]">Training Drills</p>
            </div>
            <div className="w-px h-8 bg-[#2A2F36] hidden sm:block" />
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">{stats.support}</p>
              <p className="text-xs mt-1 text-[#5C6670]">Community Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-[#161B22]">
        <div className="content-max-width">
          <ScrollReveal><p className="text-eyebrow mb-3">WHAT WE OFFER</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="text-h2 text-white">Everything You Need to Dominate</h2></ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              { icon: Target, title: "Tactical Sniper", desc: "Pinpoint the exact training focus for each player position. No wasted sessions — every drill optimized for maximum attribute growth." },
              { icon: Users, title: "Community Hub", desc: "Connect with thousands of Indonesian Top Eleven managers. Share formations, discuss strategies, climb the ranks together." },
              { icon: ChartBar, title: "Live Analytics", desc: "Track your squad's progress with real-time data visualization. Monitor training efficiency and identify improvement areas instantly." },
            ].map((f, i) => (
              <ScrollReveal key={i} delay={0.1 * (i + 1)}>
                <div className="card-hover rounded-xl p-9 h-full bg-[#0B0C10]" data-testid={`feature-card-${i}`}>
                  <f.icon size={32} weight="duotone" className="text-[#00A8FF]" />
                  <h3 className="text-h3 text-white mt-5">{f.title}</h3>
                  <p className="mt-3 text-base text-[#A0AAB5]">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <ScrollReveal><p className="text-eyebrow-red mb-3">MANAGER STORIES</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="text-h2 text-white">Voices from the Pitch</h2></ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14">
            {[
              { quote: "ITZ changed how I approach training. My squad quality jumped 15% in just two weeks using the Tactical Sniper.", name: "Andi W.", role: "Top Eleven Manager since 2019" },
              { quote: "The community here is incredible. I found my current association through ITZ and we just won our first Platinum tournament.", name: "Rina S.", role: "Association Leader" },
            ].map((t, i) => (
              <ScrollReveal key={i} delay={0.15 * (i + 1)}>
                <div className="rounded-xl p-9 border border-[#2A2F36] bg-[#161B22] h-full">
                  <Quotes size={28} className="text-[#00A8FF] opacity-50" weight="fill" />
                  <p className="text-base sm:text-lg text-white leading-relaxed italic mt-3">{t.quote}</p>
                  <div className="flex items-center gap-4 mt-7">
                    <div className="w-12 h-12 rounded-full gradient-avatar" />
                    <div>
                      <p className="font-semibold text-sm text-white">{t.name}</p>
                      <p className="text-xs text-[#5C6670]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 gradient-blue">
        <div className="content-max-width text-center">
          <ScrollReveal><h2 className="text-h2 text-white">Ready to Transform Your Team?</h2></ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-4 text-base max-w-lg mx-auto text-white/85">
              Join 10,000+ managers who are already training smarter.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-sm tracking-wider uppercase mt-8 transition-all duration-300 hover:shadow-lg bg-[#0B0C10] text-[#00A8FF]"
              data-testid="home-cta-banner"
            >
              Get Started Free
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
