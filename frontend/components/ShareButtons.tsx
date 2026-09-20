"use client";

import { FiFacebook } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

interface ShareButtonsProps {
  title: string;
}

export function ShareButtons({ title }: ShareButtonsProps) {
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FCFAF7] text-xs font-semibold text-[#383E38] hover:text-[#586348] hover:border-[#586348] border border-[#DED5C7] shadow-2xs transition-all duration-300"
      >
        <FiFacebook size={15} className="text-[#586348]" /> Facebook
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FCFAF7] text-xs font-semibold text-[#383E38] hover:text-[#25D366] hover:border-[#25D366] border border-[#DED5C7] shadow-2xs transition-all duration-300"
      >
        <FaWhatsapp size={15} className="text-[#25D366]" /> WhatsApp
      </a>
    </div>
  );
}
