"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { FiArrowRight, FiLayers, FiSliders } from "react-icons/fi";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { InteractiveHotspotLayer, HotspotItem } from "./InteractiveHotspot";
import { BEFORE_AFTER_SLIDES } from "../lib/constants";

const BLUEPRINT_HOTSPOTS: HotspotItem[] = [
  {
    id: "lb-storage",
    x: 78,
    y: 42,
    title: "Flush Teak Joinery & Concealed AC",
    category: "Storage",
    description: "HVAC plenums and media gear are hidden behind acoustic fluted panels, keeping clean horizontal sightlines.",
    spec: "Burmese Teak Veneer • Matte PU finish 5% sheen",
  },
  {
    id: "lb-daylight",
    x: 28,
    y: 28,
    title: "Filtered Tropical Daylighting",
    category: "Daylight",
    description: "Floor-to-ceiling Belgian sheer drops temper harsh southwestern Dhaka sun into soft, ambient illumination.",
    spec: "100% Linen Sheer • Recessed motorized dual-track",
  },
  {
    id: "lb-circulation",
    x: 52,
    y: 65,
    title: "Unobstructed Flow Corridor",
    category: "Circulation",
    description: "A 4-foot unencumbered pathway connects entry gallery to the verandah garden without cutting through conversation seating.",
    spec: "Minimal travertine perimeter transition",
  },
];

export function TheLivingBlueprint() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging && e.buttons !== 1) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  return (
    <section className="section bg-[#FAF7F2] border-y border-[#DDD5C8] relative overflow-hidden">
      {/* Background Architectural Blueprint Grid */}
      <div className="absolute inset-0 blueprint-grid opacity-60 pointer-events-none" />

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#727A61]" />
            <span>The Signature Transformation</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            From Architectural Blueprint to Living Sanctuary
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3.5 leading-relaxed">
            Every sanctuary begins with rigorous spatial mathematics. Drag the cursor across to see how structural lines, joinery clearances, and daylight corridors materialize into a warm, finished home.
          </p>
        </div>

        {/* 1. THE LIVING BLUEPRINT INTERACTIVE REVEAL */}
        <div className="relative rounded-2xl overflow-hidden border border-[#DDD5C8] shadow-2xl bg-[#242622] select-none">
          {/* Blueprint Annotation Bar */}
          <div className="bg-[#242622] border-b border-white/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#DDD5C8] gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <FiLayers className="text-[#A45138]" /> DWG 01: MAIN LIVING PAVILION
              </span>
              <span className="hidden sm:inline text-white/40">|</span>
              <span className="hidden sm:inline">SCALE 1:50 @ A1</span>
              <span className="hidden sm:inline text-white/40">|</span>
              <span className="hidden md:inline">PROJECT: GULSHAN RESIDENCE</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSliderPos(0)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sliderPos === 0 ? "bg-[#A45138] text-white" : "hover:text-white"
                }`}
              >
                Blueprint
              </button>
              <button
                onClick={() => setSliderPos(50)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sliderPos === 50 ? "bg-[#727A61] text-white" : "hover:text-white"
                }`}
              >
                Cross-Section 50%
              </button>
              <button
                onClick={() => setSliderPos(100)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sliderPos === 100 ? "bg-[#A45138] text-white" : "hover:text-white"
                }`}
              >
                Finished Home
              </button>
            </div>
          </div>

          {/* Dual Layer Container */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/10] cursor-ew-resize overflow-hidden"
          >
            {/* UNDER LAYER: Architectural Blueprint SVG */}
            <div className="absolute inset-0 bg-[#171815] text-[#DDD5C8] flex items-center justify-center p-4">
              {/* Detailed Architectural Blueprint CAD Vector */}
              <svg
                viewBox="0 0 1000 600"
                className="w-full h-full stroke-current fill-none"
                style={{ strokeWidth: 1.5 }}
              >
                <defs>
                  {/* Hatch pattern for concrete columns */}
                  <pattern
                    id="columnHatch"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(221,213,200,0.3)" strokeWidth="1" />
                  </pattern>
                  {/* Grid pattern */}
                  <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(221, 213, 200, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#cadGrid)" />

                {/* Exterior Walls */}
                <rect
                  x="80"
                  y="60"
                  width="840"
                  height="480"
                  stroke="#DDD5C8"
                  strokeWidth="3.5"
                  fill="none"
                />
                <rect
                  x="92"
                  y="72"
                  width="816"
                  height="456"
                  stroke="#DDD5C8"
                  strokeWidth="1.5"
                  fill="none"
                />

                {/* Structural Columns */}
                <rect x="75" y="55" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />
                <rect x="490" y="55" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />
                <rect x="905" y="55" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />
                <rect x="75" y="525" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />
                <rect x="490" y="525" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />
                <rect x="905" y="525" width="22" height="22" fill="url(#columnHatch)" stroke="#DDD5C8" />

                {/* Glazing / North Windows (Top Wall) */}
                <line x1="200" y1="60" x2="420" y2="60" stroke="#727A61" strokeWidth="6" />
                <line x1="200" y1="72" x2="420" y2="72" stroke="#727A61" strokeWidth="2" />
                <text
                  x="310"
                  y="45"
                  textAnchor="middle"
                  fill="#727A61"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  WINDOW W-01 (LOW-E ACOUSTIC GLAZING • 2,200mm)
                </text>

                {/* Door Swing to Foyer (Bottom Wall) */}
                <path
                  d="M 280 528 A 120 120 0 0 0 400 408"
                  stroke="#DDD5C8"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <line x1="280" y1="528" x2="400" y2="528" stroke="#DDD5C8" strokeWidth="3" />
                <text x="340" y="555" fill="#DDD5C8" fontSize="10" fontFamily="monospace">
                  DOOR D-02 • 900mm CLEAR
                </text>

                {/* Built-in Custom Joinery Credenza / TV Wall (Right) */}
                <rect
                  x="820"
                  y="120"
                  width="70"
                  height="300"
                  stroke="#A45138"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <text
                  x="855"
                  y="275"
                  textAnchor="middle"
                  fill="#A45138"
                  fontSize="11"
                  fontFamily="monospace"
                  transform="rotate(-90 855 275)"
                >
                  CUSTOM FLUTED TEAK ACOUSTIC WALL
                </text>

                {/* L-Shaped Architectural Sectional Lounge */}
                <rect
                  x="200"
                  y="150"
                  width="360"
                  height="120"
                  rx="6"
                  stroke="#DDD5C8"
                  strokeWidth="2"
                />
                <rect
                  x="200"
                  y="270"
                  width="130"
                  height="180"
                  rx="6"
                  stroke="#DDD5C8"
                  strokeWidth="2"
                />
                {/* Cushions */}
                <line x1="320" y1="150" x2="320" y2="270" stroke="rgba(221,213,200,0.4)" />
                <line x1="440" y1="150" x2="440" y2="270" stroke="rgba(221,213,200,0.4)" />
                <line x1="200" y1="360" x2="330" y2="360" stroke="rgba(221,213,200,0.4)" />

                {/* Low Travertine Coffee Table */}
                <rect
                  x="380"
                  y="300"
                  width="180"
                  height="100"
                  rx="14"
                  stroke="#727A61"
                  strokeWidth="2"
                />
                <text
                  x="470"
                  y="355"
                  textAnchor="middle"
                  fill="#727A61"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  TRAVERTINE PLINTH TABLE
                </text>

                {/* Accent Lounge Armchairs */}
                <rect
                  x="600"
                  y="220"
                  width="90"
                  height="90"
                  rx="10"
                  stroke="#DDD5C8"
                  strokeWidth="1.5"
                />
                <rect
                  x="600"
                  y="340"
                  width="90"
                  height="90"
                  rx="10"
                  stroke="#DDD5C8"
                  strokeWidth="1.5"
                />

                {/* Dimensions Lines & Ticks */}
                <line x1="80" y1="575" x2="920" y2="575" stroke="#727A61" strokeWidth="1.5" />
                <line x1="80" y1="568" x2="80" y2="582" stroke="#727A61" strokeWidth="1.5" />
                <line x1="920" y1="568" x2="920" y2="582" stroke="#727A61" strokeWidth="1.5" />
                <text
                  x="500"
                  y="592"
                  textAnchor="middle"
                  fill="#727A61"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {`CLEAR SPAN: 7,460 mm [24'-6"]`}
                </text>

                {/* Room Identifier Label */}
                <g transform="translate(420, 100)">
                  <rect
                    x="0"
                    y="0"
                    width="180"
                    height="32"
                    fill="#242622"
                    stroke="#DDD5C8"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x="90"
                    y="21"
                    textAnchor="middle"
                    fill="#DDD5C8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    01 • LIVING SANCTUARY
                  </text>
                </g>

                {/* North Compass Arrow */}
                <g transform="translate(130, 110)">
                  <circle cx="20" cy="20" r="18" stroke="#DDD5C8" strokeWidth="1" />
                  <polygon points="20,6 25,20 20,16 15,20" fill="#A45138" stroke="none" />
                  <text
                    x="20"
                    y="32"
                    textAnchor="middle"
                    fill="#DDD5C8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    N
                  </text>
                </g>
              </svg>
            </div>

            {/* OVER LAYER: Photorealistic Completed Interior (Clipped by Slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="relative w-full h-full min-w-[320px]" style={{ width: "100%", height: "100%" }}>
                <Image
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1800&q=90"
                  alt="Completed living sanctuary interior with warm teak, travertine, and filtered daylight"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />

                {/* Warm ambient interior vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/40 via-transparent to-black/10 pointer-events-none" />

                {/* "Why This Works" Hotspots Layer over Finished Room */}
                <InteractiveHotspotLayer
                  hotspots={BLUEPRINT_HOTSPOTS}
                  projectName="Gulshan Living Sanctuary"
                  showToggle={false}
                />

                {/* Finished Space Badge */}
                <div className="absolute top-4 left-4 z-20 bg-[#242622]/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/15 text-white text-xs font-serif">
                  <span>Completed Sanctuary • Gulshan II</span>
                </div>
              </div>
            </div>

            {/* SLIDER DIVIDER BAR */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none flex items-center justify-center -translate-x-1/2"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-0.5 h-full bg-[#FAF7F2] shadow-2xl" />
              <div className="absolute w-9 h-9 rounded-full bg-[#FAF7F2] text-[#242622] border-2 border-[#A45138] shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize">
                <FiSliders size={15} className="text-[#A45138]" />
              </div>
            </div>
          </div>

          {/* Bottom Interactive Guidance */}
          <div className="bg-[#FAF7F2] border-t border-[#DDD5C8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6057]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A45138]" />
              <span>
                <strong className="text-[#242622]">Drag slider left or right</strong> to inspect structural blueprint vs executed craftsmanship.
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-[11px] font-mono text-[#727A61]">
                AREA: 3,400 SQ.FT • DURATION: 90 DAYS
              </span>
              <Link
                href="/portfolio/open-living-space"
                className="btn btn-secondary text-xs px-4 py-2"
              >
                <span>Read Full Case Study</span>
                <FiArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. ACCESSIBLE BEFORE & AFTER SLIDER */}
        <div className="mt-16 pt-14 border-t border-[#DDD5C8]">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="architectural-tag text-[#727A61]">Real Dhaka Residences</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242622] mt-1">
              Before & After Remodeling Slider
            </h3>
            <p className="text-sm text-[#5A6057] mt-2">
              Compare original site conditions against the finished spaces. Slide back and forth to examine cabinetry alignment, lighting depth, and spatial warmth.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <BeforeAfterSlider slides={BEFORE_AFTER_SLIDES} />
          </div>
        </div>
      </div>
    </section>
  );
}
