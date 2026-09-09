"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiArrowUpRight, FiBookmark, FiChevronDown, FiMenu, FiPhone, FiX } from "react-icons/fi";
import { CONTACT, SERVICES } from "../lib/constants";
import { BrandLogo } from "./BrandLogo";
import { useSpaceCollection } from "./SpaceCollectionContext";

const NAV_ITEMS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "Studio" },
  { href: "/blog", label: "Journal" },
];
const PLANNING_LINKS = [
  { href: "/design-brief", label: "Create a design brief", description: "Tell us what home means to you." },
  { href: "/cost-estimator", label: "Estimate your budget", description: "Find a starting point for your project." },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const servicesButtonRef = useRef<HTMLButtonElement>(null);
  const { totalCount, openDrawer } = useSpaceCollection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setServicesOpen(false); }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { setOpen(false); setServicesOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open && !servicesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) { setOpen(false); setServicesOpen(false); }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setServicesOpen(false);
        (open ? menuButtonRef : servicesButtonRef).current?.focus();
      }
      if (event.key === "Tab" && open) {
        const focusable = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [])
          .filter(element => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, servicesOpen]);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeNavigation = () => { setOpen(false); setServicesOpen(false); };

  return (
    <header ref={headerRef} className={`site-header ${scrolled || open ? "site-header-raised" : ""}`}>
      <div className="site-header-inner">
        <BrandLogo />
        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-8">
            {NAV_ITEMS.map(item => (
              <li key={item.href} className="relative" onBlur={item.href === "/services" ? event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setServicesOpen(false);
              } : undefined}>
                {item.href === "/services" ? (
                  <>
                    <button ref={servicesButtonRef} type="button" className={`site-nav-link ${isActive(item.href) ? "is-active" : ""}`}
                      aria-expanded={servicesOpen} aria-controls="services-navigation" onClick={() => setServicesOpen(!servicesOpen)}>
                      Services <FiChevronDown size={14} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                    </button>
                    {servicesOpen && (
                      <div id="services-navigation" className="site-services-panel">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-dark">Spaces we design</p>
                        <div className="grid grid-cols-2 gap-1">
                          {SERVICES.map(service => (
                            <Link key={service.id} href={`/services/${service.id}`} onClick={closeNavigation} className="rounded-lg px-3 py-3 text-sm text-charcoal transition-colors hover:bg-ivory">{service.name}</Link>
                          ))}
                        </div>
                        <Link href="/services" onClick={closeNavigation} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-olive-dark">Explore all services <FiArrowRight size={15} /></Link>
                        <div className="mt-3 space-y-1 border-t border-limestone pt-3">
                          {PLANNING_LINKS.map(link => (
                            <Link key={link.href} href={link.href} onClick={closeNavigation} className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-ivory">
                              <span><span className="block text-sm font-semibold text-charcoal">{link.label}</span><span className="mt-1 block text-xs text-charcoal-muted">{link.description}</span></span>
                              <FiArrowUpRight className="shrink-0 text-olive" size={17} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`site-nav-link ${isActive(item.href) ? "is-active" : ""}`}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => { closeNavigation(); openDrawer(); }} className="site-collection-button" aria-label={`Open saved collection, ${totalCount} ${totalCount === 1 ? "item" : "items"}`}>
            <FiBookmark size={17} /><span className="hidden xl:inline">Saved spaces</span>
            {totalCount > 0 && <span className="site-collection-count">{totalCount}</span>}
          </button>
          <Link href="/contact" onClick={closeNavigation} className="site-consultation-button hidden sm:inline-flex">Let’s talk <FiArrowUpRight size={17} /></Link>
          <button ref={menuButtonRef} type="button" onClick={() => setOpen(!open)} className="site-menu-button lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation">
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="site-mobile-navigation lg:hidden">
          <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-dark"><span>Explore the studio</span><span>Dhaka, Bangladesh</span></div>
          <ul className="divide-y divide-limestone/70">
            {[{ href: "/", label: "Home" }, ...NAV_ITEMS].map(item => (
              <li key={item.href}><Link href={item.href} onClick={closeNavigation} aria-current={isActive(item.href) ? "page" : undefined} className={`flex items-center justify-between py-4 font-serif text-[27px] ${isActive(item.href) ? "text-clay" : "text-charcoal"}`}>
                {item.label}<FiArrowUpRight size={19} className="text-olive" />
              </Link></li>
            ))}
          </ul>
          <div className="my-5 grid grid-cols-2 gap-3">
            {PLANNING_LINKS.map(link => <Link key={link.href} href={link.href} onClick={closeNavigation} className="flex min-h-16 items-center justify-between gap-2 rounded-lg border border-limestone bg-ivory-light p-3 text-sm text-charcoal">{link.label}<FiArrowUpRight size={18} className="shrink-0 text-olive" /></Link>)}
          </div>
          <Link href="/contact" onClick={closeNavigation} className="site-consultation-button flex w-full">Book a consultation <FiArrowUpRight size={18} /></Link>
          <a href={`tel:${CONTACT.phone}`} className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm text-charcoal-muted"><FiPhone size={14} />{CONTACT.phone}</a>
        </nav>
      )}
    </header>
  );
}
