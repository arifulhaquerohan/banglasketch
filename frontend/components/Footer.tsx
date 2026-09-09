"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowUpRight, FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiYoutube } from "react-icons/fi";
import { CONTACT, SERVICES, SOCIAL } from "../lib/constants";
import { BrandLogo } from "./BrandLogo";

const STUDIO_LINKS = [
  { href: "/portfolio", label: "Our work" },
  { href: "/about", label: "The studio" },
  { href: "/blog", label: "Design journal" },
  { href: "/design-brief", label: "Create a design brief" },
  { href: "/cost-estimator", label: "Budget estimator" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-invitation">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#BEC6AD]">Let’s make room for something better</p>
            <h2 className="font-serif text-[clamp(2.3rem,4.5vw,3.7rem)] font-normal leading-[1.1] tracking-tight text-[#FAF7F2]">
              A space that feels <span className="italic text-[#BEC6AD]">like you.</span>
            </h2>
          </div>
          <Link href="/contact" className="footer-consultation-link">Start a conversation <FiArrowUpRight size={20} /></Link>
        </div>

        <div className="footer-main">
          <div>
            <BrandLogo light />
            <p className="mt-5 max-w-[270px] text-sm leading-7 text-[#B6BCAF]">Thoughtful interiors, made for everyday living. From the first sketch to the final detail.</p>
            <p className="mt-3 text-xs text-[#BEC6AD]">Based in Dhaka. Crafted for you.</p>
            <div className="mt-5 flex gap-2">
              {[
                { href: SOCIAL.facebook, icon: FiFacebook, label: "Facebook" },
                { href: SOCIAL.instagram, icon: FiInstagram, label: "Instagram" },
                { href: SOCIAL.youtube, icon: FiYoutube, label: "YouTube" },
              ].map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Bangla Sketch on ${label}`} className="footer-social-link"><Icon size={17} /></a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer studio links">
            <h3 className="footer-column-title">The studio</h3>
            <ul className="space-y-1">
              {STUDIO_LINKS.map(link => <li key={link.href}><Link href={link.href} className="footer-text-link">{link.label}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Footer service links">
            <h3 className="footer-column-title">Our expertise</h3>
            <ul className="space-y-1">
              {SERVICES.map(service => <li key={service.id}><Link href={`/services/${service.id}`} className="footer-text-link">{service.name}</Link></li>)}
              <li><Link href="/services" className="footer-text-link">All services <FiArrowUpRight size={14} /></Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="footer-column-title">Come say hello</h3>
            <address className="space-y-3 text-sm not-italic leading-6 text-[#B6BCAF]">
              <p className="flex items-start gap-3"><FiMapPin size={16} className="mt-1 shrink-0 text-[#BEC6AD]" /><span>{CONTACT.address}</span></p>
              <a href={`tel:${CONTACT.phone}`} className="footer-text-link"><FiPhone size={15} className="shrink-0 text-[#BEC6AD]" />{CONTACT.phone}</a>
              <a href={`mailto:${CONTACT.email}`} className="footer-text-link break-all"><FiMail size={15} className="shrink-0 text-[#BEC6AD]" />{CONTACT.email}</a>
            </address>
            <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-[#FAF7F2] underline decoration-[#65705C] underline-offset-8 transition-colors hover:text-[#BEC6AD]">Message us on WhatsApp <FiArrowUpRight size={16} /></a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Bangla Sketch. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="transition-colors hover:text-[#FAF7F2]">Privacy policy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#FAF7F2]">Terms of service</Link>
            <a href="#main-content" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#FAF7F2]">Back to top <FiArrowUpRight size={14} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
