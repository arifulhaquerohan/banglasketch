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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3a5c] text-sm text-gray-300 hover:text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#c5a059]/20 transition-all duration-300"
      >
        <FiFacebook size={15} /> Facebook
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3a5c] text-sm text-gray-300 hover:text-[#25D366] hover:bg-[#25D366]/10 border border-[#c5a059]/20 transition-all duration-300"
      >
        <FaWhatsapp size={15} /> WhatsApp
      </a>
    </div>
  );
}
