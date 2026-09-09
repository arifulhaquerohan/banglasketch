"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiPhone, FiCalendar, FiCompass } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT } from "../lib/constants";

export function MobileStickyBar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile quick actions"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#20251F]/95 backdrop-blur-xl border-t border-[#BEC6AD]/30 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 gap-1.5 max-w-md mx-auto">
        <a
          href={`tel:${CONTACT.phone}`}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
        >
          <FiPhone className="text-[#BEC6AD] mb-1" size={18} />
          <span className="text-[10px] font-semibold">Call Now</span>
        </a>

        <a
          href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
            "Hello Banglasketch, I would like to consult about an interior project."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
        >
          <FaWhatsapp className="text-[#25D366] mb-1" size={18} />
          <span className="text-[10px] font-semibold">WhatsApp</span>
        </a>

        <Link
          href="/cost-estimator"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
        >
          <FiCompass className="text-[#BEC6AD] mb-1" size={18} />
          <span className="text-[10px] font-semibold">Estimator</span>
        </Link>

        <Link
          href="/contact"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#A45138] text-[#FAF7F2] font-bold shadow-md active:scale-95 transition-all text-center"
        >
          <FiCalendar className="text-[#FAF7F2] mb-1" size={18} />
          <span className="text-[10px] font-bold">Book Visit</span>
        </Link>
      </div>
    </nav>
  );
}
