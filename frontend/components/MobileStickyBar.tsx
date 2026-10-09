"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiCalendar } from "react-icons/fi";
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#20251F]/95 backdrop-blur-xl border-t border-[#BEC6AD]/30 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <a
          href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
            "Hello Banglasketch, I would like to consult about an interior project."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 min-h-12 py-2 px-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
        >
          <FaWhatsapp className="text-[#25D366] " size={18} />
          <span className="text-xs font-semibold">WhatsApp</span>
        </a>

        <Link
          href="/contact"
          className="flex items-center justify-center gap-2 min-h-12 py-2 px-3 rounded-xl bg-[#A45138] text-[#FAF7F2] font-bold shadow-md active:scale-95 transition-all text-center"
        >
          <FiCalendar className="text-[#FAF7F2] " size={18} />
          <span className="text-xs font-bold">Book consultation</span>
        </Link>
      </div>
    </nav>
  );
}
