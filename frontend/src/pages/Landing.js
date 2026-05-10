import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import Logo from "@/components/Logo";
import { Target, Users, ChartBar, Lightning, Trophy, Newspaper, CalendarDots, Check, ArrowRight, SoccerBall } from "@phosphor-icons/react";
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
    <div className="bg-ambient bg-grain min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#0B0C10]/85 backdrop-blur-md border-b border-[#2A2F36]">
        <div className="content-max-width py-4 flex items-center justify-between">
          <Link to="/"><Logo size={42} /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A0AAB5]">
            <a href="#features" className="hover:text-white transition">Tools</a>
            <a href="#packages" className="hover:text-white transition">Pricing</a>
            <a href="#news" className="hover:text-white transition">News</a>
            <a href="#events" className="hover:text-white transition">Events</a>
          </nav>
          <div className="flex gap-2">
            <Link to="/login" className="btn-secondary !px-4 !py-2" data-testid="nav-login-btn">Login</Link>
            <Link to="/register" className="btn-primary !px-4 !py-2" data-testid="nav-register-btn">Join</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Animated radial spotlights */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-[15%] w-[420px] h-[420px] rounded-full bg-[#38BDF8]/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-[10%] w-[460px] h-[460px] rounded-full bg-[#E50914]/8 blur-[110px]" />
        </div>

        {/* Tactical pitch lines (subtle) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <rect x="100" y="100" width="1000" height="600" stroke="#38BDF8" strokeWidth="1" fill="none" />
          <line x1="600" y1="100" x2="600" y2="700" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="600" cy="400" r="80" stroke="#38BDF8" strokeWidth="1" fill="none" />
          <rect x="100" y="280" width="120" height="240" stroke="#38BDF8" strokeWidth="1" fill="none" />
          <rect x="980" y="280" width="120" height="240" stroke="#38BDF8" strokeWidth="1" fill="none" />
        </svg>

        <div className="relative z-10 content-max-width text-center pt-12">
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-eyebrow mb-5"
          >
            INDONESIAN TOP ELEVEN COMMUNITY
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-display"
          >
            <span className="block text-white">Optimize Your</span>
            <span className="block mt-1.5"><span className="text-glow-blue text-[#38BDF8]">Tactical</span> <span className="text-white">Edge</span></span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-7 text-lg max-w-xl mx-auto text-[#A0AAB5]"
          >
            Master your formation, train smarter, and build your legacy in Top Eleven — the community-driven way.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary" data-testid="hero-register-btn">Explore Tools</Link>
            <Link to="/login" className="btn-secondary" data-testid="hero-login-btn">I have an account</Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-14 inline-flex flex-col sm:flex-row items-center gap-7 sm:gap-10 px-7 sm:px-12 py-5 rounded-xl border border-[#2A2F36]"
            style={{ backgroundColor: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(12px)' }}
          >
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">10K+</p>
              <p className="text-xs mt-1 text-[#5C6670]">Active Managers</p>
            </div>
            <div className="w-px h-8 bg-[#2A2F36] hidden sm:block" />
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">50+</p>
              <p className="text-xs mt-1 text-[#5C6670]">Training Drills</p>
            </div>
            <div className="w-px h-8 bg-[#2A2F36] hidden sm:block" />
            <div className="text-center">
              <p className="font-space font-bold text-2xl text-white">24/7</p>
              <p className="text-xs mt-1 text-[#5C6670]">Community Support</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-padding" style={{ backgroundColor: '#161B22' }}>
        <div className="content-max-width">
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-eyebrow mb-3">
            WHAT WE OFFER
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="text-h2 text-white">
            Everything You Need to Dominate
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              { icon: Target, title: 'Tactical Sniper', desc: 'Pinpoint the exact training focus for each player position. No wasted sessions — every drill is optimized for maximum attribute growth.' },
              { icon: Users, title: 'Community Hub', desc: 'Connect with thousands of Indonesian Top Eleven managers. Share formations, discuss strategies, climb the ranks together.' },
              { icon: ChartBar, title: 'Live Analytics', desc: 'Track your squad\'s progress with real-time data. Monitor training efficiency and identify improvement areas instantly.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (i + 1) }}
                className="card-hover rounded-xl p-9 h-full"
                style={{ backgroundColor: '#0B0C10' }}
              >
                <feature.icon size={32} weight="duotone" style={{ color: '#38BDF8' }} />
                <h3 className="text-h3 text-white mt-5">{feature.title}</h3>
                <p className="mt-3 text-base text-[#A0AAB5]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="section-padding">
        <div className="content-max-width">
          <div className="text-center mb-14">
            <p className="text-eyebrow-red mb-3">PRICING</p>
            <h2 className="text-h2 text-white">Pilih Paketmu</h2>
            <p className="text-[#A0AAB5] mt-3">Mulai dari trial gratis, upgrade kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {packages.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`card-hover rounded-xl p-7 relative ${i === 1 ? "border !border-[#38BDF8]/40 glow-blue" : ""}`}
                style={{ backgroundColor: '#161B22' }}
                data-testid={`pkg-${p.id}`}
              >
                {i === 1 && <div className="absolute -top-3 left-6 badge badge-blue">MOST POPULAR</div>}
                <p className="text-xs font-medium uppercase tracking-widest text-[#38BDF8]">{p.duration_type}</p>
                <h3 className="text-h3 text-white mt-1">{p.name}</h3>
                <div className="mt-4 mb-5">
                  <div className="font-space font-bold text-4xl text-white">{formatRupiah(p.price)}</div>
                  <div className="text-xs text-[#A0AAB5] mt-1">
                    {p.is_trial ? `Trial ${p.duration_value || 7} hari` : `Per ${p.duration_value} ${p.duration_type === "yearly" ? "tahun" : "bulan"}`}
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {(p.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-[#FFFFFF]">
                      <Check size={16} className="text-[#38BDF8] mt-0.5 shrink-0" weight="bold" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/register?package=${p.id}`} className="btn-primary w-full" data-testid={`select-pkg-${p.id}`}>
                  Pilih Paket
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section id="news" className="section-padding" style={{ backgroundColor: '#161B22' }}>
        <div className="content-max-width">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-eyebrow mb-2"><Newspaper size={12} className="inline mr-1" /> LATEST</p>
              <h2 className="text-h2 text-white">News</h2>
            </div>
          </div>
          {news.length === 0 ? (
            <div className="rounded-xl p-8 text-center text-[#A0AAB5] border border-[#2A2F36]">Belum ada news.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-hover rounded-xl overflow-hidden" style={{ backgroundColor: '#0B0C10' }}>
                  {n.image_url && <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${n.image_url})` }} />}
                  <div className="p-5">
                    <p className="text-xs text-[#38BDF8] mb-1 font-medium tracking-widest uppercase">{new Date(n.created_at).toLocaleDateString("id-ID")}</p>
                    <h3 className="font-space font-semibold text-lg text-white mt-1">{n.title}</h3>
                    <p className="text-sm text-[#A0AAB5] line-clamp-3 mt-2">{n.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section id="events" className="section-padding">
        <div className="content-max-width">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-eyebrow-red mb-2"><CalendarDots size={12} className="inline mr-1" /> UPCOMING</p>
              <h2 className="text-h2 text-white">Events</h2>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="rounded-xl p-8 text-center text-[#A0AAB5] border border-[#2A2F36]">Belum ada event.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {events.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-hover rounded-xl p-5" style={{ backgroundColor: '#161B22' }}>
                  <span className="badge badge-blue mb-2">{e.event_date ? new Date(e.event_date).toLocaleDateString("id-ID") : "TBA"}</span>
                  <h3 className="font-space font-semibold text-lg text-white mt-2">{e.title}</h3>
                  <p className="text-sm text-[#A0AAB5] line-clamp-3 mt-2">{e.content}</p>
                  <Link to="/login" className="text-[#38BDF8] text-sm font-semibold mt-3 inline-flex items-center gap-1 hover:gap-2 transition-all">
                    Daftar <ArrowRight size={14} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-blue">
        <div className="content-max-width text-center">
          <h2 className="text-h2 text-white">Ready to Transform Your Team?</h2>
          <p className="mt-4 text-base max-w-lg mx-auto text-white/85">Join 10,000+ managers who are already training smarter.</p>
          <Link to="/register" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-sm tracking-wider uppercase mt-8 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#0B0C10', color: '#38BDF8' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#2A2F36] py-10">
        <div className="content-max-width flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={34} compact={true} />
          <div className="text-xs text-[#A0AAB5] text-center">© 2026 Indo Timezone Football Community · Tactical Edge</div>
          <div className="flex gap-4 text-xs text-[#A0AAB5]">
            <Link to="/login" className="hover:text-[#38BDF8]">Login</Link>
            <Link to="/register" className="hover:text-[#38BDF8]">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
