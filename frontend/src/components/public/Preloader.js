import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Preloader({ onComplete }) {
  const containerRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });
    tl.to(barRef.current, {
      width: "100%",
      duration: 1.6,
      ease: "power2.inOut",
    });
    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0C10]"
      data-testid="preloader"
    >
      <div className="font-space text-5xl md:text-6xl font-bold tracking-tight mb-8">
        <span className="text-[#00A8FF]">I</span>
        <span className="text-white">TZ</span>
      </div>
      <div className="w-[200px] h-[2px] rounded-full overflow-hidden bg-[#2A2F36]">
        <div ref={barRef} className="h-full rounded-full bg-[#00A8FF]" style={{ width: "0%" }} />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#5C6670]">Tactical Edge Loading...</p>
    </div>
  );
}
