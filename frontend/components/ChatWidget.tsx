"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CONTACT } from "@/lib/constants";
import { FaWhatsapp } from "react-icons/fa";
import {
  FiX,
  FiMinus,
  FiSend,
  FiRefreshCw,
  FiArrowUpRight,
  FiPhone,
  FiHome,
  FiGrid,
  FiDollarSign,
  FiArrowRight,
  FiCopy,
  FiCheck,
  FiVolume2,
  FiVolumeX,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiCompass,
  FiLayout,
  FiBriefcase,
  FiHelpCircle,
  FiCornerDownLeft,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// --- Types ---
type RecommendedProject = {
  title: string;
  url: string;
  category: string;
  description: string;
  image: string;
};

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  projects?: RecommendedProject[];
};

type SiteVisitSlot = {
  value: string;
  label: string;
  available: boolean;
  unavailable_reason?: "past" | "reserved" | null;
};

type SiteVisitDay = {
  date: string;
  label: string;
  slots: SiteVisitSlot[];
};

type SiteVisitForm = {
  name: string;
  phone: string;
  email: string;
  location: string;
  space_size: string;
  project_note: string;
  visit_date: string;
  time_slot: string;
};

type VoiceStyle = "woman" | "man";

const STORAGE_KEY = "banglasketch-chat-v2";
const SOUND_KEY = "banglasketch-chat-sound";
const VOICE_STYLE_KEY = "banglasketch-chat-voice";

const emptySiteVisitForm: SiteVisitForm = {
  name: "",
  phone: "",
  email: "",
  location: "",
  space_size: "",
  project_note: "",
  visit_date: "",
  time_slot: "",
};

function isSiteVisitPrompt(prompt: string) {
  return /site visit|consultation|book consultation|সাইট ভিজিট|ভিজিটের জন্য বুকিং/i.test(prompt);
}

function isEstimatorPrompt(prompt: string) {
  return /estimate budget|cost estimate|খরচ হিসাব|বাজেট হিসাব/i.test(prompt);
}

function readProjects(value: unknown): RecommendedProject[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (p): p is RecommendedProject =>
        p &&
        typeof p.title === "string" &&
        typeof p.url === "string" &&
        /^\/portfolio\/[a-zA-Z0-9%_-]+$/.test(p.url) &&
        typeof p.category === "string" &&
        typeof p.description === "string" &&
        typeof p.image === "string"
    )
    .slice(0, 3)
    .map((p) => ({
      ...p,
      image:
        /^(https:\/\/|\/(?!\/))/.test(p.image) && !p.image.includes("\\")
          ? p.image
          : "",
    }));
}

function selectGentleVoice(
  voices: SpeechSynthesisVoice[],
  language: "en" | "bn",
  style: VoiceStyle
) {
  const targetLanguage = language === "bn" ? "bn" : "en";
  const preferredNames = style === "woman"
    ? ["jenny", "aria", "samantha", "ava", "zira", "susan", "karen", "moira", "tessa", "victoria", "female"]
    : ["guy", "david", "daniel", "alex", "aaron", "arthur", "george", "ryan", "male"];
  const naturalVoiceHints = ["natural", "neural", "premium", "enhanced", "online"];

  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith(targetLanguage))
    .map((voice) => {
      const name = voice.name.toLowerCase();
      const stylePreference = preferredNames.findIndex((candidate) => name.includes(candidate));
      const score =
        (stylePreference >= 0 ? 100 - stylePreference : 0) +
        (naturalVoiceHints.some((hint) => name.includes(hint)) ? 20 : 0) +
        (voice.localService ? 8 : 0) +
        (voice.default ? 2 : 0);
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.voice;
}

// --- Sound Synthesizer (Zero asset dependency) ---
function playChime(type: "send" | "receive" | "pop") {
  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === "send") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.16);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "receive") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.028, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

// --- Inline Rich Text Parser ---
function isSafeChatHref(href: string) {
  return (
    /^https?:\/\//i.test(href) ||
    /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(href) ||
    /^tel:\+?[0-9().\-\s]+$/i.test(href) ||
    /^\/(?!\/)[a-zA-Z0-9/_%.-]*$/.test(href)
  );
}

function renderLinkedText(text: string, tone: "assistant" | "user") {
  const routePattern =
    /(\/(?:about|blog|contact|cost-estimator|design-brief|portfolio|privacy|services|terms)(?:\/[a-zA-Z0-9%_-]+)?)/g;
  const routeOnlyPattern =
    /^\/(?:about|blog|contact|cost-estimator|design-brief|portfolio|privacy|services|terms)(?:\/[a-zA-Z0-9%_-]+)?$/;
  const parts = text.split(routePattern);
  return parts.map((part, index) => {
    if (routeOnlyPattern.test(part)) {
      return (
        <Link
          key={index}
          href={part}
          className={`font-medium underline underline-offset-2 ${
            tone === "user"
              ? "text-white decoration-white/50 hover:decoration-white"
              : "text-[#575E4A] decoration-[#727A61]/40 hover:decoration-[#575E4A]"
          }`}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

function renderInlineFormatting(text: string, tone: "assistant" | "user" = "assistant") {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className={`font-semibold ${tone === "user" ? "text-white" : "text-[#242622]"}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className={`italic ${tone === "user" ? "text-white/90" : "text-[#5A6057]"}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className={`rounded px-1.5 py-0.5 text-xs font-mono ${
            tone === "user" ? "bg-white/20 text-white" : "bg-[#EAE3D5] text-[#242622]"
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = /^https?:\/\//i.test(href);
      return isExternal && isSafeChatHref(href) ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#727A61] underline decoration-[#727A61]/40 underline-offset-2 hover:text-[#575E4A]"
        >
          {label}
        </a>
      ) : isSafeChatHref(href) ? (
        <Link
          key={i}
          href={href}
          className={`font-medium underline underline-offset-2 ${
            tone === "user"
              ? "text-white decoration-white/50 hover:decoration-white"
              : "text-[#575E4A] decoration-[#727A61]/40 hover:decoration-[#575E4A]"
          }`}
        >
          {label}
        </Link>
      ) : (
        label
      );
    }
    return renderLinkedText(part, tone);
  });
}

// --- Full Structured Message Component ---
function RichMessageContent({ content, tone = "assistant" }: { content: string; tone?: "assistant" | "user" }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className={`flex items-start gap-2 text-sm leading-relaxed ${tone === "user" ? "text-white" : "text-[#242622]"}`}>
              <span className={`mt-1 text-[10px] select-none ${tone === "user" ? "text-white/80" : "text-[#727A61]"}`}>✦</span>
              <span className="flex-1">{renderInlineFormatting(item, tone)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className={`flex items-start gap-2.5 text-sm leading-relaxed ${tone === "user" ? "text-white" : "text-[#242622]"}`}>
              <span className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold select-none ${tone === "user" ? "bg-white/15 text-white" : "bg-[#EAE3D5] text-[#575E4A]"}`}>
                {idx + 1}
              </span>
              <span className="flex-1">{renderInlineFormatting(item, tone)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (currentList && currentList.type !== "ul") flushList();
      if (!currentList) currentList = { type: "ul", items: [] };
      currentList.items.push(ulMatch[1]);
      return;
    }

    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      if (currentList && currentList.type !== "ol") flushList();
      if (!currentList) currentList = { type: "ol", items: [] };
      currentList.items.push(olMatch[1]);
      return;
    }

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      elements.push(
        <h4
          key={`h-${lineIdx}`}
          className={`mt-3 mb-1.5 font-serif text-base font-semibold ${tone === "user" ? "text-white" : "text-[#242622]"}`}
        >
          {renderInlineFormatting(headingMatch[1], tone)}
        </h4>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${lineIdx}`} className={`text-sm leading-relaxed my-1 ${tone === "user" ? "text-white" : "text-[#242622]"}`}>
        {renderInlineFormatting(trimmed, tone)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

// --- Recommended Projects Component ---
function RecommendedProjects({
  projects,
  onNavigate,
  onInquire,
}: {
  projects: RecommendedProject[];
  onNavigate: () => void;
  onInquire: (project: RecommendedProject) => void;
}) {
  return (
    <div className="mt-3.5 space-y-2.5" aria-label="Suggested portfolio projects">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727A61]">
          Matching Projects · নির্বাচিত কাজ
        </p>
        <Link
          href="/portfolio"
          onClick={onNavigate}
          className="text-xs font-semibold text-[#242622] hover:text-[#727A61] transition-colors"
        >
          View projects ↗
        </Link>
      </div>
      <div className="grid gap-2">
        {projects.map((project) => (
          <div
            key={project.url}
            className="group relative flex gap-3 overflow-hidden rounded-xl border border-[#DDD5C8] bg-[#FAF7F2] p-2.5 shadow-2xs transition-all duration-200 hover:border-[#727A61]"
          >
            {project.image ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#EAE3D5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover transition-transform duration-220 group-hover:scale-105"
                />
                <span className="absolute bottom-1 left-1 rounded bg-[#242622]/85 px-1.5 py-0.5 text-[9px] font-medium text-[#FAF7F2] backdrop-blur-2xs">
                  {project.category.replaceAll("-", " ")}
                </span>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#EAE3D5] text-[#727A61]">
                <FiHome size={22} />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
              <div>
                <Link
                  href={project.url}
                  onClick={onNavigate}
                  className="block font-serif font-semibold text-[#242622] line-clamp-1 hover:text-[#575E4A] focus-visible:outline-none"
                >
                  {project.title}
                </Link>
                <p className="mt-0.5 text-xs text-[#5A6057] line-clamp-2 leading-relaxed">
                  {project.description || project.category.replaceAll("-", " ")}
                </p>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <Link
                  href={project.url}
                  onClick={onNavigate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#242622] hover:text-[#727A61]"
                >
                  View details <FiArrowUpRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => onInquire(project)}
                  className="rounded-md border border-[#DDD5C8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#575E4A] transition-colors hover:border-[#727A61] hover:bg-[#EEF1EA]"
                >
                  Enquire
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Dynamic Follow-up Suggestions & Quick Actions ---
function DynamicSuggestions({
  onSelect,
  language,
}: {
  onSelect: (prompt: string) => void;
  language: "en" | "bn";
}) {
  const suggestions =
    language === "en"
      ? [
          { text: "Estimate budget", icon: FiDollarSign },
          { text: "Book consultation", icon: FiCalendar },
          { text: "View kitchen projects", icon: FiLayout },
          { text: "Design process & timeline", icon: FiHelpCircle },
        ]
      : [
          { text: "বাজেট হিসাব করুন", icon: FiDollarSign },
          { text: "কনসালটেশন বুক করুন", icon: FiCalendar },
          { text: "কিচেন প্রজেক্ট দেখুন", icon: FiLayout },
          { text: "ডিজাইন প্রসেস ও সময়সীমা", icon: FiHelpCircle },
        ];

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {suggestions.map((s, idx) => {
        const Icon = s.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(s.text)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD5C8] bg-white px-3 py-1.5 text-xs font-medium text-[#242622] shadow-2xs transition-all hover:border-[#727A61] hover:bg-[#FAF7F2] hover:text-[#575E4A] active:scale-95"
          >
            <Icon size={12} className="text-[#727A61]" />
            <span>{s.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function SiteVisitBookingCard({
  language,
  slots,
  form,
  status,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  language: "en" | "bn";
  slots: SiteVisitDay[];
  form: SiteVisitForm;
  status: "idle" | "loading" | "submitting" | "success";
  error: string;
  onChange: (updates: Partial<SiteVisitForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const selectedDay = slots.find((day) => day.date === form.visit_date);
  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.location.trim()) &&
    Boolean(form.visit_date) &&
    Boolean(form.time_slot) &&
    status !== "submitting";

  return (
    <div className="mt-2 w-full rounded-2xl border border-[#DDD5C8] bg-[#FAF7F2] p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#242622] text-[#FAF7F2]">
            <FiCalendar size={16} />
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#242622]">
              {language === "en" ? "Book a Studio Consultation / Site Visit" : "কনসালটেশন ও সাইট ভিজিট বুকিং"}
            </h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#5A6057]">
              {language === "en"
                ? "Select an appointment window. Our lead architect will call to confirm."
                : "পছন্দের সময় নির্বাচন করুন। আমাদের সিনিয়র আর্কিটেক্ট কল করে নিশ্চিত করবেন।"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#767E73] hover:text-[#242622] p-1"
          aria-label="Close booking form"
        >
          <FiX size={15} />
        </button>
      </div>

      {status === "loading" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-[#EAE3D5]" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-none">
            {slots.map((day) => {
              const selected = day.date === form.visit_date;
              const availableCount = day.slots.filter((slot) => slot.available).length;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    const firstAvailableSlot = day.slots.find((slot) => slot.available);
                    onChange({
                      visit_date: day.date,
                      time_slot: firstAvailableSlot?.value || "",
                    });
                  }}
                  aria-pressed={selected}
                  className={`min-w-[108px] snap-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border-[#242622] bg-[#242622] text-[#FAF7F2]"
                      : "border-[#DDD5C8] bg-white text-[#242622] hover:border-[#727A61]"
                  }`}
                >
                  <span className="block whitespace-nowrap text-xs font-semibold">{day.label}</span>
                  <span className={`text-[10px] ${selected ? "text-[#DCE2D5]" : "text-[#767E73]"}`}>
                    {availableCount} {language === "en" ? "slots" : "সময়"}
                  </span>
                </button>
              );
            })}
          </div>

          {!!selectedDay && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onChange({ time_slot: slot.value })}
                  aria-pressed={form.time_slot === slot.value}
                  className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
                    form.time_slot === slot.value
                      ? "border-[#575E4A] bg-[#575E4A] text-[#FAF7F2]"
                      : slot.available
                        ? "border-[#DDD5C8] bg-white text-[#242622] hover:border-[#727A61]"
                        : "border-[#EAE3D5] bg-[#F4F0E8] text-[#8C948C] line-through"
                  }`}
                >
                  {slot.label}
                  {!slot.available && (
                    <span className="ml-1 text-[9px] font-normal no-underline">
                      {slot.unavailable_reason === "past"
                        ? language === "en" ? "Passed" : "সময় শেষ"
                        : language === "en" ? "Booked" : "বুকড"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 grid gap-2">
            <label className="relative block">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767E73]" size={14} />
              <input
                value={form.name}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder={language === "en" ? "Your name" : "আপনার নাম"}
                autoComplete="name"
                className="w-full rounded-lg border border-[#DDD5C8] bg-white py-2 pl-9 pr-3 text-xs text-[#242622] outline-none focus:border-[#727A61]"
              />
            </label>
            <input
              value={form.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              placeholder={language === "en" ? "Phone / WhatsApp" : "ফোন / হোয়াটসঅ্যাপ"}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="w-full rounded-lg border border-[#DDD5C8] bg-white px-3 py-2 text-xs text-[#242622] outline-none focus:border-[#727A61]"
            />
            <label className="relative block">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767E73]" size={14} />
              <input
                value={form.location}
                onChange={(event) => onChange({ location: event.target.value })}
                placeholder={language === "en" ? "Project location (e.g. Gulshan, Banani)" : "লোকেশন (গুলশান, বনানী...)"}
                autoComplete="street-address"
                className="w-full rounded-lg border border-[#DDD5C8] bg-white py-2 pl-9 pr-3 text-xs text-[#242622] outline-none focus:border-[#727A61]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.space_size}
                onChange={(event) => onChange({ space_size: event.target.value })}
                placeholder={language === "en" ? "Size (e.g. 2400 sq ft)" : "সাইজ (যেমন ২৪০০ sq ft)"}
                className="min-w-0 rounded-lg border border-[#DDD5C8] bg-white px-3 py-2 text-xs text-[#242622] outline-none focus:border-[#727A61]"
              />
              <input
                value={form.email}
                onChange={(event) => onChange({ email: event.target.value })}
                placeholder={language === "en" ? "Email (optional)" : "ইমেইল (ঐচ্ছিক)"}
                type="email"
                autoComplete="email"
                className="min-w-0 rounded-lg border border-[#DDD5C8] bg-white px-3 py-2 text-xs text-[#242622] outline-none focus:border-[#727A61]"
              />
            </div>
            <textarea
              value={form.project_note}
              onChange={(event) => onChange({ project_note: event.target.value })}
              placeholder={language === "en" ? "Brief description of requirements" : "প্রজেক্ট সম্পর্কিত সংক্ষিপ্ত বিবরণ"}
              rows={2}
              className="w-full resize-none rounded-lg border border-[#DDD5C8] bg-white px-3 py-2 text-xs text-[#242622] outline-none focus:border-[#727A61]"
            />
          </div>

          {!!error && <p className="mt-2 text-xs font-medium text-[#A45138]">{error}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 btn btn-clay py-2.5 text-xs font-semibold rounded-lg disabled:opacity-40"
          >
            <FiCheck size={14} />
            {status === "submitting"
              ? language === "en" ? "Reserving Appointment..." : "বুকিং হচ্ছে..."
              : language === "en" ? "Confirm Consultation Request" : "কনসালটেশন নিশ্চিত করুন"}
          </button>
        </>
      )}
    </div>
  );
}

// --- Topic Categories for Welcome Hub ---
const TOPIC_CATEGORIES = {
  en: [
    {
      title: "Full Home Interiors",
      desc: "Architectural residences & bespoke renovations",
      prompt: "I want to plan a full apartment interior renovation in Dhaka. How do we start?",
      icon: FiHome,
    },
    {
      title: "Bespoke Kitchens",
      desc: "Travertine, teak cabinetry & concealed appliances",
      prompt: "Show me modern kitchen designs, materials, and cost ideas.",
      icon: FiLayout,
    },
    {
      title: "Master Suites",
      desc: "Sanctuary palettes, walk-in closets & lighting",
      prompt: "Help me design a quiet luxury master suite with walk-in closet.",
      icon: FiGrid,
    },
    {
      title: "Cost & Budgeting",
      desc: "Transparent sq ft estimates & finish tiers",
      prompt: "What is the typical cost per sq ft for interior design in Dhaka?",
      icon: FiDollarSign,
    },
  ],
  bn: [
    {
      title: "সম্পূর্ণ ফ্ল্যাট ইন্টেরিয়র",
      desc: "আর্কিটেকচারাল লাক্সারি ফ্ল্যাট ও ডুপ্লেক্স ডিজাইন",
      prompt: "আমার সম্পূর্ণ ফ্ল্যাটের ইন্টেরিয়র ডিজাইন করতে চাই। কীভাবে শুরু করব?",
      icon: FiHome,
    },
    {
      title: "মডার্ন কিচেন স্পেস",
      desc: "কাস্টম ক্যাবিনেট, কোয়ার্টজ ও প্রিমিয়াম ফিনিশিং",
      prompt: "আধুনিক কিচেনের ডিজাইন ও বাজেট সম্পর্কে জানতে চাই।",
      icon: FiLayout,
    },
    {
      title: "মাস্টার বেডরুম সুইট",
      desc: "শান্ত আবহে ওয়াক-ইন ক্লোজেট ও ওয়ার্ম লাইটিং",
      prompt: "একটি প্রিমিয়াম মাস্টার বেডরুম সুইট ডিজাইনের আইডিয়া দিন।",
      icon: FiGrid,
    },
    {
      title: "বাজেট ও খরচ",
      desc: "প্রতি স্কয়ার ফিট অনুসারে আনুমানিক বাজেট হিসাব",
      prompt: "ঢাকায় ইন্টেরিয়র ডিজাইনের প্রতি স্কয়ার ফিটে কেমন খরচ হয়?",
      icon: FiDollarSign,
    },
  ],
};

const WELCOME_MESSAGES: Record<"en" | "bn", Message> = {
  en: {
    role: "assistant",
    content:
      "Welcome to **Bangla Sketch Architectural Studio**.\n\nHow may we assist you today? You can ask about estimating your project budget, booking a studio consultation, or exploring our residential & commercial portfolio.",
  },
  bn: {
    role: "assistant",
    content:
      "**বাংলা স্কেচ** আর্কিটেকচারাল স্টুডিওতে স্বাগতম।\n\nআপনার অ্যাপার্টমেন্ট, কিচেন কিংবা কমার্শিয়াল স্পেসের জন্য ডিজাইন পরামর্শ, আনুমানিক খরচ হিসাব ও কনসালটেশন শিডিউল করতে সাহায্য করতে পারি।",
  },
};

export function ChatWidget() {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGES.en]);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sound & Speech State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("woman");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Gallery & Booking
  const [featuredProjects, setFeaturedProjects] = useState<RecommendedProject[]>([]);
  const [galleryState, setGalleryState] = useState<"loading" | "ready" | "error">("loading");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [siteVisitSlots, setSiteVisitSlots] = useState<SiteVisitDay[]>([]);
  const [siteVisitForm, setSiteVisitForm] = useState<SiteVisitForm>(emptySiteVisitForm);
  const [siteVisitStatus, setSiteVisitStatus] = useState<"idle" | "loading" | "submitting" | "success">("idle");
  const [siteVisitError, setSiteVisitError] = useState("");

  // Refs
  const pending = useRef(false);
  const sessionId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Hide on admin routes
  const isAdminRoute = pathname?.startsWith("/admin");

  // --- Initial Load & Restore ---
  useEffect(() => {
    try {
      const savedSound = localStorage.getItem(SOUND_KEY);
      if (savedSound !== null) setSoundEnabled(savedSound === "true");
      const savedVoice = localStorage.getItem(VOICE_STYLE_KEY);
      if (savedVoice === "woman" || savedVoice === "man") setVoiceStyle(savedVoice);

      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (
        saved &&
        typeof saved.sessionId === "string" &&
        /^[a-f0-9]{32}$/.test(saved.sessionId) &&
        Array.isArray(saved.messages)
      ) {
        const valid = saved.messages
          .filter(
            (m: Message) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.length <= 12000
          )
          .slice(-60)
          .map((m: Message) => ({ ...m, projects: readProjects(m.projects) }));
        if (valid.length) {
          sessionId.current = saved.sessionId;
          setMessages(valid);
        }
      }
    } catch {
      // Storage unavailable
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // --- Sync Storage ---
  useEffect(() => {
    if (!ready || isSending) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId: sessionId.current, messages: messages.slice(-60) })
      );
    } catch {
      // Safe fallback
    }
  }, [messages, ready, isSending]);

  // --- Auto-scroll ---
  useEffect(() => {
    if (isOpen && messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "end",
      });
    }
  }, [messages, isSending, error, isOpen, reducedMotion]);

  useEffect(() => {
    if (!isOpen || !bookingOpen) return;
    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "end",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [bookingOpen, isOpen, reducedMotion]);

  // --- Focus Management ---
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!bookingOpen || siteVisitSlots.length || siteVisitStatus === "loading") return;
    setSiteVisitStatus("loading");
    setSiteVisitError("");
    fetch("/api/site-visits", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.data)) {
          throw new Error(data.error || "Unable to load consultation slots.");
        }
        setSiteVisitSlots(data.data);
        const firstAvailable = data.data.find((day: SiteVisitDay) =>
          day.slots.some((slot) => slot.available)
        );
        const firstAvailableSlot = firstAvailable?.slots.find(
          (slot: SiteVisitSlot) => slot.available
        );
        setSiteVisitForm((prev) => ({
          ...prev,
          visit_date: prev.visit_date || firstAvailable?.date || "",
          time_slot: prev.time_slot || firstAvailableSlot?.value || "",
        }));
        setSiteVisitStatus("idle");
      })
      .catch((err: unknown) => {
        setSiteVisitError(err instanceof Error ? err.message : "Unable to load consultation slots.");
        setSiteVisitStatus("idle");
      });
  }, [bookingOpen, siteVisitSlots.length, siteVisitStatus]);

  // --- Fetch Gallery Projects on Open ---
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setGalleryState("loading");
    fetch("/api/chat", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Portfolio unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setFeaturedProjects(readProjects(data.projects));
          setGalleryState("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setGalleryState("error");
      });
    return () => controller.abort();
  }, [isOpen]);

  // --- Text to Speech (TTS) ---
  const handleReadAloud = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#`_~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "bn" ? "bn-BD" : "en-US";
    utterance.voice = selectGentleVoice(
      availableVoices.length ? availableVoices : window.speechSynthesis.getVoices(),
      language,
      voiceStyle
    ) || null;
    utterance.rate = language === "bn" ? 0.86 : 0.9;
    utterance.pitch = voiceStyle === "woman" ? 1.02 : 0.9;
    utterance.volume = 0.82;
    utterance.onend = () => setSpeakingMessageIndex(null);
    utterance.onerror = () => setSpeakingMessageIndex(null);

    setSpeakingMessageIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // --- Copy Message Content ---
  const handleCopy = (text: string, index: number) => {
    const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    navigator.clipboard.writeText(clean);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // --- Reset Conversation ---
  const handleResetConversation = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    sessionId.current = null;
    setMessages([WELCOME_MESSAGES[language]]);
    setInput("");
    setError(null);
    setBookingOpen(false);
    setSiteVisitForm(emptySiteVisitForm);
    setSiteVisitError("");
    setSiteVisitStatus("idle");
    setShowResetConfirm(false);
    setSpeakingMessageIndex(null);
  };

  // --- Language Switch ---
  const switchLanguage = (newLang: "en" | "bn") => {
    if (language === newLang) return;
    setLanguage(newLang);
    if (messages.length === 1) {
      setMessages([WELCOME_MESSAGES[newLang]]);
    }
  };

  // --- Sound Toggle ---
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_KEY, String(next));
    if (next) playChime("pop");
  };

  const chooseVoiceStyle = (style: VoiceStyle) => {
    setVoiceStyle(style);
    localStorage.setItem(VOICE_STYLE_KEY, style);
    setShowVoiceMenu(false);

    window.speechSynthesis.cancel();
    const preview = new SpeechSynthesisUtterance(
      language === "bn" ? "স্বাগতম। আপনার সুন্দর ঘরের পরিকল্পনা নিয়ে কথা বলি।" : "Welcome. Let's create a beautiful space together."
    );
    preview.lang = language === "bn" ? "bn-BD" : "en-US";
    preview.voice = selectGentleVoice(
      availableVoices.length ? availableVoices : window.speechSynthesis.getVoices(),
      language,
      style
    ) || null;
    preview.rate = language === "bn" ? 0.86 : 0.9;
    preview.pitch = style === "woman" ? 1.02 : 0.9;
    preview.volume = 0.82;
    window.speechSynthesis.speak(preview);
  };

  const close = () => {
    setIsOpen(false);
    setShowResetConfirm(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    launcherRef.current?.focus();
  };

  const openSiteVisitBooking = () => {
    setError(null);
    setBookingOpen(true);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: language === "en" ? "Book consultation" : "কনসালটেশন বুক করুন",
        timestamp: now,
      },
      {
        role: "assistant",
        content:
          language === "en"
            ? "Certainly. Please select a date and preferred time below, and our lead architect will connect with you."
            : "অবশ্যই। নিচে আপনার সুবিধাজনক তারিখ ও সময় নির্বাচন করুন।",
        timestamp: now,
      },
    ]);
  };

  const submitSiteVisitBooking = async () => {
    if (siteVisitStatus === "submitting") return;
    setSiteVisitStatus("submitting");
    setSiteVisitError("");
    try {
      const response = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteVisitForm),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const detail =
          typeof data.error === "string"
            ? data.error
            : data.error?.time_slot?.[0] || data.error?.visit_date?.[0] || "Unable to reserve this slot.";
        throw new Error(detail);
      }
      const booking = data.data;
      const confirmationTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const confirmation =
        language === "en"
          ? `Your consultation request is reserved for **${booking.visit_date} at ${booking.time_slot_label}**.\n\nOur studio architect will call ${booking.phone} to confirm.`
          : `আপনার কনসালটেশন রিকোয়েস্ট **${booking.visit_date}, ${booking.time_slot_label}** সময়ের জন্য সংরক্ষিত হয়েছে।\n\nআমাদের স্টুডিও টিম ${booking.phone} নাম্বারে কল করে নিশ্চিত করবে।`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: confirmation, timestamp: confirmationTime },
      ]);
      setBookingOpen(false);
      setSiteVisitForm(emptySiteVisitForm);
      setSiteVisitSlots([]);
      setSiteVisitStatus("success");
      if (soundEnabled) playChime("receive");
    } catch (err: unknown) {
      setSiteVisitError(err instanceof Error ? err.message : "Unable to reserve this slot.");
      setSiteVisitStatus("idle");
    }
  };

  const handleSuggestionSelect = (prompt: string) => {
    if (isSiteVisitPrompt(prompt)) {
      openSiteVisitBooking();
      return;
    }
    if (isEstimatorPrompt(prompt)) {
      handleSend(
        language === "en"
          ? "How can I estimate the budget for my interior design project in Dhaka?"
          : "আমার ইন্টেরিয়র ডিজাইনের আনুমানিক বাজেট কীভাবে হিসাব করব?"
      );
      return;
    }
    if (bookingOpen) {
      setBookingOpen(false);
      setSiteVisitForm(emptySiteVisitForm);
      setSiteVisitError("");
      setSiteVisitStatus("idle");
    }
    handleSend(prompt);
  };

  // --- Send Message ---
  const handleSend = async (text = input) => {
    const userMsg = text.trim();
    if (!userMsg || pending.current || !ready) return;

    if (isSiteVisitPrompt(userMsg)) {
      setInput("");
      openSiteVisitBooking();
      return;
    }

    if (bookingOpen) {
      setBookingOpen(false);
      setSiteVisitForm(emptySiteVisitForm);
      setSiteVisitError("");
      setSiteVisitStatus("idle");
    }

    if (soundEnabled) playChime("send");
    pending.current = true;
    setIsSending(true);
    setError(null);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, timestamp: now },
    ]);
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      if (!sessionId.current) {
        sessionId.current = Array.from(
          crypto.getRandomValues(new Uint8Array(16)),
          (byte) => byte.toString(16).padStart(2, "0")
        ).join("");
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, message: userMsg }),
        signal: AbortSignal.timeout(12_000),
      });

      const data = await res.json();
      if (
        !res.ok ||
        !data.success ||
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Chat is temporarily unavailable. Please try again."
        );
      }

      const replyTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      startTransition(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            timestamp: replyTimestamp,
            projects: readProjects(data.projects),
          },
        ]);
      });

      if (soundEnabled) playChime("receive");
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "TimeoutError" ||
          err.name === "AbortError" ||
          err.message.includes("timeout") ||
          err.message.includes("longer than expected"));

      if (isTimeout) {
        const timeoutTimestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const timeoutReply =
          language === "bn"
            ? "আমাদের আর্কিটেক্ট টিম বর্তমানে উচ্চমাত্রার অনুসন্ধান হ্যান্ডেল করছে। তাৎক্ষণিক আলোচনার জন্য হোয়াটসঅ্যাপে যোগাযোগ করুন: +8801712458794।"
            : "Our studio is currently experiencing high inquiry volume. Connect directly with our senior architect on WhatsApp (+8801712458794) or schedule a studio visit.";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: timeoutReply,
            timestamp: timeoutTimestamp,
          },
        ]);
      } else {
        setError(
          err instanceof Error && err.name === "Error"
            ? err.message
            : "Could not connect. You can retry or contact our team directly."
        );
        setMessages((prev) => prev.slice(0, -1));
        setInput(userMsg);
      }
    } finally {
      pending.current = false;
      setIsSending(false);
    }
  };

  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    "Hello Bangla Sketch! I would like to discuss an architectural interior project."
  )}`;

  if (isAdminRoute) return null;

  return (
    <>
      {/* --- Floating Launcher Button --- */}
      <div
        className={`fixed bottom-20 right-4 z-40 transition-all duration-200 md:bottom-6 md:right-6 ${
          isOpen ? "pointer-events-none translate-y-2 scale-90 opacity-0" : "opacity-100"
        }`}
      >
        <button
          ref={launcherRef}
          disabled={!ready}
          aria-label={isOpen ? "Close design assistant" : "Open design assistant"}
          aria-expanded={isOpen}
          aria-controls="design-assistant"
          onClick={() => (isOpen ? close() : setIsOpen(true))}
          title={isOpen ? "Close Studio Assistant" : "Open Studio Assistant"}
          className="group relative grid h-14 w-14 md:h-15 md:w-15 place-items-center rounded-full border border-[#DDD5C8] bg-[#242622] text-[#FAF7F2] shadow-[0_8px_24px_rgba(36,38,34,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#727A61] hover:shadow-[0_12px_28px_rgba(36,38,34,0.24)] active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#727A61]"
        >
          {isOpen ? (
            <FiX size={24} aria-hidden="true" />
          ) : (
            <div className="relative flex items-center justify-center">
              <FiMessageSquare size={22} className="text-[#FAF7F2] transition-transform duration-200 group-hover:scale-105" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#A45138] ring-2 ring-[#242622]" />
            </div>
          )}
        </button>
      </div>

      {/* --- Modal Chat Window --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur (mobile only) */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-[#242622]/40 backdrop-blur-xs md:hidden"
            />

            {/* Chat Dialog Sheet / Card */}
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              id="design-assistant"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-title"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : 20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                }
              }}
              className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[440px] md:max-w-[calc(100vw-2.5rem)] md:h-[700px] md:max-h-[calc(100dvh-7rem)] z-50 bg-[#FAF7F2] flex flex-col overflow-hidden outline-none shadow-[0_24px_60px_rgba(36,38,34,0.18)] md:rounded-2xl border border-[#DDD5C8] font-sans"
            >
              {/* --- 1. Header with Branded Elements & Controls --- */}
              <header className="relative px-4 py-3 bg-[#FAF7F2] text-[#242622] flex items-center justify-between shrink-0 border-b border-[#DDD5C8]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Image
                      src="/logo-icon.svg"
                      alt="Bangla Sketch logo"
                      width={38}
                      height={38}
                      className="rounded-full border border-[#DDD5C8] bg-white p-0.5 object-contain"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#727A61]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2
                        id="chat-title"
                        className="font-serif text-base font-semibold tracking-wide text-[#242622] leading-tight truncate"
                      >
                        Bangla Sketch
                      </h2>
                      <span className="hidden sm:inline-flex rounded-full bg-[#EEF1EA] px-2 py-0.5 text-[10px] font-semibold text-[#575E4A] border border-[#DDD5C8]/80">
                        Studio Assistant
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6057] truncate">
                      {language === "en"
                        ? "Architectural Guidance & Inquiries"
                        : "আর্কিটেকচার ও ইন্টেরিয়র পরামর্শ"}
                    </p>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Language Toggle Pill */}
                  <div className="flex rounded-md bg-[#EAE3D5] p-0.5 border border-[#DDD5C8]">
                    {(["en", "bn"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => switchLanguage(lang)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all ${
                          language === lang
                            ? "bg-[#242622] text-[#FAF7F2] shadow-2xs"
                            : "text-[#5A6057] hover:text-[#242622]"
                        }`}
                        title={lang === "en" ? "English" : "বাংলা"}
                      >
                        {lang === "en" ? "EN" : "বাং"}
                      </button>
                    ))}
                  </div>

                  {/* Voice and sound settings */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVoiceMenu((open) => !open)}
                      title="Voice settings"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-[#5A6057] hover:text-[#242622] hover:bg-[#EAE3D5] transition-colors"
                      aria-label="Voice and sound settings"
                      aria-expanded={showVoiceMenu}
                    >
                      {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                    </button>

                    {showVoiceMenu && (
                      <div className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-[#DDD5C8] bg-white p-2.5 text-[#242622] shadow-xl">
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#767E73]">
                          {language === "en" ? "Read-aloud voice" : "শোনার ভয়েস"}
                        </p>
                        <div className="mt-2 grid gap-1">
                          {([
                            ["woman", language === "en" ? "Sweet woman" : "মিষ্টি নারী কণ্ঠ"],
                            ["man", language === "en" ? "Gentle man" : "কোমল পুরুষ কণ্ঠ"],
                          ] as const).map(([style, label]) => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => chooseVoiceStyle(style)}
                              className={`flex min-h-9 items-center justify-between rounded-lg px-2.5 text-left text-xs transition-colors ${
                                voiceStyle === style
                                  ? "bg-[#E8EBDD] font-semibold text-[#3F4935]"
                                  : "hover:bg-[#F4F0E8]"
                              }`}
                            >
                              <span>{label}</span>
                              {voiceStyle === style && <FiCheck size={13} />}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={toggleSound}
                          className="mt-2 flex min-h-9 w-full items-center justify-between border-t border-[#EAE3D5] px-2.5 pt-2 text-xs text-[#5A6057]"
                        >
                          <span>{language === "en" ? "Message sounds" : "মেসেজ সাউন্ড"}</span>
                          <span className="font-semibold text-[#3F4935]">
                            {soundEnabled ? "On" : "Off"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reset Conversation Button with Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => setShowResetConfirm(!showResetConfirm)}
                      title="Reset chat"
                      aria-label="Start new conversation"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-[#5A6057] hover:text-[#242622] hover:bg-[#EAE3D5] transition-colors disabled:opacity-40"
                    >
                      <FiRefreshCw size={14} />
                    </button>

                    {showResetConfirm && (
                      <div className="absolute right-0 top-9 w-52 rounded-xl border border-[#DDD5C8] bg-white p-3 shadow-lg z-50 text-[#242622]">
                        <p className="text-xs text-[#5A6057]">
                          {language === "en"
                            ? "Clear current chat history?"
                            : "বর্তমান চ্যাট মুছে নতুন করে শুরু করবেন?"}
                        </p>
                        <div className="mt-2.5 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="rounded-md px-2 py-1 text-xs text-[#5A6057] hover:bg-[#FAF7F2]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleResetConversation}
                            className="inline-flex items-center gap-1 rounded-md bg-[#242622] px-2.5 py-1 text-xs font-semibold text-[#FAF7F2] shadow-2xs hover:bg-[#575E4A]"
                          >
                            <FiTrash2 size={11} />
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Minimize / Close Button */}
                  <button
                    type="button"
                    onClick={close}
                    title="Minimize"
                    aria-label="Minimize chat"
                    className="h-7 w-7 flex items-center justify-center rounded-md text-[#5A6057] hover:text-[#242622] hover:bg-[#EAE3D5] transition-colors"
                  >
                    <FiMinus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    title="Close"
                    aria-label="Close chat"
                    className="h-7 w-7 flex items-center justify-center rounded-md text-[#5A6057] hover:text-[#A45138] hover:bg-[#EAE3D5] transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </header>

              {/* --- 2. Quick Action Bar --- */}
              <div className="bg-[#FAF7F2] border-b border-[#DDD5C8] px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => handleSuggestionSelect("Estimate budget")}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#DDD5C8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#242622] hover:border-[#727A61] hover:bg-[#EEF1EA] transition-colors"
                >
                  <FiDollarSign size={11} className="text-[#A45138]" />
                  <span>{language === "en" ? "Estimate budget" : "বাজেট হিসাব"}</span>
                </button>
                <button
                  type="button"
                  onClick={openSiteVisitBooking}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#DDD5C8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#242622] hover:border-[#727A61] hover:bg-[#EEF1EA] transition-colors"
                >
                  <FiCalendar size={11} className="text-[#727A61]" />
                  <span>{language === "en" ? "Book consultation" : "কনসালটেশন বুক"}</span>
                </button>
                <Link
                  href="/portfolio"
                  onClick={close}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#DDD5C8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#242622] hover:border-[#727A61] hover:bg-[#EEF1EA] transition-colors"
                >
                  <FiLayout size={11} className="text-[#727A61]" />
                  <span>{language === "en" ? "View projects" : "প্রজেক্ট পোর্টফোলিও"}</span>
                </Link>
              </div>

              {/* --- 3. Scrollable Message Feed --- */}
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
                tabIndex={0}
              >
                {/* --- Welcome State (When only initial message exists) --- */}
                {messages.length === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Welcome Studio Card */}
                    <div className="rounded-xl border border-[#DDD5C8] bg-white p-4 shadow-2xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-[#727A61]" />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#727A61] font-mono">
                          Editorial Studio Guidance
                        </p>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-[#242622]">
                        {language === "en"
                          ? "Quiet Luxury Architecture & Interiors"
                          : "শান্ত সৌন্দর্য ও টেকসই আর্কিটেকচারাল ডিজাইন"}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#5A6057]">
                        {language === "en"
                          ? "Explore curated spaces, compute sq ft cost estimates, or reserve a private design consultation."
                          : "আমাদের প্রজেক্টগুলো দেখুন, স্কয়ার ফিট অনুযায়ী বাজেট ধারণা নিন অথবা ডিজাইনারের সাথে কনসালটেশন বুক করুন।"}
                      </p>
                    </div>

                    {/* --- Featured Projects Carousel --- */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-0.5">
                        <p className="text-xs font-semibold text-[#242622] uppercase tracking-wider text-[11px]">
                          {language === "en" ? "Selected Projects" : "নির্বাচিত প্রজেক্টসমূহ"}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Scroll left"
                            onClick={() =>
                              carouselRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#DDD5C8] text-[#5A6057] hover:bg-[#EEF1EA] hover:text-[#242622]"
                          >
                            <FiChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label="Scroll right"
                            onClick={() =>
                              carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#DDD5C8] text-[#5A6057] hover:bg-[#EEF1EA] hover:text-[#242622]"
                          >
                            <FiChevronRight size={13} />
                          </button>
                        </div>
                      </div>

                      {galleryState === "loading" && !featuredProjects.length && (
                        <div className="h-32 rounded-xl bg-[#EAE3D5] flex items-center justify-center text-xs text-[#5A6057] animate-pulse">
                          {language === "en" ? "Loading studio projects…" : "প্রজেক্ট লোড হচ্ছে…"}
                        </div>
                      )}

                      {!!featuredProjects.length && (
                        <div
                          ref={carouselRef}
                          className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory"
                        >
                          {featuredProjects.map((project) => (
                            <div
                              key={project.url}
                              className="w-[210px] shrink-0 snap-start rounded-xl border border-[#DDD5C8] bg-white overflow-hidden shadow-2xs hover:border-[#727A61] transition-all group"
                            >
                              <Link
                                href={project.url}
                                onClick={close}
                                className="block relative h-26 bg-[#EAE3D5] overflow-hidden"
                              >
                                {project.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={project.image}
                                    alt={project.title}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                    className="h-full w-full object-cover transition-transform duration-220 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-[#727A61]">
                                    <FiHome size={24} />
                                  </div>
                                )}
                                <span className="absolute bottom-1.5 left-1.5 rounded bg-[#242622]/80 px-2 py-0.5 text-[9px] font-medium text-[#FAF7F2] backdrop-blur-2xs">
                                  {project.category.replaceAll("-", " ")}
                                </span>
                              </Link>
                              <div className="p-2.5">
                                <p className="font-serif text-xs font-semibold text-[#242622] truncate">
                                  {project.title}
                                </p>
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() =>
                                    handleSend(
                                      language === "en"
                                        ? `Tell me about the ${project.title} project and give me ideas for a similar space.`
                                        : `${project.title} প্রজেক্টের মতো স্পেস ডিজাইন সম্পর্কে বিস্তারিত জানান।`
                                    )
                                  }
                                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#575E4A] hover:text-[#242622] hover:underline"
                                >
                                  {language === "en" ? "Explore space" : "বিস্তারিত জানুন"}{" "}
                                  <FiArrowRight size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* --- Quick Inquiry Topics --- */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#242622] px-0.5 uppercase tracking-wider text-[11px]">
                        {language === "en" ? "Inquiry Directions" : "জনপ্রিয় টপিকসমূহ"}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {TOPIC_CATEGORIES[language].map((cat, idx) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!ready || isSending}
                              onClick={() => handleSend(cat.prompt)}
                              className="flex flex-col items-start p-3 text-left rounded-xl border border-[#DDD5C8] bg-white shadow-2xs hover:border-[#727A61] hover:bg-[#FAF7F2] transition-all duration-200 group active:scale-98"
                            >
                              <div className="h-6 w-6 rounded-md bg-[#EEF1EA] text-[#575E4A] flex items-center justify-center mb-1.5 group-hover:bg-[#575E4A] group-hover:text-white transition-colors">
                                <Icon size={13} />
                              </div>
                              <p className="text-xs font-semibold text-[#242622] leading-tight">
                                {cat.title}
                              </p>
                              <p className="mt-1 text-[10px] text-[#5A6057] line-clamp-1">
                                {cat.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Message Conversation Feed --- */}
                <div
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation"
                  aria-busy={isSending}
                  className="space-y-4"
                >
                  {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    const isLastAssistant =
                      !isUser &&
                      (i === messages.length - 1 ||
                        (i === messages.length - 2 && isSending));

                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          isUser ? "items-end" : "items-start"
                        } animate-fade-in`}
                      >
                        {!isUser && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <Image
                              src="/logo-icon.svg"
                              alt=""
                              width={18}
                              height={18}
                              className="h-4.5 w-4.5 rounded-full border border-[#DDD5C8] p-0.5 object-contain"
                            />
                            <span className="text-[11px] font-semibold text-[#575E4A]">
                              Bangla Sketch Studio
                            </span>
                            {m.timestamp && (
                              <span className="text-[10px] text-[#5A6057]/70">
                                · {m.timestamp}
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className={`relative max-w-[90%] md:max-w-[85%] px-4 py-3 rounded-2xl shadow-2xs ${
                            isUser
                              ? "bg-[#242622] text-[#FAF7F2] rounded-br-xs"
                              : "bg-white border border-[#DDD5C8] text-[#242622] rounded-bl-xs"
                          }`}
                        >
                          <RichMessageContent content={m.content} tone={isUser ? "user" : "assistant"} />

                          {!isUser && (
                            <div className="mt-2.5 pt-2 border-t border-[#DDD5C8]/70 flex items-center justify-between text-[11px] text-[#5A6057]">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(m.content, i)}
                                  className="inline-flex items-center gap-1 hover:text-[#242622] transition-colors"
                                  title="Copy text"
                                >
                                  {copiedIndex === i ? (
                                    <>
                                      <FiCheck className="text-emerald-700" size={12} />
                                      <span className="text-emerald-700 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiCopy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReadAloud(m.content, i)}
                                  className={`inline-flex items-center gap-1 transition-colors ${
                                    speakingMessageIndex === i
                                      ? "text-[#575E4A] font-medium"
                                      : "hover:text-[#242622]"
                                  }`}
                                  title={speakingMessageIndex === i ? "Stop speaking" : "Read aloud"}
                                >
                                  <FiVolume2 size={12} />
                                  <span>{speakingMessageIndex === i ? "Stop" : "Listen"}</span>
                                </button>
                              </div>

                              <span className="text-[10px] text-[#5A6057]/60">
                                {m.timestamp || ""}
                              </span>
                            </div>
                          )}
                        </div>

                        {isUser && m.timestamp && (
                          <span className="mt-0.5 text-[10px] text-[#5A6057]/70 pr-1">
                            {m.timestamp}
                          </span>
                        )}

                        {!isUser && !!m.projects?.length && (
                          <div className="w-full max-w-[90%] md:max-w-[85%]">
                            <RecommendedProjects
                              projects={m.projects}
                              onNavigate={close}
                              onInquire={(proj) =>
                                handleSend(
                                  language === "en"
                                    ? `I am interested in ${proj.title}. Can you provide details and estimate?`
                                    : `${proj.title} প্রজেক্টটি সম্পর্কে আরও বিস্তারিত ও বাজেট জানতে চাই।`
                                )
                              }
                            />
                          </div>
                        )}

                        {isLastAssistant && !isSending && !bookingOpen && (
                          <div className="w-full max-w-[90%] md:max-w-[85%]">
                            <DynamicSuggestions
                              language={language}
                              onSelect={handleSuggestionSelect}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {bookingOpen && (
                    <div className="flex flex-col items-start animate-fade-in">
                      <SiteVisitBookingCard
                        language={language}
                        slots={siteVisitSlots}
                        form={siteVisitForm}
                        status={siteVisitStatus}
                        error={siteVisitError}
                        onChange={(updates) =>
                          setSiteVisitForm((prev) => ({ ...prev, ...updates }))
                        }
                        onSubmit={submitSiteVisitBooking}
                        onClose={() => setBookingOpen(false)}
                      />
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {isSending && (
                    <div className="flex items-start gap-2 animate-fade-in">
                      <Image
                        src="/logo-icon.svg"
                        alt=""
                        width={18}
                        height={18}
                        className="h-4.5 w-4.5 rounded-full border border-[#DDD5C8] shrink-0 mt-1 p-0.5 object-contain"
                      />
                      <div className="rounded-2xl rounded-bl-xs border border-[#DDD5C8] bg-white px-4 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#727A61] animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#727A61] animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#727A61] animate-bounce" />
                          </span>
                          <span className="text-xs font-medium text-[#5A6057]">
                            {language === "en"
                              ? "Consulting studio records…"
                              : "ভাবনা সাজানো হচ্ছে…"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State Banner */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#A45138]/30 bg-[#FBF4F2] p-3 text-xs text-[#A45138] shadow-2xs"
                    >
                      <p className="font-semibold">{error}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSend(input)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#242622] px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#575E4A]"
                        >
                          <FiRefreshCw size={11} /> Retry
                        </button>
                        <a
                          href={`tel:${CONTACT.phone}`}
                          className="font-medium text-[#242622] hover:underline"
                        >
                          Call {CONTACT.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* --- 4. Bottom Input & Studio Actions --- */}
              <footer className="shrink-0 bg-[#FAF7F2] border-t border-[#DDD5C8] px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Direct Studio Quick Links */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#DDD5C8] text-[11px] text-[#5A6057]">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/cost-estimator"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#242622] transition-colors"
                    >
                      <FiCompass size={12} className="text-[#727A61]" />
                      <span>Estimator</span>
                    </Link>
                    <span className="text-[#DDD5C8]">|</span>
                    <Link
                      href="/portfolio"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#242622] transition-colors"
                    >
                      <FiLayout size={12} className="text-[#727A61]" />
                      <span>Projects</span>
                    </Link>
                    <span className="text-[#DDD5C8]">|</span>
                    <Link
                      href="/design-brief"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#242622] transition-colors"
                    >
                      <FiBriefcase size={12} className="text-[#727A61]" />
                      <span>Brief</span>
                    </Link>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EAEFE6] border border-[#DDD5C8] px-2.5 py-0.5 text-[11px] font-semibold text-[#575E4A] hover:bg-[#DEE7D7] transition-colors"
                  >
                    <FaWhatsapp size={12} className="text-[#25D366]" />
                    <span>WhatsApp</span>
                    <FiArrowUpRight size={10} />
                  </a>
                </div>

                {/* Input Field Form */}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend();
                  }}
                  className="mt-2.5 flex items-end gap-1.5 rounded-xl border border-[#DDD5C8] bg-white p-1.5 focus-within:border-[#727A61] transition-all"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    aria-label="Your message"
                    readOnly={isSending}
                    maxLength={4000}
                    rows={1}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-xs text-[#242622] outline-none placeholder:text-[#8C948C] max-h-28"
                    placeholder={
                      language === "bn"
                        ? "আপনার ভাবনা বা বাজেট সংক্রান্ত প্রশ্ন লিখুন…"
                        : "Ask about your project, budget, or materials…"
                    }
                  />

                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!ready || isSending || !input.trim()}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#242622] text-[#FAF7F2] shadow-2xs hover:bg-[#575E4A] active:scale-95 disabled:opacity-30 transition-all shrink-0"
                  >
                    <FiSend size={13} />
                  </button>
                </form>

                {/* Footer Micro-info */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#5A6057]/70 px-1">
                  <span className="flex items-center gap-1">
                    <FiCornerDownLeft size={10} /> Enter to send
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${CONTACT.phone}`}
                      className="inline-flex items-center gap-1 hover:text-[#242622]"
                    >
                      <FiPhone size={10} />
                      <span>{CONTACT.phone}</span>
                    </a>
                  </div>
                </div>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
