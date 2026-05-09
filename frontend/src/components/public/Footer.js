import React from "react";
import { Link } from "react-router-dom";
import { DiscordLogo, YoutubeLogo, InstagramLogo } from "@phosphor-icons/react";
import Logo from "@/components/Logo";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Tools", path: "/tools" },
];

const communityLinks = [
  { label: "Community Hub", path: "/community" },
  { label: "Contact", path: "/contact" },
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
];

const legalLinks = [
  { label: "Terms of Service", path: "#" },
  { label: "Privacy Policy", path: "#" },
  { label: "Cookie Policy", path: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#2A2F36] bg-[#0B0C10]" data-testid="public-footer">
      <div className="content-max-width pt-16 sm:pt-20 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <Logo size={40} compact={false} />
            </Link>
            <p className="mt-5 text-sm text-[#A0AAB5] max-w-xs leading-relaxed">
              Indonesian Top Eleven Community. <span className="italic">Unity in Time — We Suffer, We Grow, We Achieve.</span>
            </p>
          </div>

          <div>
            <h4 className="font-inter font-semibold text-sm text-white mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-sm text-[#A0AAB5] hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-inter font-semibold text-sm text-white mb-4 uppercase tracking-wider">Community</h4>
            <ul className="space-y-3">
              {communityLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="text-sm text-[#A0AAB5] hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-inter font-semibold text-sm text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.path} className="text-sm text-[#A0AAB5] hover:text-white transition-colors duration-200">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#2A2F36] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5C6670]">© 2026 Indo Timezone Football Community · Tactical Edge.</p>
          <div className="flex items-center gap-5">
            <a href="#" aria-label="Discord" className="text-[#5C6670] hover:text-[#00A8FF] transition-colors">
              <DiscordLogo size={20} weight="fill" />
            </a>
            <a href="#" aria-label="YouTube" className="text-[#5C6670] hover:text-[#00A8FF] transition-colors">
              <YoutubeLogo size={20} weight="fill" />
            </a>
            <a href="#" aria-label="Instagram" className="text-[#5C6670] hover:text-[#00A8FF] transition-colors">
              <InstagramLogo size={20} weight="fill" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
