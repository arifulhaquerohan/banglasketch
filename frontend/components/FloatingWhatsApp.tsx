"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { FiX, FiSend } from "react-icons/fi";
import { CONTACT } from "../lib/constants";

const QUICK_PROMPTS = [
  "I'd like an interior design consultation.",
  "I have a new apartment in Dhaka.",
  "How much does a full home renovation cost?",
  "Can I see recent kitchen/bedroom projects?",
];

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSend = (text: string) => {
    const message = text.trim() || "Hello Banglasketch, I would like to consult about an interior design project.";
    const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
    setCustomMsg("");
  };

  return (
    <aside aria-label="WhatsApp quick chat" className="hidden md:block fixed bottom-6 right-6 z-40">
      {/* Chat Popup Box */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-80 max-w-[340px] bg-[#20251F] border-2 border-[#BEC6AD]/40 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2C3428] to-[#384132] p-4 border-b border-[#BEC6AD]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xl shadow-md">
                  <FaWhatsapp />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#2C3428] rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">Banglasketch</div>
                <div className="text-[11px] text-emerald-400 font-medium">Let’s talk about your space</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close WhatsApp chat"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-[#20251F]">
            <div className="bg-[#2C3428] p-3 rounded-2xl rounded-tl-none border border-[#BEC6AD]/15 text-xs text-gray-200 leading-relaxed shadow-sm">
              👋 Salam! Welcome to Bangla Sketch. How can we help transform your home or commercial space today?
            </div>

            {/* Quick action buttons */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-[#BEC6AD] uppercase tracking-wider">Quick Inquiries</div>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left text-xs bg-[#2C3428]/80 hover:bg-[#BEC6AD]/15 hover:border-[#BEC6AD] border border-[#BEC6AD]/20 p-2.5 rounded-xl text-gray-200 hover:text-white transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(customMsg);
              }}
              className="pt-2 flex gap-2"
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="flex-1 bg-[#2C3428] border border-[#BEC6AD]/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#BEC6AD]"
              />
              <button
                type="submit"
                className="bg-[#25D366] hover:bg-[#1fb855] text-white p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-md"
                aria-label="Send WhatsApp message"
              >
                <FiSend size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#BEC6AD]/40 bg-[#20251F] text-[#FAF7F2] shadow-lg transition-colors hover:bg-[#384132]"
        aria-label="Chat on WhatsApp"
        aria-expanded={isOpen}
        title="Chat on WhatsApp"
      >
        <span className="text-2xl leading-none">
          <FaWhatsapp />
        </span>

      </button>
    </aside>
  );
}
