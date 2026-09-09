"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiBookmark, FiCheck } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface SwatchItem {
  id: string;
  name: string;
  role: string;
  hex: string;
  finish: string;
  origin: string;
}

interface PaletteMood {
  id: "warm-minimal" | "natural-modern" | "quiet-classic";
  name: string;
  subtitle: string;
  headline: string;
  description: string;
  heroImage: string;
  detailImage: string;
  swatches: SwatchItem[];
  matchingProjectSlug: string;
  matchingProjectTitle: string;
}

const PALETTES: PaletteMood[] = [
  {
    id: "warm-minimal",
    name: "Warm Minimal",
    subtitle: "Air, Limestone & Teak",
    headline: "Grounded in raw earthen warmth and meditative daylight.",
    description:
      "A quiet, sun-drenched palette that eliminates sensory noise. Honed limestone anchors the flooring, while bleached native teak and sheer Belgian linens invite gentle, diffused tropical light.",
    heroImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85",
    detailImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=85",
    matchingProjectSlug: "open-living-space",
    matchingProjectTitle: "Gulshan Courtyard Pavilion",
    swatches: [
      {
        id: "wm-limestone",
        name: "Honed Roman Limestone",
        role: "Primary Flooring & Plinths",
        hex: "#DDD5C8",
        finish: "Honed Matte 5%",
        origin: "Italy / Cut in Dhaka",
      },
      {
        id: "wm-teak",
        name: "Bleached Chittagong Teak",
        role: "Architectural Millwork",
        hex: "#C5A880",
        finish: "Natural Wax PU",
        origin: "Hill Tracts, Bangladesh",
      },
      {
        id: "wm-linen",
        name: "Unbleached Belgian Linen",
        role: "Sheer Drapes & Upholstery",
        hex: "#EAE3D5",
        finish: "Textured Natural Weave",
        origin: "Flanders, Belgium",
      },
      {
        id: "wm-brass",
        name: "Satin Brushed Brass",
        role: "Shadowlines & Hardware",
        hex: "#C8A86B",
        finish: "Brushed Unlacquered",
        origin: "Artisan Turned",
      },
      {
        id: "wm-travertine",
        name: "Navona Travertine",
        role: "Island & Coffee Plinths",
        hex: "#E2D9C8",
        finish: "Filled & Cross-Cut Honed",
        origin: "Tivoli, Italy",
      },
    ],
  },
  {
    id: "natural-modern",
    name: "Natural Modern",
    subtitle: "Smoked Oak, Glass & Raw Concrete",
    headline: "Graphic architectural discipline meets tactile Bangladeshi textures.",
    description:
      "Balancing crisp European joinery with authentic tactile grounding. Smoked quarter-cut oak creates deep rhythm against fluted glass partitions, balanced by hand-woven jute rugs and structural steel.",
    heroImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85",
    detailImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85",
    matchingProjectSlug: "modern-kitchen-renovation",
    matchingProjectTitle: "Banani Culinary Studio",
    swatches: [
      {
        id: "nm-oak",
        name: "Smoked Quarter-Cut Oak",
        role: "Full-Height Wall Paneling",
        hex: "#4B3E35",
        finish: "Deep Wire-Brushed Matte",
        origin: "Sustainably Sourced European Oak",
      },
      {
        id: "nm-glass",
        name: "Fluted Architectural Glass",
        role: "Acoustic Partition Screens",
        hex: "#98A39C",
        finish: "12mm Tempered Reeded",
        origin: "Saint-Gobain",
      },
      {
        id: "nm-concrete",
        name: "Micro-Topping Concrete",
        role: "Accent Walls & Floating Desks",
        hex: "#9E9A92",
        finish: "Hand-Troweled Mineral Seal",
        origin: "Custom Studio Blend",
      },
      {
        id: "nm-jute",
        name: "Bengali Golden Jute",
        role: "Tactile Area Rugs & Screens",
        hex: "#A89276",
        finish: "Braided Flat-Weave",
        origin: "Faridpur, Bangladesh",
      },
      {
        id: "nm-steel",
        name: "Blackened Structural Carbon",
        role: "Framing & Door Portals",
        hex: "#242622",
        finish: "Powder Coated Sand-Tex",
        origin: "Precision Laser Cut",
      },
    ],
  },
  {
    id: "quiet-classic",
    name: "Quiet Classic",
    subtitle: "Burled Walnut, Carrara & Aged Bronze",
    headline: "Timeless salon dignity reimagined for contemporary life.",
    description:
      "A rich, layered tactile experience celebrating heritage craftsmanship. Bookmatched Carrara marble countertops glow against deep walnut millwork, tactile bouclé upholstery, and patinated bronze fixtures.",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85",
    detailImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=85",
    matchingProjectSlug: "luxury-bedroom-sanctuary",
    matchingProjectTitle: "Baridhara Penthouse Sanctuary",
    swatches: [
      {
        id: "qc-walnut",
        name: "Burled American Walnut",
        role: "Bespoke Cabinetry & Library",
        hex: "#3E2D23",
        finish: "Hand-Rubbed Danish Oil",
        origin: "North American Walnut",
      },
      {
        id: "qc-marble",
        name: "Carrara Statuario Marble",
        role: "Countertops & Fireplace Surround",
        hex: "#F0EDE6",
        finish: "Bookmatched Leathered Finish",
        origin: "Carrara, Italy",
      },
      {
        id: "qc-boucle",
        name: "Tactile Bouclé Wool",
        role: "Armchairs & Headboard Plinths",
        hex: "#E4DFD5",
        finish: "High-Pile Loop Texture",
        origin: "Danish Textile Mill",
      },
      {
        id: "qc-bronze",
        name: "Aged Patinated Bronze",
        role: "Door Latches & Lighting Trim",
        hex: "#5E5243",
        finish: "Hand-Oxidized Living Finish",
        origin: "Cast Bronze Atelier",
      },
      {
        id: "qc-olive",
        name: "Muted Olive Mohair Velvet",
        role: "Accent Cushions & Drapes",
        hex: "#575E4A",
        finish: "Deep Luster Matte Velvet",
        origin: "Custom Dye",
      },
    ],
  },
];

export function MaterialMoodSelector() {
  const [activePaletteId, setActivePaletteId] = useState<PaletteMood["id"]>("warm-minimal");
  const [selectedSwatch, setSelectedSwatch] = useState<SwatchItem | null>(null);
  const { toggleItem, hasItem, addItem } = useSpaceCollection();

  const current = PALETTES.find((p) => p.id === activePaletteId) || PALETTES[0];
  const activeSwatch = selectedSwatch || current.swatches[0];

  const handleSaveWholePalette = () => {
    current.swatches.forEach((s) => {
      addItem({
        id: s.id,
        type: "material",
        title: s.name,
        subtitle: `${current.name} • ${s.role}`,
        hex: s.hex,
        notes: `${s.finish} | ${s.origin}`,
      });
    });
  };

  return (
    <section className="section bg-[#F4F0E8] relative">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#727A61]" />
            <span>Tactile Materiality</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Discover Your Material Mood
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            Interiors are felt as much as seen. Select a curated material palette below to experience how hand-selected stones, native timbers, and architectural metals establish the emotional temperature of your home.
          </p>
        </div>

        {/* 3 Palette Switcher Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 p-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C8] max-w-2xl mb-10">
          {PALETTES.map((palette) => {
            const isActive = palette.id === activePaletteId;
            return (
              <button
                key={palette.id}
                onClick={() => {
                  setActivePaletteId(palette.id);
                  setSelectedSwatch(null);
                }}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                  isActive
                    ? "bg-[#242622] text-[#FAF7F2] shadow-md"
                    : "text-[#5A6057] hover:text-[#242622] hover:bg-[#EAE3D5]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-base font-semibold">{palette.name}</span>
                  <div className="flex -space-x-1">
                    {palette.swatches.slice(0, 3).map((sw) => (
                      <span
                        key={sw.id}
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  className={`text-[10px] tracking-wider uppercase truncate ${
                    isActive ? "text-[#DDD5C8]" : "text-[#727A61]"
                  }`}
                >
                  {palette.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Mood Photography with Crossfade */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#DDD5C8] bg-[#DDD5C8] shadow-lg group">
              <Image
                key={current.heroImage}
                src={current.heroImage}
                alt={`${current.name} interior style`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-all duration-700 animate-fade-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/70 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-5 right-5 text-white z-10 flex items-end justify-between">
                <div>
                  <span className="architectural-tag text-[#DDD5C8] block text-[10px]">
                    Aesthetic Mood • {current.name}
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl font-medium mt-0.5">
                    {current.headline}
                  </h4>
                </div>
                <Link
                  href={`/portfolio/${current.matchingProjectSlug}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition-colors"
                >
                  <span>See Case Study</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Mood Statement & Narrative */}
            <div className="p-6 rounded-xl bg-[#FAF7F2] border border-[#DDD5C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xs sm:text-sm text-[#5A6057] leading-relaxed">
                  {current.description}
                </p>
              </div>
              <button
                onClick={handleSaveWholePalette}
                className="btn btn-clay text-xs px-4 py-2.5 shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <FiBookmark size={13} />
                <span>Save Mood to Collection</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tactile Swatches & Inspection */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]">
              <span className="architectural-tag text-[#727A61]">Material Curation Board</span>
              <span className="text-[11px] font-mono text-[#5A6057]">5 Key Specifications</span>
            </div>

            {/* Swatch List */}
            <div className="space-y-2.5">
              {current.swatches.map((swatch) => {
                const isFocused = activeSwatch.id === swatch.id;
                const isSaved = hasItem(swatch.id);
                return (
                  <div
                    key={swatch.id}
                    onClick={() => setSelectedSwatch(swatch)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isFocused
                        ? "bg-[#FAF7F2] border-[#A45138] ring-1 ring-[#A45138] shadow-md"
                        : "bg-[#FAF7F2]/70 border-[#DDD5C8] hover:bg-[#FAF7F2] hover:border-[#727A61]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Physical Swatch Pill */}
                      <span
                        className="w-8 h-8 rounded-lg border border-black/15 shadow-inner shrink-0"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <div className="min-w-0">
                        <div className="font-serif text-sm font-semibold text-[#242622] truncate">
                          {swatch.name}
                        </div>
                        <div className="text-[11px] text-[#727A61] truncate">{swatch.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-[#5A6057] hidden sm:inline">
                        {swatch.hex}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem({
                            id: swatch.id,
                            type: "material",
                            title: swatch.name,
                            subtitle: `${current.name} • ${swatch.role}`,
                            hex: swatch.hex,
                            notes: `${swatch.finish} | ${swatch.origin}`,
                          });
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isSaved
                            ? "bg-[#A45138] text-white"
                            : "text-[#5A6057] hover:text-[#A45138] hover:bg-[#EAE3D5]"
                        }`}
                        title={isSaved ? "Saved to collection" : "Save this material swatch"}
                      >
                        {isSaved ? <FiCheck size={14} /> : <FiBookmark size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Swatch Specimen Card */}
            <div className="p-4 rounded-xl bg-[#242622] text-[#FAF7F2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="architectural-tag text-[#DDD5C8]">Material Spec Sheet</span>
                <span
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: activeSwatch.hex }}
                />
              </div>

              <div>
                <h5 className="font-serif text-lg font-medium text-white">{activeSwatch.name}</h5>
                <p className="text-xs text-[#DDD5C8] font-mono mt-0.5">ROLE: {activeSwatch.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[#727A61] text-[10px] uppercase tracking-wider block">
                    Surface Finish
                  </span>
                  <span className="text-white font-medium">{activeSwatch.finish}</span>
                </div>
                <div>
                  <span className="text-[#727A61] text-[10px] uppercase tracking-wider block">
                    Origin & Fabrication
                  </span>
                  <span className="text-white font-medium">{activeSwatch.origin}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
