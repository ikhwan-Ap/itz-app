import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import Logo from "@/components/Logo";
import { Lightning, Trophy, Users, CaretRight, Newspaper, CalendarDots, Check, Target } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function Landing() {
  const [packages, setPackages] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/packages").then((r) => setPackages(r.data)).catch(() => {}),
      api.get("/news").then((r) => setNews(r.data.slice(0, 3))).catch(() => {}),
      api.get("/events").then((r) => setEvents(r.data.slice(0, 3))).catch(() => {}),
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-ambient bg-grain overflow-x-hidden">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#060F1F]/85 backdrop-blur-md border-b border-[#D4AF37]/15">
        <div className="max-w-[1300px] mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/"><Logo size={42} /></Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#9FB0CC]">
            <a href="#features" className="hover:text-[#D4AF37] transition">Features</a>
            <a href="#packages" className="hover:text-[#D4AF37] transition">Pricing</a>
            <a href="#news" className="hover:text-[#D4AF37] transition">News</a>
            <a href="#events" className="hover:text-[#D4AF37] transition">Events</a>
          </nav>
          <div className="flex gap-2">
            <Link to="/login" className="btn-outline !py-2 !px-4" data-testid="nav-login-btn">Login</Link>
            <Link to="/register" className="btn-primary !py-2 !px-4" data-testid="nav-register-btn">Join</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Logo watermark backdrop */}
        <div className="absolute right-[-6%] top-[10%] w-[min(560px,80vw)] h-[min(560px,80vw)] opacity-[0.08] pointer-events-none hidden lg:block">
          <img src="/assets/itz-logo.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060F1F]/30 to-[#060F1F]" />

        <div className="relative max-w-[1300px] mx-auto px-5 py-24 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="badge badge-gold">⚽ OFFICIAL · INDO TIMEZONE FOOTBALL COMMUNITY</span>
            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.88] mt-5">
              <span className="text-[#F4EBDC]">Train Smarter.</span><br />
              <span className="brand-gradient">Hit Harder.</span><br />
              <span className="text-[#D4AF37]">Achieve More.</span>
            </h1>
            <p className="font-serif text-xl text-[#D4AF37]/90 mt-4 tracking-wide">
              "Unity in Time — We Suffer, We Grow, We Achieve"
            </p>
            <p className="max-w-2xl text-lg text-[#9FB0CC] mt-4 leading-relaxed">
              Kalkulator training cerdas untuk manager Top Eleven. Temukan rute drill paling hemat,
              hindari overspend pada atribut gelap, dan capai target mutu dengan presisi.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/register" className="btn-primary" data-testid="hero-register-btn">Start Free Trial</Link>
              <Link to="/login" className="btn-outline" data-testid="hero-login-btn">I have an account</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="divider-gold max-w-[1300px] mx-auto" />

      {/* Features */}
      <section id="features" className="py-20 relative">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="mb-12 text-center">
            <div className="badge badge-gold mb-3 mx-auto">★ BUILT FOR MANAGERS</div>
            <h2 className="section-title text-4xl lg:text-5xl">Fitur Unggulan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "Full Latihan Engine", desc: "Algoritma prioritas 1-2-3 yang tidak bikin atribut lain jomplang. Setiap drill menghormati goal semua target." },
              { icon: Lightning, title: "Single Drill Focus", desc: "Pilih 1 drill, target auto-filter dari atribut drill. Cocok untuk eksperimen & latihan harian." },
              { icon: Trophy, title: "180% Rules Compliant", desc: "Semua simulasi mengikuti cap 180% + batas atribut gelap. Transparan, step-by-step." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="card-solid p-7 hover-lift"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#A88527] text-[#0A182B] flex items-center justify-center mb-5 glow-gold">
                  <f.icon size={26} weight="fill" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-white">{f.title}</h3>
                <p className="text-[#9FB0CC] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-20 bg-[#081528]/40">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="text-center mb-12">
            <div className="badge badge-gold mb-3 mx-auto">PRICING</div>
            <h2 className="section-title text-4xl lg:text-5xl">Pilih Paketmu</h2>
            <p className="text-[#9FB0CC] mt-3">Mulai dari trial gratis, upgrade kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {packages.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`card-solid p-7 relative hover-lift ${i === 1 ? "border !border-[#D4AF37]/50 glow-gold" : ""}`}
                data-testid={`pkg-${p.id}`}
              >
                {i === 1 && <div className="absolute -top-3 left-6 badge badge-gold">MOST POPULAR</div>}
                <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">{p.duration_type}</div>
                <h3 className="font-display font-black text-2xl mt-1 text-white">{p.name}</h3>
                <div className="mt-4 mb-5">
                  <div className="font-display font-black text-5xl brand-gradient">{formatRupiah(p.price)}</div>
                  <div className="text-xs text-[#9FB0CC] mt-1">
                    {p.is_trial ? `Trial ${p.duration_value || 7} hari` : `Per ${p.duration_value} ${p.duration_type === "yearly" ? "tahun" : "bulan"}`}
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {(p.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-[#F4EBDC]">
                      <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" weight="bold" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/register?package=${p.id}`} className="btn-primary w-full block text-center" data-testid={`select-pkg-${p.id}`}>
                  Pilih Paket
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section id="news" className="py-20">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="badge badge-gold mb-2"><Newspaper size={12} className="inline mr-1" /> LATEST</div>
              <h2 className="section-title text-4xl">News</h2>
            </div>
          </div>
          {news.length === 0 ? (
            <div className="card-solid p-8 text-center text-[#9FB0CC]">Belum ada news.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-solid overflow-hidden hover-lift">
                  {n.image_url && <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${n.image_url})` }} />}
                  <div className="p-5">
                    <div className="text-xs text-[#D4AF37] mb-1 font-semibold tracking-widest uppercase">{new Date(n.created_at).toLocaleDateString("id-ID")}</div>
                    <h3 className="font-display font-bold text-lg mb-2 text-white">{n.title}</h3>
                    <p className="text-sm text-[#9FB0CC] line-clamp-3">{n.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-20 bg-[#081528]/40">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="badge badge-gold mb-2"><CalendarDots size={12} className="inline mr-1" /> UPCOMING</div>
              <h2 className="section-title text-4xl">Events</h2>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="card-solid p-8 text-center text-[#9FB0CC]">Belum ada event.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {events.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-solid p-5 hover-lift">
                  <div className="badge badge-gold mb-2">{e.event_date ? new Date(e.event_date).toLocaleDateString("id-ID") : "TBA"}</div>
                  <h3 className="font-display font-bold text-lg mb-2 text-white">{e.title}</h3>
                  <p className="text-sm text-[#9FB0CC] line-clamp-3">{e.content}</p>
                  <Link to="/login" className="text-[#D4AF37] text-sm font-bold mt-3 inline-flex items-center gap-1 hover:gap-2 transition-all">
                    Daftar <CaretRight size={14} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#D4AF37]/15 py-10 mt-4">
        <div className="max-w-[1300px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={34} showText={true} compact={true} />
          </div>
          <div className="text-xs text-[#9FB0CC] text-center">© 2026 Indo Timezone Football Community · Unity in Time</div>
          <div className="flex gap-4 text-xs text-[#9FB0CC]">
            <Link to="/login" className="hover:text-[#D4AF37]">Login</Link>
            <Link to="/register" className="hover:text-[#D4AF37]">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
