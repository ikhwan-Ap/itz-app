import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import { SoccerBall, Lightning, Trophy, Users, CaretRight, Newspaper, CalendarDots, Check } from "@phosphor-icons/react";
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
    <div className="min-h-screen pitch-bg bg-grain relative">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#0B1221]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1300px] mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D05E] flex items-center justify-center glow-brand">
              <SoccerBall size={22} weight="fill" color="#0b1221" />
            </div>
            <div>
              <div className="font-display font-black text-xl leading-none">TE SNIPER</div>
              <div className="text-[10px] text-[#9BA4B5] tracking-widest mt-0.5 uppercase">Training Calculator</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#9BA4B5]">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#packages" className="hover:text-white transition">Pricing</a>
            <a href="#news" className="hover:text-white transition">News</a>
            <a href="#events" className="hover:text-white transition">Events</a>
          </nav>
          <div className="flex gap-2">
            <Link to="/login" className="btn-outline !py-2 !px-4" data-testid="nav-login-btn">Login</Link>
            <Link to="/register" className="btn-primary !py-2 !px-4" data-testid="nav-register-btn">Join</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/4122451/pexels-photo-4122451.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(2px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1221]/40 via-[#0B1221]/80 to-[#0B1221]" />

        <div className="relative max-w-[1300px] mx-auto px-5 py-24 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="badge badge-green">⚡ Top Eleven Training Optimizer</span>
            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.9] mt-5">
              Train Smarter.<br />
              <span style={{ color: "#00D05E" }}>Hit Harder.</span><br />
              <span className="text-[#F5C300]">Win Every Match.</span>
            </h1>
            <p className="max-w-2xl text-lg text-[#9BA4B5] mt-6">
              Kalkulator cerdas untuk Top Eleven. Temukan rute drill paling hemat,
              hindari overspend pada atribut gelap, dan capai target mutu pemain dengan presisi.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/register" className="btn-primary" data-testid="hero-register-btn">Start Free Trial</Link>
              <Link to="/login" className="btn-outline" data-testid="hero-login-btn">I have an account</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="mb-12">
            <div className="badge badge-gold mb-3">★ Built for Managers</div>
            <h2 className="section-title text-4xl lg:text-5xl">Fitur Unggulan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Lightning, title: "Sniper Priority Engine", desc: "Algoritma prioritas 1-2-3 yang tidak bikin atribut lain jomplang. Setiap drill respect goal semua target." },
              { icon: Trophy, title: "Rules 180% Compliant", desc: "Semua simulasi mengikuti cap 180% + batas atribut gelap. Transparan, step-by-step." },
              { icon: Users, title: "Single Drill Mode", desc: "Mau latihan pakai 1 drill aja? Bisa. Hasil tetap akurat sesuai rules." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-solid p-6"
              >
                <div className="w-12 h-12 rounded-lg bg-[#00D05E]/15 text-[#00D05E] flex items-center justify-center mb-4">
                  <f.icon size={24} weight="duotone" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
                <p className="text-[#9BA4B5] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-20">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="text-center mb-12">
            <div className="badge badge-green mb-3">PRICING</div>
            <h2 className="section-title text-4xl lg:text-5xl">Pilih Paketmu</h2>
            <p className="text-[#9BA4B5] mt-3">Mulai dari trial gratis, upgrade kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {packages.map((p, i) => (
              <div key={p.id} className={`card-solid p-6 relative ${i === 1 ? "border-2 border-[#00D05E]/40 glow-brand" : ""}`} data-testid={`pkg-${p.id}`}>
                {i === 1 && <div className="absolute -top-3 left-6 badge badge-green">MOST POPULAR</div>}
                <div className="text-xs font-bold uppercase tracking-widest text-[#9BA4B5]">{p.duration_type}</div>
                <h3 className="font-display font-black text-2xl mt-1">{p.name}</h3>
                <div className="mt-4 mb-5">
                  <div className="font-display font-black text-5xl text-[#00D05E]">{formatRupiah(p.price)}</div>
                  <div className="text-xs text-[#9BA4B5] mt-1">
                    {p.is_trial ? `Trial ${p.duration_value || 7} hari` : `Per ${p.duration_value} ${p.duration_type === "yearly" ? "tahun" : "bulan"}`}
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {(p.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check size={16} className="text-[#00D05E] mt-0.5 shrink-0" weight="bold" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/register?package=${p.id}`} className="btn-primary w-full block text-center" data-testid={`select-pkg-${p.id}`}>
                  Pilih Paket
                </Link>
              </div>
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
            <div className="card-solid p-8 text-center text-[#9BA4B5]">No news yet.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n) => (
                <div key={n.id} className="card-solid overflow-hidden">
                  {n.image_url && (
                    <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${n.image_url})` }} />
                  )}
                  <div className="p-5">
                    <div className="text-xs text-[#9BA4B5] mb-1">{new Date(n.created_at).toLocaleDateString("id-ID")}</div>
                    <h3 className="font-display font-bold text-lg mb-2">{n.title}</h3>
                    <p className="text-sm text-[#9BA4B5] line-clamp-3">{n.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-20">
        <div className="max-w-[1300px] mx-auto px-5">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="badge badge-green mb-2"><CalendarDots size={12} className="inline mr-1" /> UPCOMING</div>
              <h2 className="section-title text-4xl">Events</h2>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="card-solid p-8 text-center text-[#9BA4B5]">No events yet.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {events.map((e) => (
                <div key={e.id} className="card-solid p-5">
                  <div className="badge badge-gold mb-2">{e.event_date ? new Date(e.event_date).toLocaleDateString("id-ID") : "TBA"}</div>
                  <h3 className="font-display font-bold text-lg mb-2">{e.title}</h3>
                  <p className="text-sm text-[#9BA4B5] line-clamp-3">{e.content}</p>
                  <Link to="/login" className="text-[#00D05E] text-sm font-bold mt-3 inline-flex items-center gap-1 hover:gap-2 transition-all">
                    Register <CaretRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 mt-12">
        <div className="max-w-[1300px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#9BA4B5]">© 2026 TE Sniper · Not affiliated with Top Eleven · Built for managers</div>
          <div className="flex gap-4 text-xs text-[#9BA4B5]">
            <Link to="/login" className="hover:text-white">Login</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
