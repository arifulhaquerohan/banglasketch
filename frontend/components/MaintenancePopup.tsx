"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowUpRight, FiArrowRight, FiClock, FiMail, FiPhone, FiTool, FiX } from "react-icons/fi";
import { DEFAULT_MAINTENANCE_CONFIG, MaintenanceConfig } from "../lib/maintenance.types";

export function MaintenancePopup() {
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);

    // Check if dismissed in this session
    const isDismissed = typeof window !== "undefined" ? sessionStorage.getItem("bs_maintenance_dismissed") === "true" : false;
    setDismissed(isDismissed);

    // Fetch live maintenance config
    fetch("/api/maintenance", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setConfig(data.data);
          // Only check admin session if maintenance mode is enabled and an admin cookie might exist
          if (data.data.enabled && typeof document !== "undefined" && document.cookie.includes("bs_admin_session")) {
            fetch("/api/admin/session", { cache: "no-store", credentials: "same-origin" })
              .then((res) => setIsAdmin(res.ok))
              .catch(() => setIsAdmin(false));
          }
        }
      })
      .catch((err) => console.error("Error fetching maintenance status:", err));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bs_maintenance_dismissed", "true");
    }
  };

  useEffect(() => {
    const isDismissibleOverlay = mounted && config.enabled && !isAdmin && config.mode !== "banner" && !(dismissed && config.allowDismiss && config.mode !== "fullscreen");
    if (!isDismissibleOverlay) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirstControl = () => {
      const controls = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (controls?.length) controls[0].focus();
      else modalRef.current?.focus();
    };
    const timeout = window.setTimeout(focusFirstControl, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && config.allowDismiss && config.mode !== "fullscreen") {
        event.preventDefault();
        handleDismiss();
        return;
      }
      if (event.key !== "Tab") return;

      const controls = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [config.enabled, config.mode, config.allowDismiss, isAdmin, dismissed, mounted]);

  if (!mounted || !config.enabled) return null;

  // If user is admin, allow them to view the site normally, but show a floating indicator
  if (isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] bg-[#0a2540] border-2 border-[#c5a059] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs">
        <div className="w-8 h-8 rounded-full bg-[#c5a059]/20 flex items-center justify-center text-[#c5a059] shrink-0 animate-pulse">
          <FiTool size={16} />
        </div>
        <div>
          <div className="font-bold text-[#c5a059] flex items-center gap-1.5">
            <span>Maintenance Mode Active</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c5a059]/20 text-[#c5a059] uppercase">{config.mode}</span>
          </div>
          <div className="text-gray-300 text-[11px]">
            You have admin access. Visitors see maintenance message.
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="ml-2 bg-[#c5a059] hover:bg-[#d4b76a] text-[#0a2540] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Manage
        </Link>
      </div>
    );
  }

  // If visitor dismissed a dismissible popup/banner
  if (dismissed && config.allowDismiss && config.mode !== "fullscreen") {
    return null;
  }

  // MODE 1: BANNER
  if (config.mode === "banner") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#0a2540] via-[#8c5a35] to-[#0a2540] border-b-2 border-[#c5a059] text-white py-3 px-4 shadow-xl">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059] animate-ping shrink-0" />
            <div>
              <span className="font-bold text-[#f0e2c4]">{config.title}:</span>{" "}
              <span className="text-gray-200">{config.message}</span>
              {config.estimatedEndTime && (
                <span className="ml-2 inline-flex items-center gap-1 text-[#f0e2c4] bg-[#0a2540]/60 px-2 py-0.5 rounded-full text-xs">
                  <FiClock size={12} /> {config.estimatedEndTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {config.showContactButtons && (
              <a
                href={`https://wa.me/${config.contactWhatsApp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-3 py-1 rounded-full text-xs transition-colors shadow-md"
              >
                <FaWhatsapp size={14} /> WhatsApp Us
              </a>
            )}
            {config.allowDismiss && (
              <button
                onClick={handleDismiss}
                className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss banner"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MODE 2: FULLSCREEN OVERLAY
  if (config.mode === "fullscreen") {
    return (
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed inset-0 z-[99999] bg-gradient-to-br from-[#061a30] via-[#0a2540] to-[#1a1510] text-white flex items-center justify-center p-6 overflow-y-auto"
      >
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c5a059]/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] rounded-full bg-[#e07b2a]/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-xl w-full text-center space-y-8 my-auto py-12">
          {/* Logo with glowing ring */}
          <div className="relative inline-block mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#c5a059] to-[#e07b2a] blur-xl opacity-40 animate-pulse" />
            <div className="relative w-32 h-32 mx-auto rounded-full shadow-[0_0_40px_rgba(197,160,89,0.35)]">
              <Image
                src="/logo.svg"
                alt="Bangla Sketch Logo"
                width={128}
                height={128}
                className="w-full h-full"
                priority
              />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] text-xs font-semibold uppercase tracking-widest">
              <FiTool size={13} className="animate-spin" /> System Maintenance
            </div>
            <h1 id={titleId} className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {config.title}
            </h1>
            {config.titleBn && (
              <p className="text-xl md:text-2xl text-[#c5a059] font-medium font-serif">
                {config.titleBn}
              </p>
            )}
          </div>

          {/* Description Card */}
          <div id={descriptionId} className="bg-[#0a2540]/80 backdrop-blur-md border border-[#c5a059]/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <p className="text-gray-200 text-sm md:text-base leading-relaxed">
              {config.message}
            </p>
            {config.messageBn && (
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed border-t border-[#c5a059]/20 pt-3">
                {config.messageBn}
              </p>
            )}

            {config.estimatedEndTime && (
              <div className="inline-flex items-center gap-2 bg-[#061a30] text-[#c5a059] border border-[#c5a059]/30 px-4 py-2 rounded-xl text-xs font-semibold mt-2">
                <FiClock size={15} /> Expected Back: {config.estimatedEndTime}
              </div>
            )}
          </div>

          {/* Urgent inquiries / Contact */}
          {config.showContactButtons && (
            <div className="space-y-3 pt-2">
              <p className="text-xs uppercase tracking-widest text-[#c5a059]/80 font-semibold">
                Need Immediate Assistance or Design Inquiry?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`https://wa.me/${config.contactWhatsApp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-[#25D366]/30 hover:-translate-y-0.5"
                >
                  <FaWhatsapp size={18} /> Chat on WhatsApp
                </a>
                <a
                  href={`tel:${config.contactPhone}`}
                  className="inline-flex items-center gap-2 bg-[#0a2540] hover:bg-[#1a3a5c] text-[#c5a059] border border-[#c5a059]/40 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-md hover:-translate-y-0.5"
                >
                  <FiPhone size={16} /> {config.contactPhone}
                </a>
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="inline-flex items-center gap-2 bg-[#0a2540] hover:bg-[#1a3a5c] text-gray-300 border border-white/10 font-medium px-5 py-3 rounded-xl text-sm transition-all shadow-md hover:-translate-y-0.5"
                >
                  <FiMail size={16} /> Email Us
                </a>
              </div>
            </div>
          )}

          <div className="text-[11px] text-gray-400 pt-6">
            © {new Date().getFullYear()} Banglasketch (বাংলা স্কেচ) • All Rights Reserved
          </div>
        </div>
      </div>
    );
  }

  // The studio notice uses the same warm materials and quiet typography as the site.
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-emerald-darker/65 p-4 backdrop-blur-md sm:p-6"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-[28px] border border-[#e8e1d4]/70 bg-[#faf7f0] text-[#253b31] shadow-[0_32px_100px_-20px_rgba(0,0,0,0.55)] outline-none"
      >
        <div className="relative overflow-hidden bg-emerald px-7 pb-7 pt-8 sm:px-10 sm:pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-8 h-72 w-52 rounded-t-full border border-[#c3ae79]/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-1 h-64 w-40 rounded-t-full border border-[#c3ae79]/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-6 h-56 w-28 rounded-t-full border border-[#c3ae79]/20" />
          {config.allowDismiss && (
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[#eee9dc] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6bc81]"
              aria-label="Close maintenance notice"
            >
              <FiX size={18} />
            </button>
          )}
          <div className="relative flex items-center gap-3.5 pr-10">
            <Image src="/logo.svg" alt="Bangla Sketch" width={56} height={56} className="h-14 w-14 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory-light">Bangla Sketch</p>
              <p className="mt-1.5 text-xs text-gold">Thoughtful spaces. Beautiful living.</p>
            </div>
          </div>
          <div className="relative mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> A little studio update
          </div>
        </div>

        <div className="px-7 pb-6 pt-7 sm:px-10 sm:pb-7 sm:pt-8">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#82704a]">Website notice <span aria-hidden="true" className="mx-1">/</span> <span lang="bn">নোটিশ</span></p>
          <h2 id={titleId} className="font-serif text-[34px] font-normal leading-[1.12] tracking-tight text-[#253b31] sm:text-[42px]">
            {config.title}
          </h2>
          {config.titleBn && (
            <p lang="bn" className="mt-3 font-serif text-base leading-relaxed text-[#62705c]">{config.titleBn}</p>
          )}

          <div id={descriptionId} className="mt-6 border-l-2 border-[#c3ad79] pl-4">
            <p className="text-sm leading-7 text-[#4c584e]">{config.message}</p>
            {config.messageBn && (
              <p lang="bn" className="mt-2 text-[13px] leading-6 text-[#687164]">{config.messageBn}</p>
            )}
          </div>
          {config.estimatedEndTime && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#eceee5] px-3.5 py-3 text-xs leading-5 text-[#47593f]">
              <FiClock size={15} className="mt-0.5 shrink-0" />
              <span>Expected back: {config.estimatedEndTime}</span>
            </div>
          )}

          {config.showContactButtons && (
            <div className="mt-7">
              <p className="mb-3 text-xs text-[#677061]">Have a space in mind? Let’s talk.</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.2fr_1fr]">
                <a
                  href={`https://wa.me/${config.contactWhatsApp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#2e4b39] px-4 py-3 text-sm font-semibold text-[#fffdf5] transition-colors hover:bg-[#20392b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2e4b39]"
                >
                  <FaWhatsapp size={19} /> WhatsApp us <FiArrowUpRight size={16} className="ml-auto opacity-70" />
                </a>
                <a
                  href={`tel:${config.contactPhone}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#d8d2c3] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#354a3b] transition-colors hover:bg-[#eeeadf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2e4b39]"
                >
                  <FiPhone size={16} /> Call the studio
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[#e4ded1] pt-4 text-center">
            {config.allowDismiss ? (
              <button
                onClick={handleDismiss}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-[#5a6655] transition-colors hover:text-[#253b31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e4b39]"
              >
                Continue exploring <FiArrowRight size={14} />
              </button>
            ) : (
              <p className="py-2 text-xs text-[#737a6c]">Thank you for your patience.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
