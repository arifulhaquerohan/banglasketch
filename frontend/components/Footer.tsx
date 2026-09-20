"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiArrowUpRight,
  FiChevronDown,
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiYoutube,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT, SERVICES, SOCIAL } from "../lib/constants";
import { BrandLogo } from "./BrandLogo";

const STUDIO_LINKS = [
  { href: "/portfolio", label: "View projects" },
  { href: "/about", label: "The studio" },
  { href: "/blog", label: "Design journal" },
  { href: "/design-brief", label: "Create a design brief" },
  { href: "/cost-estimator", label: "Budget estimator" },
];

export function Footer() {
  const pathname = usePathname();
  const [studioOpen, setStudioOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Invitation Top Banner */}
        <div className="footer-invitation">
          <div className="max-w-2xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DCE2D5]">
              Let’s make room for something better
            </p>
            <h2 className="font-serif text-[clamp(2.1rem,4vw,3.4rem)] font-normal leading-[1.12] tracking-tight text-[#FAF7F2]">
              A space that feels <span className="italic text-[#D8DFD2]">like you.</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact" className="footer-consultation-link">
              <span>Start a conversation</span>
              <FiArrowUpRight size={18} />
            </Link>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
                "Hello Bangla Sketch, I'd like to consult with your design studio."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[50px] items-center gap-2 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 px-4 py-2.5 text-xs font-semibold text-[#85E3A0] transition-colors hover:bg-[#25D366]/25 hover:text-white"
            >
              <FaWhatsapp size={16} className="text-[#25D366]" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>

        {/* 4-Column Main Grid */}
        <div className="footer-main">
          {/* Col 1: Studio Identity & Mission */}
          <div className="flex flex-col justify-between">
            <div>
              <BrandLogo light />
              <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-[#DCE2D5]">
                Thoughtful interiors, made for everyday living. From the first sketch to the final detail.
              </p>
              <p className="mt-2.5 text-xs font-medium text-[#C2C9BA] tracking-wide">
                Dhaka, Bangladesh • Turnkey Studio
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2.5">
              {[
                { href: SOCIAL.facebook, icon: FiFacebook, label: "Facebook" },
                { href: SOCIAL.instagram, icon: FiInstagram, label: "Instagram" },
                { href: SOCIAL.youtube, icon: FiYoutube, label: "YouTube" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Bangla Sketch on ${label}`}
                  className="footer-social-link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: The Studio Links (With mobile accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setStudioOpen(!studioOpen)}
              className="footer-column-title sm:pointer-events-none flex w-full items-center justify-between py-2 sm:py-0 text-left cursor-pointer sm:cursor-default"
              aria-expanded={studioOpen}
            >
              <span>The Studio</span>
              <FiChevronDown
                size={16}
                className={`sm:hidden transition-transform duration-200 text-[#DCE2D5] ${
                  studioOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul className={`space-y-1.5 pt-2 sm:pt-0 ${studioOpen ? "block" : "hidden sm:block"}`}>
              {STUDIO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-text-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Our Expertise Links (With mobile accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setServicesOpen(!servicesOpen)}
              className="footer-column-title sm:pointer-events-none flex w-full items-center justify-between py-2 sm:py-0 text-left cursor-pointer sm:cursor-default"
              aria-expanded={servicesOpen}
            >
              <span>Our Expertise</span>
              <FiChevronDown
                size={16}
                className={`sm:hidden transition-transform duration-200 text-[#DCE2D5] ${
                  servicesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul className={`space-y-1.5 pt-2 sm:pt-0 ${servicesOpen ? "block" : "hidden sm:block"}`}>
              {SERVICES.map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.id}`} className="footer-text-link">
                    {service.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="footer-text-link font-semibold text-[#FAF7F2]">
                  <span>Explore all services</span>
                  <FiArrowUpRight size={13} className="text-[#C5A059]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Studio Contact & Location */}
          <div>
            <h3 className="footer-column-title">Come Say Hello</h3>
            <address className="space-y-2.5 text-sm not-italic leading-relaxed text-[#DCE2D5]">
              <p className="flex items-start gap-2.5">
                <FiMapPin size={16} className="mt-1 shrink-0 text-[#C2C9BA]" />
                <span className="text-[13px]">{CONTACT.address}</span>
              </p>
              <div>
                <a href={`tel:${CONTACT.phone}`} className="footer-text-link">
                  <FiPhone size={15} className="shrink-0 text-[#C2C9BA]" />
                  <span>{CONTACT.phone}</span>
                </a>
              </div>
              <div>
                <a href={`mailto:${CONTACT.email}`} className="footer-text-link break-all">
                  <FiMail size={15} className="shrink-0 text-[#C2C9BA]" />
                  <span>{CONTACT.email}</span>
                </a>
              </div>
            </address>
            <div className="mt-4 pt-3 border-t border-[#3D4539]">
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#FAF7F2] hover:text-[#85E3A0] transition-colors"
              >
                <FaWhatsapp className="text-[#25D366]" size={15} />
                <span>Direct Studio WhatsApp</span>
                <FiArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Bangla Sketch Architectural Studio. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="transition-colors hover:text-[#FAF7F2]">
              Privacy policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#FAF7F2]">
              Terms of service
            </Link>
            <a
              href="#main-content"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[#FAF7F2]"
            >
              <span>Back to top</span>
              <FiArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
