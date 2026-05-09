import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/public/Navigation";
import Footer from "@/components/public/Footer";
import Preloader from "@/components/public/Preloader";

export default function PublicLayout({ children }) {
  const { pathname } = useLocation();
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("itz_preloaded") === "1";
  });

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const onPreloadComplete = () => {
    sessionStorage.setItem("itz_preloaded", "1");
    setLoaded(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0C10]">
      {!loaded && pathname === "/" && <Preloader onComplete={onPreloadComplete} />}
      <Navigation />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
