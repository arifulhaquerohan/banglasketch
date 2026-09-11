"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CONTACT } from "@/lib/constants";
import { FaWhatsapp } from "react-icons/fa";
import {
  FiX,
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

const STORAGE_KEY = "banglasketch-chat-v2";
const SOUND_KEY = "banglasketch-chat-sound";

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
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === "receive") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

// --- Inline Rich Text Parser ---
function renderInlineFormatting(text: string) {
  // Regex splits bold (**text**), italic (*text*), inline code (`code`), markdown links ([text](url))
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#1F241E] dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-[#424A3D]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-[#E7EBDD] px-1.5 py-0.5 text-xs font-mono text-[#303C31]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = href.startsWith("http");
      return isExternal ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#A45138] underline decoration-[#A45138]/40 underline-offset-2 hover:decoration-[#A45138]"
        >
          {label}
        </a>
      ) : (
        <Link
          key={i}
          href={href}
          className="font-medium text-[#A45138] underline decoration-[#A45138]/40 underline-offset-2 hover:decoration-[#A45138]"
        >
          {label}
        </Link>
      );
    }
    return part;
  });
}

// --- Full Structured Message Component ---
function RichMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1 text-[10px] text-[#A45138] select-none">✦</span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#E5EAD9] text-[10px] font-bold text-[#303C31] select-none">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Empty line / paragraph break
    if (!trimmed) {
      flushList();
      return;
    }

    // Unordered list item (- or *)
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (currentList && currentList.type !== "ul") flushList();
      if (!currentList) currentList = { type: "ul", items: [] };
      currentList.items.push(ulMatch[1]);
      return;
    }

    // Ordered list item (1., 2., etc.)
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      if (currentList && currentList.type !== "ol") flushList();
      if (!currentList) currentList = { type: "ol", items: [] };
      currentList.items.push(olMatch[1]);
      return;
    }

    // Heading (### Heading)
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      elements.push(
        <h4
          key={`h-${lineIdx}`}
          className="mt-3 mb-1.5 font-serif text-base font-bold text-[#242622]"
        >
          {renderInlineFormatting(headingMatch[1])}
        </h4>
      );
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${lineIdx}`} className="text-sm leading-relaxed my-1">
        {renderInlineFormatting(trimmed)}
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#58634F]">
          Matching Portfolio · নির্বাচিত প্রজেক্ট
        </p>
        <Link
          href="/portfolio"
          onClick={onNavigate}
          className="text-xs font-medium text-[#A45138] hover:underline"
        >
          All Works ↗
        </Link>
      </div>
      <div className="grid gap-2">
        {projects.map((project) => (
          <div
            key={project.url}
            className="group relative flex gap-3 overflow-hidden rounded-2xl border border-[#DCD6CA] bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-[#727A61] hover:shadow-md"
          >
            {project.image ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#E8EDE0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 left-1 rounded bg-[#20251F]/80 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-[2px]">
                  {project.category.replaceAll("-", " ")}
                </span>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#E8EDE0] text-[#727A61]">
                <FiHome size={24} />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
              <div>
                <Link
                  href={project.url}
                  onClick={onNavigate}
                  className="block font-medium text-[#242622] line-clamp-1 hover:text-[#A45138] focus-visible:outline-none"
                >
                  {project.title}
                </Link>
                <p className="mt-0.5 text-xs text-[#62675A] line-clamp-2 leading-relaxed">
                  {project.description || project.category.replaceAll("-", " ")}
                </p>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <Link
                  href={project.url}
                  onClick={onNavigate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#A45138] hover:underline"
                >
                  View Details <FiArrowUpRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => onInquire(project)}
                  className="rounded-full bg-[#EEF2E6] px-2.5 py-1 text-[11px] font-medium text-[#303C31] transition-colors hover:bg-[#303C31] hover:text-white"
                >
                  Ask about this
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Dynamic Follow-up Suggestions ---
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
          { text: "Estimate cost for my room", icon: FiCompass },
          { text: "Show kitchen cabinet designs", icon: FiLayout },
          { text: "How does your design process work?", icon: FiHelpCircle },
          { text: "Book an in-person site visit", icon: FiBriefcase },
        ]
      : [
          { text: "খরচ কত হতে পারে হিসাব করুন", icon: FiCompass },
          { text: "মডার্ন কিচেন ক্যাবিনেট ডিজাইন", icon: FiLayout },
          { text: "ডিজাইন ও কাজের ধাপগুলো কী?", icon: FiHelpCircle },
          { text: "সাইট ভিজিটের জন্য বুকিং দিন", icon: FiBriefcase },
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
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D4D8C8] bg-[#F7F9F3] px-3 py-1.5 text-xs text-[#3D4737] shadow-2xs transition-all hover:border-[#869278] hover:bg-white hover:text-[#202820] active:scale-95"
          >
            <Icon size={12} className="text-[#A45138]" />
            <span>{s.text}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Topic Categories for Welcome Hub ---
const TOPIC_CATEGORIES = {
  en: [
    {
      title: "Full Home Renovation",
      desc: "Complete interior overhaul for 2BHK/3BHK/Duplex",
      prompt: "I want to plan a full apartment interior renovation in Dhaka. How do we start?",
      icon: FiHome,
    },
    {
      title: "Modular Kitchen",
      desc: "Custom acrylic, veneer & smart storage layouts",
      prompt: "Show me modern modular kitchen designs and cost ideas.",
      icon: FiLayout,
    },
    {
      title: "Master Bedroom",
      desc: "Serene sanctuary, wardrobe & architectural lighting",
      prompt: "Help me design a luxury master bedroom with smart storage.",
      icon: FiGrid,
    },
    {
      title: "Budget & Pricing",
      desc: "Transparent sq ft estimates & material options",
      prompt: "What is the typical cost per sq ft for interior design in Dhaka?",
      icon: FiDollarSign,
    },
  ],
  bn: [
    {
      title: "পুরো ফ্ল্যাট ইন্টেরিয়র",
      desc: "সম্পূর্ণ ২/৩ বেডরুম ও ডুপ্লেক্স বাড়ির আর্কিটেকচারাল ডিজাইন",
      prompt: "আমার সম্পূর্ণ ফ্ল্যাটের ইন্টেরিয়র ডিজাইন করতে চাই। কীভাবে শুরু করব?",
      icon: FiHome,
    },
    {
      title: "মডার্ন কিচেন ডিজাইন",
      desc: "অ্যাক্রিলিক, ভেনিয়ার ও স্মার্ট স্টোরেজ কিচেন ক্যাবিনেট",
      prompt: "আধুনিক মডার্ন কিচেনের ডিজাইন ও বাজেট সম্পর্কে জানতে চাই।",
      icon: FiLayout,
    },
    {
      title: "লাক্সারি বেডরুম",
      desc: "ওয়ারড্রব, হেডবোর্ড ও অ্যাস্থেটিক লাইটিং সলিউশন",
      prompt: "একটি সুন্দর ও আরামদায়ক মাস্টার বেডরুম ডিজাইনের আইডিয়া দিন।",
      icon: FiGrid,
    },
    {
      title: "বাজেট ও খরচ",
      desc: "প্রতি স্কয়ার ফিট অনুযায়ী আনুমানিক খরচের ধারণা",
      prompt: "ঢাকায় ইন্টেরিয়র ডিজাইনের প্রতি স্কয়ার ফিটে কেমন খরচ হয়?",
      icon: FiDollarSign,
    },
  ],
};

const WELCOME_MESSAGES: Record<"en" | "bn", Message> = {
  en: {
    role: "assistant",
    content:
      "Hello & Assalamu Alaikum! Welcome to **Bangla Sketch Architectural Studio**.\n\nTell me about the space you want to transform — whether it's an apartment, kitchen, master suite, or commercial space. I can provide design guidance, budget ranges, and portfolio ideas.",
  },
  bn: {
    role: "assistant",
    content:
      "আসসালামু আলাইকুম! **বাংলা স্কেচ** আর্কিটেকচারাল স্টুডিওতে স্বাগতম।\n\nআপনার ড্রিম স্পেস — ফ্ল্যাট, কিচেন, বেডরুম কিংবা অফিস নিয়ে আলোচনা করতে পারেন। আমি আপনাকে সেরা ডিজাইন আইডিয়া, বাজেট ও পোর্টফোলিও দেখাতে সাহায্য করব।",
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
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Gallery
  const [featuredProjects, setFeaturedProjects] = useState<RecommendedProject[]>([]);
  const [galleryState, setGalleryState] = useState<"loading" | "ready" | "error">("loading");

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

  // --- Focus Management ---
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

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
    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/[*#`_~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 1.0;
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
    setShowResetConfirm(false);
    setSpeakingMessageIndex(null);
  };

  // --- Language Switch ---
  const switchLanguage = (newLang: "en" | "bn") => {
    if (language === newLang) return;
    setLanguage(newLang);
    // If only welcome message is present, update it
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

  const close = () => {
    setIsOpen(false);
    setShowResetConfirm(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    launcherRef.current?.focus();
  };

  // --- Send Message ---
  const handleSend = async (text = input) => {
    const userMsg = text.trim();
    if (!userMsg || pending.current || !ready) return;

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

    // Reset textarea height
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
        signal: AbortSignal.timeout(35_000),
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
      setError(
        err instanceof Error && err.name === "Error"
          ? err.message
          : "Could not connect. You can retry or contact our team directly."
      );
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      pending.current = false;
      setIsSending(false);
    }
  };

  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    "Hello Bangla Sketch! I'd like to consult about an interior design project."
  )}`;

  // Don't render inside admin portal
  if (isAdminRoute) return null;

  return (
    <>
      {/* --- Floating Launcher Button --- */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
        <button
          ref={launcherRef}
          disabled={!ready}
          aria-label={isOpen ? "Close design assistant" : "Open design assistant"}
          aria-expanded={isOpen}
          aria-controls="design-assistant"
          onClick={() => (isOpen ? close() : setIsOpen(true))}
          title={isOpen ? "Close Studio Assistant" : "Open Studio Assistant"}
          className="group relative grid h-16 w-16 place-items-center rounded-full border-[3px] border-[#E9B949] bg-[#10B6D7] text-white shadow-[0_10px_24px_rgba(16,132,158,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#079FBE] hover:shadow-[0_15px_30px_rgba(16,132,158,0.36)] active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#243238]"
        >
          {isOpen ? (
            <FiX size={27} aria-hidden="true" />
          ) : (
            <span aria-hidden="true" className="relative flex h-[27px] w-[34px] items-center justify-center gap-1 rounded-[10px] bg-white shadow-sm after:absolute after:-bottom-1 after:left-2.5 after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-white">
              <span className="relative z-10 h-1 w-1 rounded-full bg-[#10B6D7]" />
              <span className="relative z-10 h-1 w-1 rounded-full bg-[#10B6D7]" />
              <span className="relative z-10 h-1 w-1 rounded-full bg-[#10B6D7]" />
            </span>
          )}
          {!isOpen && <span aria-label="Online" className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />}
        </button>
      </div>

      {/* --- Modal Chat Window --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-[#172126]/35 backdrop-blur-xs md:hidden"
            />

            {/* Chat Dialog Sheet / Card */}
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              id="design-assistant"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-title"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : 30, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                }
              }}
              className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[440px] md:max-w-[calc(100vw-2.5rem)] md:h-[720px] md:max-h-[calc(100dvh-7rem)] z-50 bg-[#F7F9F9] flex flex-col overflow-hidden outline-none shadow-[0_24px_70px_rgba(32,47,53,0.24)] md:rounded-[24px] border border-[#DCE5E7] font-sans"
            >
              {/* --- Header --- */}
              <header className="relative px-4 py-3.5 bg-white text-[#26363B] flex items-center justify-between shrink-0 border-b border-[#E1E9EA] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[#10B6D7]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Image
                      src="/logo.svg"
                      alt="Bangla Sketch logo"
                      width={42}
                      height={42}
                      className="rounded-full border border-[#DCE5E7] bg-white shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2
                        id="chat-title"
                        className="font-serif text-lg font-semibold tracking-wide text-[#26363B] leading-tight truncate"
                      >
                        Bangla Sketch
                      </h2>
                      <span className="hidden sm:inline-flex rounded-full bg-[#E9F8FB] px-2 py-0.5 text-[10px] font-semibold text-[#087F98]">
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-[#607278] truncate">
                      {language === "en"
                        ? "Architectural & Interior Design Assistant"
                        : "আর্কিটেকচার ও ইন্টেরিয়র ডিজাইন অ্যাসিস্ট্যান্ট"}
                    </p>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Language Toggle Pill */}
                  <div className="flex rounded-full bg-[#EEF3F4] p-0.5 border border-[#E1E9EA]">
                    {(["en", "bn"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => switchLanguage(lang)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          language === lang
                            ? "bg-white text-[#087F98] shadow-xs"
                            : "text-[#66787E] hover:text-[#26363B]"
                        }`}
                        title={lang === "en" ? "English" : "বাংলা"}
                      >
                        {lang === "en" ? "EN" : "বাং"}
                      </button>
                    ))}
                  </div>

                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    title={soundEnabled ? "Mute audio chimes" : "Unmute audio chimes"}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-[#66787E] hover:text-[#087F98] hover:bg-[#E9F8FB] transition-colors"
                    aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
                  >
                    {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                  </button>

                  {/* Reset Conversation Button with Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => setShowResetConfirm(!showResetConfirm)}
                      title="Reset chat"
                      aria-label="Start new conversation"
                      className="h-8 w-8 flex items-center justify-center rounded-full text-[#66787E] hover:text-[#087F98] hover:bg-[#E9F8FB] transition-colors disabled:opacity-40"
                    >
                      <FiRefreshCw size={15} />
                    </button>

                    {/* Popover confirmation */}
                    {showResetConfirm && (
                      <div className="absolute right-0 top-10 w-56 rounded-2xl border border-[#DDD5C8] bg-white p-3 shadow-xl z-50 text-[#242622]">
                        <p className="text-xs text-[#5A6057]">
                          {language === "en"
                            ? "Start a new conversation? Current chat will be cleared."
                            : "নতুন করে চ্যাট শুরু করবেন? আগের হিস্টোরি মুছে যাবে।"}
                        </p>
                        <div className="mt-2.5 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="rounded-lg px-2.5 py-1 text-xs text-[#5A6057] hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleResetConversation}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#A45138] px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#893E28]"
                          >
                            <FiTrash2 size={12} />
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Close Modal */}
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close chat"
                    className="h-8 w-8 flex items-center justify-center rounded-full text-[#66787E] hover:text-[#087F98] hover:bg-[#E9F8FB] transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </header>

              {/* --- Scrollable Message Area --- */}
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
                tabIndex={0}
              >
                {/* --- Welcome State (When only initial message exists) --- */}
                {messages.length === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Welcome Studio Card */}
                    <div className="rounded-2xl border border-[#E2DDD3] bg-gradient-to-br from-white to-[#F6F4ED] p-4 shadow-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2 w-2 rounded-full bg-[#A45138]" />
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#727A61]">
                          Studio Inspiration Hub
                        </p>
                      </div>
                      <h3 className="font-serif text-xl font-normal text-[#242622]">
                        {language === "en"
                          ? "Design ideas, tailored for your home."
                          : "আপনার পছন্দের মতো করে ঘর সাজাই।"}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#5A6057]">
                        {language === "en"
                          ? "Browse our real client projects or tap a topic below to explore layouts, materials, and cost estimates."
                          : "আমাদের রিয়েল প্রজেক্টগুলো দেখুন অথবা নিচের টপিক সিলেক্ট করে ডিজাইন ও খরচের আইডিয়া নিন।"}
                      </p>
                    </div>

                    {/* --- Featured Projects Carousel --- */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-xs font-semibold text-[#575E4A]">
                          {language === "en" ? "Selected Portfolio Works" : "আমাদের নির্বাচিত প্রজেক্ট"}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Scroll left"
                            onClick={() =>
                              carouselRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#DDD5C8] text-[#5A6057] hover:bg-[#EEF1EA]"
                          >
                            <FiChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label="Scroll right"
                            onClick={() =>
                              carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#DDD5C8] text-[#5A6057] hover:bg-[#EEF1EA]"
                          >
                            <FiChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {galleryState === "loading" && !featuredProjects.length && (
                        <div className="h-36 rounded-2xl bg-[#EFECE4] flex items-center justify-center text-xs text-[#727A61] animate-pulse">
                          {language === "en" ? "Loading studio projects…" : "প্রজেক্ট লোড হচ্ছে…"}
                        </div>
                      )}

                      {!!featuredProjects.length && (
                        <div
                          ref={carouselRef}
                          className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
                        >
                          {featuredProjects.map((project) => (
                            <div
                              key={project.url}
                              className="w-[220px] shrink-0 snap-start rounded-2xl border border-[#DDD5C8] bg-white overflow-hidden shadow-xs hover:border-[#727A61] transition-all group"
                            >
                              <Link
                                href={project.url}
                                onClick={close}
                                className="block relative h-28 bg-[#EAE3D5] overflow-hidden"
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
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-[#727A61]">
                                    <FiHome size={28} />
                                  </div>
                                )}
                                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#171815]/75 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
                                  {project.category.replaceAll("-", " ")}
                                </span>
                              </Link>
                              <div className="p-2.5">
                                <p className="text-xs font-semibold text-[#242622] truncate">
                                  {project.title}
                                </p>
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() =>
                                    handleSend(
                                      language === "en"
                                        ? `Tell me about the ${project.title} project and give me ideas for a similar ${project.category.replaceAll("-", " ")}.`
                                        : `${project.title} প্রজেক্টের মতো একটি ${project.category.replaceAll("-", " ")} ডিজাইন করতে চাইলে কী কী করতে হবে?`
                                    )
                                  }
                                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#A45138] hover:underline"
                                >
                                  {language === "en" ? "Explore this style" : "এমন ডিজাইন চাই"}{" "}
                                  <FiArrowRight size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* --- Quick Inquiry Category Cards --- */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#575E4A] px-1">
                        {language === "en" ? "Popular Topics" : "জনপ্রিয় বিষয়সমূহ"}
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
                              className="flex flex-col items-start p-3 text-left rounded-2xl border border-[#DDD5C8] bg-white shadow-2xs hover:border-[#727A61] hover:bg-[#FAF7F2] transition-all duration-200 group active:scale-98"
                            >
                              <div className="h-7 w-7 rounded-xl bg-[#EEF1EA] text-[#575E4A] flex items-center justify-center mb-1.5 group-hover:bg-[#727A61] group-hover:text-white transition-colors">
                                <Icon size={14} />
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
                        {/* Avatar & Role Header */}
                        {!isUser && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <Image
                              src="/logo.svg"
                              alt=""
                              width={20}
                              height={20}
                              className="h-5 w-5 rounded-full border border-[#DCE5E7]"
                            />
                            <span className="text-[11px] font-semibold text-[#575E4A]">
                              Bangla Sketch
                            </span>
                            {m.timestamp && (
                              <span className="text-[10px] text-[#5A6057]/70">
                                · {m.timestamp}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Speech Bubble */}
                        <div
                          className={`relative max-w-[90%] md:max-w-[85%] px-4 py-3 rounded-2xl shadow-xs ${
                            isUser
                              ? "bg-[#087F98] text-white rounded-br-xs"
                              : "bg-white border border-[#DCE5E7] text-[#26363B] rounded-bl-xs"
                          }`}
                        >
                          <RichMessageContent content={m.content} />

                          {/* Action Footer on Assistant Bubble */}
                          {!isUser && (
                            <div className="mt-2.5 pt-2 border-t border-[#EAE3D5] flex items-center justify-between text-[11px] text-[#5A6057]">
                              <div className="flex items-center gap-3">
                                {/* Copy Button */}
                                <button
                                  type="button"
                                  onClick={() => handleCopy(m.content, i)}
                                  className="inline-flex items-center gap-1 hover:text-[#242622] transition-colors"
                                  title="Copy text"
                                >
                                  {copiedIndex === i ? (
                                    <>
                                      <FiCheck className="text-emerald-600" size={12} />
                                      <span className="text-emerald-600 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiCopy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                {/* Read Aloud / TTS Button */}
                                <button
                                  type="button"
                                  onClick={() => handleReadAloud(m.content, i)}
                                  className={`inline-flex items-center gap-1 transition-colors ${
                                    speakingMessageIndex === i
                                      ? "text-[#A45138] font-medium"
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

                        {/* User Timestamp */}
                        {isUser && m.timestamp && (
                          <span className="mt-0.5 text-[10px] text-[#5A6057]/70 pr-1">
                            {m.timestamp}
                          </span>
                        )}

                        {/* Project Cards (if attached) */}
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

                        {/* Dynamic Quick Prompt Suggestions under latest assistant response */}
                        {isLastAssistant && !isSending && (
                          <div className="w-full max-w-[90%] md:max-w-[85%]">
                            <DynamicSuggestions
                              language={language}
                              onSelect={(p) => handleSend(p)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isSending && (
                    <div className="flex items-start gap-2 animate-fade-in">
                      <Image
                        src="/logo.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full border border-[#DCE5E7] shrink-0 mt-1"
                      />
                      <div className="rounded-2xl rounded-bl-xs border border-[#DCE5E7] bg-white px-4 py-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-[#10B6D7] animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 rounded-full bg-[#10B6D7] animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 rounded-full bg-[#10B6D7] animate-bounce" />
                          </span>
                          <span className="text-xs font-medium text-[#575E4A]">
                            {language === "en"
                              ? "Finding the best ideas for you…"
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
                      className="rounded-2xl border border-[#F0CEC7] bg-[#FAF1EF] p-3 text-xs text-[#893E28] shadow-xs"
                    >
                      <p className="font-semibold">{error}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSend(input)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#A45138] px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#893E28]"
                        >
                          <FiRefreshCw size={11} /> Retry Message
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

              {/* --- Bottom Input & Action Bar --- */}
              <footer className="shrink-0 bg-white border-t border-[#DDD5C8] px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Direct Studio Quick Links */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#EAE3D5] text-[11px] text-[#575E4A]">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/cost-estimator"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#A45138] transition-colors"
                    >
                      <FiCompass size={12} />
                      <span>Estimator</span>
                    </Link>
                    <span className="text-[#DDD5C8]">|</span>
                    <Link
                      href="/portfolio"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#A45138] transition-colors"
                    >
                      <FiLayout size={12} />
                      <span>Portfolio</span>
                    </Link>
                    <span className="text-[#DDD5C8]">|</span>
                    <Link
                      href="/design-brief"
                      onClick={close}
                      className="inline-flex items-center gap-1 hover:text-[#A45138] transition-colors"
                    >
                      <FiBriefcase size={12} />
                      <span>Brief</span>
                    </Link>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3E7] px-2.5 py-1 text-[11px] font-semibold text-[#1F5128] hover:bg-[#D9ECD9] transition-colors"
                  >
                    <FaWhatsapp size={13} className="text-[#25D366]" />
                    <span>WhatsApp Studio</span>
                    <FiArrowUpRight size={10} />
                  </a>
                </div>

                {/* Input Field Form */}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend();
                  }}
                  className="mt-2.5 flex items-end gap-1.5 rounded-2xl border border-[#D5E0E2] bg-[#F7F9F9] p-1.5 focus-within:border-[#10B6D7] focus-within:ring-2 focus-within:ring-[#10B6D7]/15 transition-all"
                >
                  {/* Textarea */}
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
                    className="min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm text-[#26363B] outline-none placeholder:text-[#607278]/70 max-h-28"
                    placeholder={
                      language === "bn"
                        ? "আপনার ভাবনা বা প্রশ্ন লিখুন…"
                        : "Ask anything about your space or budget…"
                    }
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!ready || isSending || !input.trim()}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#087F98] text-white shadow-xs hover:bg-[#066D83] active:scale-95 disabled:opacity-30 disabled:hover:bg-[#087F98] transition-all"
                  >
                    <FiSend size={15} />
                  </button>
                </form>

                {/* Footer Micro-info */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#5A6057]/70 px-1">
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
                    <span>•</span>
                    <Link href="/privacy" onClick={close} className="hover:underline">
                      Privacy
                    </Link>
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
