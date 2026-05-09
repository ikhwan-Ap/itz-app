import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

export default function HeroSection({
  eyebrow,
  eyebrowColor = "blue",
  headlineLine1,
  headlineLine2,
  highlight = null,
  subheadline,
  ctaText,
  ctaLink = "/register",
  secondaryText,
  secondaryLink = "/login",
  gradient = "radial-gradient(ellipse at 50% 0%, rgba(0, 168, 255, 0.10) 0%, transparent 60%)",
}) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const els = {
      eyebrow: section.querySelector(".hero-eyebrow"),
      h1: section.querySelector(".hero-headline-1"),
      h2: section.querySelector(".hero-headline-2"),
      sub: section.querySelector(".hero-sub"),
      cta: section.querySelector(".hero-cta"),
    };
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(els.eyebrow, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15);
    tl.fromTo(els.h1, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.25);
    tl.fromTo(els.h2, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.35);
    tl.fromTo(els.sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.45);
    if (els.cta) tl.fromTo(els.cta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.6);
    return () => { tl.kill(); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-[80vh] md:min-h-[90vh] flex items-center justify-center relative pt-24"
      style={{ background: `#0B0C10`, backgroundImage: gradient }}
    >
      <div className="content-max-width text-center">
        <p className={`hero-eyebrow ${eyebrowColor === "red" ? "text-eyebrow-red" : "text-eyebrow"} mb-5 opacity-0`}>
          {eyebrow}
        </p>
        <h1 className="text-display text-white">
          <span className="hero-headline-1 block opacity-0">{headlineLine1}</span>
          <span className="hero-headline-2 block opacity-0 mt-2">
            {highlight ? (
              <>
                <span className="text-glow-blue text-[#00A8FF]">{highlight}</span> {headlineLine2}
              </>
            ) : (
              headlineLine2
            )}
          </span>
        </h1>
        <p className="hero-sub mt-7 text-base sm:text-lg max-w-xl mx-auto text-[#A0AAB5] opacity-0">
          {subheadline}
        </p>
        {(ctaText || secondaryText) && (
          <div className="hero-cta mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
            {ctaText && (
              <Link to={ctaLink} className="btn-primary" data-testid="hero-cta">
                {ctaText}
              </Link>
            )}
            {secondaryText && (
              <Link to={secondaryLink} className="btn-secondary" data-testid="hero-secondary-cta">
                {secondaryText}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
