"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiArrowUpRight, FiBookmark, FiCheck } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface SwatchItem {
  id: string;
  name: string;
  role: string;
  hex: string;
  finish: string;
}

interface PaletteMood {
  id: "warm-minimal" | "natural-modern" | "quiet-classic";
  name: string;
  subtitle: string;
  headline: string;
  description: string;
  heroImage: string;
  imageAlt: string;
  swatches: SwatchItem[];
}

const PALETTES: PaletteMood[] = [
  {
    id: "warm-minimal",
    name: "Warm Minimal",
    subtitle: "Soft light. Natural warmth.",
    headline: "A little less. A little warmer.",
    description:
      "Light stone, warm timber and soft linen. An easy, sunlit palette for spaces that feel calm from the moment you step inside.",
    heroImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85",
    imageAlt: "Bright living room with warm neutral furnishings and natural textures",
    swatches: [
      { id: "wm-limestone", name: "Limestone", role: "Floors & surfaces", hex: "#DDD5C8", finish: "Soft, honed stone" },
      { id: "wm-teak", name: "Warm teak", role: "Cabinetry & furniture", hex: "#C5A880", finish: "Natural timber grain" },
      { id: "wm-linen", name: "Soft linen", role: "Curtains & upholstery", hex: "#EAE3D5", finish: "An airy, textured weave" },
      { id: "wm-brass", name: "Brushed brass", role: "Handles & lighting", hex: "#C8A86B", finish: "A muted metallic accent" },
      { id: "wm-travertine", name: "Travertine", role: "Tables & feature surfaces", hex: "#E2D9C8", finish: "Quiet, natural variation" },
    ],
  },
  {
    id: "natural-modern",
    name: "Natural Modern",
    subtitle: "Clean lines. Earthy textures.",
    headline: "Rooted in nature. Made for today.",
    description:
      "Deep timber, cool mineral tones and a touch of jute. For a home with clean lines, inviting textures and room to breathe.",
    heroImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85",
    imageAlt: "Contemporary living space with sculptural furniture and natural materials",
    swatches: [
      { id: "nm-oak", name: "Smoked oak", role: "Wall panels & cabinetry", hex: "#4B3E35", finish: "Rich, visible timber grain" },
      { id: "nm-glass", name: "Reeded glass", role: "Screens & partitions", hex: "#98A39C", finish: "Light with a little privacy" },
      { id: "nm-concrete", name: "Soft concrete", role: "Walls & work surfaces", hex: "#9E9A92", finish: "A smooth mineral texture" },
      { id: "nm-jute", name: "Natural jute", role: "Rugs & woven accents", hex: "#A89276", finish: "Tactile, golden fibres" },
      { id: "nm-steel", name: "Blackened steel", role: "Frames & small details", hex: "#242622", finish: "A crisp, matte accent" },
    ],
  },
  {
    id: "quiet-classic",
    name: "Quiet Classic",
    subtitle: "Rich materials. Lasting character.",
    headline: "Familiar comforts, beautifully refined.",
    description:
      "Walnut, pale marble and olive accents. A layered palette that brings a sense of character and comfort to everyday living.",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85",
    imageAlt: "Light-filled home with warm wood details and a connection to the garden",
    swatches: [
      { id: "qc-walnut", name: "Deep walnut", role: "Cabinetry & shelving", hex: "#3E2D23", finish: "Rich, warm timber" },
      { id: "qc-marble", name: "Pale marble", role: "Counters & feature surfaces", hex: "#F0EDE6", finish: "Delicate natural veining" },
      { id: "qc-boucle", name: "Cream bouclé", role: "Armchairs & headboards", hex: "#E4DFD5", finish: "A soft, looped texture" },
      { id: "qc-bronze", name: "Aged bronze", role: "Lighting & hardware", hex: "#5E5243", finish: "A warm, muted patina" },
      { id: "qc-olive", name: "Olive velvet", role: "Cushions & curtains", hex: "#575E4A", finish: "Soft colour with gentle depth" },
    ],
  },
];

export function MaterialMoodSelector() {
  const [activePaletteId, setActivePaletteId] = useState<PaletteMood["id"]>("warm-minimal");
  const [selectedSwatchId, setSelectedSwatchId] = useState<string | null>(null);
  const { toggleItem, hasItem, addItem, removeItem } = useSpaceCollection();

  const current = PALETTES.find((palette) => palette.id === activePaletteId) || PALETTES[0];
  const activeSwatch = current.swatches.find((swatch) => swatch.id === selectedSwatchId) || current.swatches[0];
  const isPaletteSaved = current.swatches.every((swatch) => hasItem(swatch.id));
  const isSwatchSaved = hasItem(activeSwatch.id);

  const collectionItem = (swatch: SwatchItem) => ({
    id: swatch.id,
    type: "material" as const,
    title: swatch.name,
    subtitle: `${current.name} • ${swatch.role}`,
    hex: swatch.hex,
    notes: `${swatch.finish}. Material palette inspiration.`,
  });

  const togglePalette = () => {
    current.swatches.forEach((swatch) => {
      if (isPaletteSaved) removeItem(swatch.id);
      else addItem(collectionItem(swatch));
    });
  };

  return (
    <section id="materials" aria-labelledby="material-mood-heading" className="scroll-mt-24 bg-[#F4F0E8] py-20 sm:py-24 lg:py-28">
      <div className="container">
        <div className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-11">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#727A61]">
              Find your feeling
            </p>
            <h2 id="material-mood-heading" className="font-serif text-4xl font-normal leading-[1.1] tracking-tight text-[#242622] sm:text-5xl lg:text-6xl">
              Every space starts<br className="hidden sm:block" /> with a feeling.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-7 text-[#5A6057] md:pb-1">
            Explore three directions. Pick the colours and textures you love, and save them to your collection.
          </p>
        </div>

        <div role="group" aria-label="Choose a material mood" className="mb-7 flex flex-wrap gap-2">
          {PALETTES.map((palette, index) => {
            const isActive = palette.id === activePaletteId;
            return (
              <button
                key={palette.id}
                type="button"
                aria-pressed={isActive}
                aria-controls="material-mood-content"
                onClick={() => {
                  setActivePaletteId(palette.id);
                  setSelectedSwatchId(null);
                }}
                className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#575E4A] sm:px-5 sm:text-sm ${
                  isActive
                    ? "border-[#575E4A] bg-[#575E4A] text-white"
                    : "border-[#D4D0C5] bg-transparent text-[#5A6057] hover:border-[#575E4A] hover:bg-[#EAE3D5]"
                }`}
              >
                <span aria-hidden="true" className={isActive ? "text-white/65" : "text-[#727A61]"}>0{index + 1}</span>
                {palette.name}
              </button>
            );
          })}
        </div>

        <div id="material-mood-content" className="grid overflow-hidden rounded-2xl border border-[#DDD5C8] lg:grid-cols-[1.2fr_1fr]">
          <figure className="relative min-h-[340px] bg-[#DDD5C8] sm:min-h-[430px] lg:min-h-[570px]">
            <Image
              src={current.heroImage}
              alt={current.imageAlt}
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 text-white sm:p-8">
              <div>
                <span className="block text-xs uppercase tracking-[0.18em] text-white/80">The mood</span>
                <span className="mt-1 block font-serif text-3xl">{current.name}</span>
              </div>
              <span className="text-xs leading-5 text-white/85">Stock photography<br />Mood inspiration</span>
            </figcaption>
          </figure>

          <div className="flex flex-col bg-[#EEF0E9] p-6 sm:p-9 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#575E4A]">{current.subtitle}</p>
            <h3 className="mt-4 max-w-sm font-serif text-3xl font-normal leading-[1.15] text-[#242622] sm:text-4xl">
              {current.headline}
            </h3>
            <p className="mt-4 text-base leading-7 text-[#5A6057]">{current.description}</p>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-[#5A6057]">
                <span>Touch of texture</span>
                <span>Select a swatch</span>
              </div>
              <div role="group" aria-label={`${current.name} material swatches`} className="grid grid-cols-5 gap-2 sm:gap-3">
                {current.swatches.map((swatch) => {
                  const isSelected = activeSwatch.id === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={`${swatch.name}${hasItem(swatch.id) ? ", saved to collection" : ""}`}
                      aria-pressed={isSelected}
                      aria-controls="selected-material-detail"
                      onClick={() => setSelectedSwatchId(swatch.id)}
                      title={swatch.name}
                      className={`relative h-16 rounded-lg border border-black/10 transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#575E4A] sm:h-[72px] ${
                        isSelected ? "ring-1 ring-[#575E4A] ring-offset-[3px] ring-offset-[#EEF0E9]" : "hover:ring-1 hover:ring-[#9EA58F] hover:ring-offset-2 hover:ring-offset-[#EEF0E9]"
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && <FiCheck aria-hidden="true" className="absolute bottom-2 right-2 rounded-full bg-[#FAF7F2] p-1 text-[#242622]" size={22} />}
                    </button>
                  );
                })}
              </div>

              <div id="selected-material-detail" className="mt-5 flex min-h-[76px] items-start justify-between gap-3 border-b border-[#D0D6C7] pb-5">
                <div aria-live="polite" aria-atomic="true">
                  <p className="text-sm font-semibold text-[#242622]">{activeSwatch.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[#5A6057]">{activeSwatch.role} · {activeSwatch.finish}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleItem(collectionItem(activeSwatch))}
                  aria-pressed={isSwatchSaved}
                  aria-label={`${isSwatchSaved ? "Remove" : "Save"} ${activeSwatch.name} ${isSwatchSaved ? "from" : "to"} collection`}
                  title={isSwatchSaved ? "Remove material from collection" : "Save this material"}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#575E4A] ${
                    isSwatchSaved ? "border-[#575E4A] bg-[#575E4A] text-white" : "border-[#C9CDBF] text-[#575E4A] hover:bg-white/60"
                  }`}
                >
                  {isSwatchSaved ? <FiCheck aria-hidden="true" size={17} /> : <FiBookmark aria-hidden="true" size={17} />}
                </button>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={togglePalette}
                aria-pressed={isPaletteSaved}
                aria-label={`${isPaletteSaved ? "Remove" : "Save"} ${current.name} palette ${isPaletteSaved ? "from" : "to"} collection`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#575E4A] px-5 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#414837] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#575E4A]"
              >
                {isPaletteSaved ? <FiCheck aria-hidden="true" size={16} /> : <FiBookmark aria-hidden="true" size={16} />}
                {isPaletteSaved ? "Palette saved to your collection" : "Save this palette"}
              </button>
              <Link href="/design-brief" className="mt-4 flex min-h-11 items-center justify-center gap-2 text-xs font-medium text-[#575E4A] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#575E4A]">
                Make it part of your design brief <FiArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
