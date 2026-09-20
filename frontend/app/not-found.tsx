import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiHome, FiMail } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Page Not Found | Banglasketch",
  robots: { index: false, follow: false },
};

const POPULAR_LINKS = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24 bg-[#F5F2EB]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#586348]/10 blur-[120px]" />
      <div className="relative w-full max-w-xl text-center">
        <div className="rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] p-7 shadow-xl sm:p-10">
          <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#586348] bg-[#EDF1EA] text-3xl font-serif font-bold text-[#586348] shadow-sm">
            <span className="absolute inset-1 rounded-full border border-[#586348]/25" />
            <span className="relative">404</span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#586348]">A Small Detour</p>
          <h1 className="mb-3 text-3xl font-serif font-bold text-[#242824] sm:text-4xl">This Page Is Not Here</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#5A625A] sm:text-base">
            The link may be outdated, the page may have moved, or the address may have a typo. Let&apos;s get you back to beautiful spaces.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-primary py-3 text-sm shadow-xs">
              <FiHome aria-hidden="true" size={16} /> Back to Home
            </Link>
            <Link href="/contact" className="btn btn-secondary py-3 text-sm">
              <FiMail aria-hidden="true" size={16} /> Contact Us
            </Link>
          </div>

          <div className="mt-8 border-t border-[#DED5C7] pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#737D73]">Explore Bangla Sketch</p>
            <nav aria-label="Popular pages" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {POPULAR_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="group inline-flex items-center gap-1 text-sm text-[#383E38] transition-colors hover:text-[#586348] font-medium">
                  {link.label} <FiArrowRight aria-hidden="true" size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
