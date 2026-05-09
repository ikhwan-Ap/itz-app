import React, { useState } from "react";
import HeroSection from "@/components/public/HeroSection";
import ScrollReveal from "@/components/public/ScrollReveal";
import { ChatCircleDots, EnvelopeSimple, Clock, CheckCircle } from "@phosphor-icons/react";

export default function Contact() {
  const [data, setData] = useState({ name: "", email: "", subject: "General Question", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!data.name.trim()) errs.name = "Nama wajib diisi";
    if (!data.email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Format email tidak valid";
    if (!data.message.trim()) errs.message = "Pesan wajib diisi";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitted(true);
  }

  return (
    <div data-testid="page-contact">
      <HeroSection
        eyebrow="CONTACT"
        headlineLine1="Let's Talk"
        headlineLine2="Tactics"
        subheadline="Pertanyaan, feedback, partnership ideas, atau sekedar say hello? We're all ears."
        gradient="radial-gradient(ellipse at 50% 0%, rgba(0, 168, 255, 0.08) 0%, transparent 60%)"
      />

      <section className="section-padding bg-[#0B0C10]">
        <div className="content-max-width">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16">
            <ScrollReveal>
              {submitted ? (
                <div className="rounded-xl border border-[#2A2F36] bg-[#161B22] p-10 sm:p-12 text-center" data-testid="contact-success">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#00A8FF]/15">
                    <CheckCircle size={36} className="text-[#00A8FF]" weight="fill" />
                  </div>
                  <h3 className="font-space text-xl text-white font-semibold">Pesan Terkirim!</h3>
                  <p className="mt-3 text-sm text-[#A0AAB5]">
                    Terima kasih sudah menghubungi kami. Kami akan respond dalam 24 jam.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
                  <div>
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      value={data.name}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-md text-white text-base outline-none transition-all border bg-[#161B22] focus:border-[#00A8FF]"
                      style={{ borderColor: errors.name ? "#E50914" : "#2A2F36" }}
                      data-testid="contact-name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-[#E50914]">{errors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Anda"
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-md text-white text-base outline-none transition-all border bg-[#161B22] focus:border-[#00A8FF]"
                      style={{ borderColor: errors.email ? "#E50914" : "#2A2F36" }}
                      data-testid="contact-email"
                    />
                    {errors.email && <p className="mt-1 text-xs text-[#E50914]">{errors.email}</p>}
                  </div>
                  <div>
                    <select
                      value={data.subject}
                      onChange={(e) => setData({ ...data, subject: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-md text-white text-base outline-none transition-all border bg-[#161B22] focus:border-[#00A8FF] appearance-none"
                      style={{ borderColor: "#2A2F36" }}
                      data-testid="contact-subject"
                    >
                      <option>General Question</option>
                      <option>Tool Support</option>
                      <option>Partnership</option>
                      <option>Bug Report</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      placeholder="Pesan Anda"
                      value={data.message}
                      onChange={(e) => setData({ ...data, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3.5 rounded-md text-white text-base outline-none transition-all border resize-y bg-[#161B22] focus:border-[#00A8FF]"
                      style={{ borderColor: errors.message ? "#E50914" : "#2A2F36" }}
                      data-testid="contact-message"
                    />
                    {errors.message && <p className="mt-1 text-xs text-[#E50914]">{errors.message}</p>}
                  </div>
                  <button type="submit" className="w-full btn-primary" data-testid="contact-submit">Send Message</button>
                </form>
              )}
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <h3 className="font-space text-xl text-white font-semibold">Other Ways to Reach Us</h3>
              <div className="mt-7 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#00A8FF]/10">
                    <ChatCircleDots size={22} className="text-[#00A8FF]" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Discord</p>
                    <p className="text-sm text-[#A0AAB5]">discord.gg/itz-community</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#00A8FF]/10">
                    <EnvelopeSimple size={22} className="text-[#00A8FF]" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-sm text-[#A0AAB5]">hello@itz-community.id</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#00A8FF]/10">
                    <Clock size={22} className="text-[#00A8FF]" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Response Time</p>
                    <p className="text-sm text-[#A0AAB5]">Biasanya dalam 24 jam</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 p-6 rounded-xl border border-[#2A2F36] bg-[#161B22]">
                <p className="text-sm leading-relaxed text-[#5C6670]">
                  Untuk urgent matter, ping kami di Discord — mod team hampir selalu online.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
