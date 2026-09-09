"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiArrowRight, FiCheckCircle, FiClock, FiCompass, FiMaximize } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface EntryPointOption {
  id: "entire-home" | "one-room" | "renovation";
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
  typicalArea: string;
  duration: string;
  deliverables: string[];
  recommendedBudget: string;
  description: string;
  featuredProjects: {
    title: string;
    location: string;
    slug: string;
    image: string;
    scope: string;
  }[];
}

const ENTRY_POINTS: EntryPointOption[] = [
  {
    id: "entire-home",
    title: "An Entire Home",
    subtitle: "Complete Interior Architecture",
    tagline: "Turnkey spatial transformation from bare concrete to lived-in sanctuary.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
    typicalArea: "2,400 – 6,500 sq.ft",
    duration: "90 – 120 Days",
    recommendedBudget: "Tier 1 Bespoke Turnkey",
    description:
      "A holistic architectural undertaking where every room, hallway, lighting circuit, and bespoke joinery unit is designed in cohesive harmony. Ideal for new apartments or villas.",
    deliverables: [
      "Master layout plan & 3D virtual walkthroughs",
      "Full MEP, smart lighting & acoustic schedule",
      "Custom kitchen, bedroom joinery & vanity suites",
      "Dedicated resident site engineer & 10-year warranty",
    ],
    featuredProjects: [
      {
        title: "Gulshan Penthouse Residence",
        location: "Gulshan II, Dhaka",
        slug: "open-living-space",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
        scope: "4,200 sq.ft • 4 Bedrooms",
      },
      {
        title: "Baridhara Contemporary Haven",
        location: "Baridhara DOHS",
        slug: "luxury-bedroom-sanctuary",
        image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
        scope: "3,100 sq.ft • Turnkey",
      },
    ],
  },
  {
    id: "one-room",
    title: "One Room",
    subtitle: "Targeted Room Sanctuary",
    tagline: "Focused craftsmanship for your kitchen, master bedroom, or living pavilion.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
    typicalArea: "250 – 800 sq.ft",
    duration: "25 – 45 Days",
    recommendedBudget: "Targeted High-Impact",
    description:
      "Transforming a single defining room without disrupting the rest of your home. We specialize in modular gourmet kitchens, serene master suites, and acoustic media lounges.",
    deliverables: [
      "Precise spatial ergonomics & cabinetry blueprint",
      "Integrated appliance & architectural lighting plan",
      "Premium hardware, natural quartz/stone & veneers",
      "Fast-track artisan carpentry with minimal site dust",
    ],
    featuredProjects: [
      {
        title: "Minimalist Teak Culinary Studio",
        location: "Banani, Dhaka",
        slug: "modern-kitchen-renovation",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
        scope: "Chef’s Kitchen & Breakfast Bar",
      },
      {
        title: "Serene Master Bedroom Suite",
        location: "Dhanmondi, Dhaka",
        slug: "luxury-bedroom-sanctuary",
        image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
        scope: "Bedroom & Walk-in Wardrobe",
      },
    ],
  },
  {
    id: "renovation",
    title: "A Renovation",
    subtitle: "Structural & Aesthetic Remodeling",
    tagline: "Reclaiming dated layouts into expansive, light-filled modern living.",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
    typicalArea: "1,500 – 4,000 sq.ft",
    duration: "60 – 90 Days",
    recommendedBudget: "Full Architectural Remodel",
    description:
      "Modernizing an existing older apartment or building in Dhaka. We remove confining partition walls, replace obsolete plumbing and wiring, and install clean architectural finishes.",
    deliverables: [
      "Structural feasibility & partition wall modifications",
      "Electrical & plumbing system modernization",
      "Acoustic ceiling drops & hidden air-conditioning",
      "Flawless surface restorations and marble floor polish",
    ],
    featuredProjects: [
      {
        title: "Dhanmondi 1990s Apartment Remodel",
        location: "Dhanmondi Rd 7A",
        slug: "open-living-space",
        image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
        scope: "Full Wall Demolition & Open Plan",
      },
      {
        title: "Gulshan Classic Spa Bathroom Remodel",
        location: "Gulshan I",
        slug: "boutique-bathroom-design",
        image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
        scope: "Italian Marble & Concealed Plumbing",
      },
    ],
  },
];

export function ChooseStartingPoint() {
  const [selectedId, setSelectedId] = useState<"entire-home" | "one-room" | "renovation">("entire-home");
  const { toggleItem, hasItem } = useSpaceCollection();

  const current = ENTRY_POINTS.find((p) => p.id === selectedId) || ENTRY_POINTS[0];

  return (
    <section className="section bg-[#F4F0E8] relative">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>Tailored Entry Points</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Choose Your Starting Point
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            Whether you are taking handover of a brand-new apartment or reimagining a single cherished room, select your scope below to view our process and relevant case studies.
          </p>
        </div>

        {/* 3 Entry Point Cards */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-7">
          {ENTRY_POINTS.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`group cursor-pointer text-left transition-all duration-300 relative rounded-xl overflow-hidden border ${
                  isSelected
                    ? "border-[#A45138] ring-2 ring-[#A45138]/20 bg-[#FAF7F2] shadow-xl translate-y-[-4px]"
                    : "border-[#DDD5C8] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] hover:border-[#727A61] shadow-sm"
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(item.id);
                  }
                }}
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#DDD5C8]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={`object-cover transition-transform duration-700 ease-out ${
                      isSelected ? "scale-105" : "group-hover:scale-103 opacity-90"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/70 via-transparent to-transparent" />

                  {/* Active Indicator Chip */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`architectural-tag px-2.5 py-1 rounded text-[10px] ${
                        isSelected
                          ? "bg-[#A45138] text-white"
                          : "bg-[#242622]/80 text-[#FAF7F2] backdrop-blur-md"
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>

                  {/* Selection Radio Dot */}
                  <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-[#242622]/60 backdrop-blur-sm">
                    {isSelected && <span className="w-3 h-3 rounded-full bg-[#A45138]" />}
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card Summary */}
                <div className="p-5 sm:p-6 space-y-3">
                  <p className="text-xs sm:text-sm text-[#5A6057] leading-relaxed">
                    {item.tagline}
                  </p>

                  <div className="pt-3 border-t border-[#DDD5C8]/70 flex items-center justify-between text-xs text-[#727A61] font-medium">
                    <span className="flex items-center gap-1.5">
                      <FiClock size={13} /> {item.duration}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <FiMaximize size={13} /> {item.typicalArea}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revealed Detailed Panel for Selected Starting Point */}
        <div className="mt-10 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C8] p-6 sm:p-10 shadow-lg animate-fade-in">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Scope & Deliverables */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A45138] mb-1">
                  <span>Scope Blueprint</span>
                  <span>•</span>
                  <span>{current.subtitle}</span>
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242622]">
                  How We Approach: {current.title}
                </h4>
                <p className="text-sm sm:text-base text-[#5A6057] leading-relaxed mt-2">
                  {current.description}
                </p>
              </div>

              {/* Concrete Deliverables */}
              <div>
                <h5 className="architectural-tag text-[#727A61] mb-3">Concrete Deliverables</h5>
                <div className="grid sm:grid-cols-2 gap-3">
                  {current.deliverables.map((deliv, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F4F0E8] border border-[#DDD5C8]/70 text-xs text-[#242622]"
                    >
                      <FiCheckCircle className="text-[#727A61] shrink-0 mt-0.5" size={15} />
                      <span className="leading-snug">{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Row */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/design-brief?scope=${current.id}`}
                  className="btn btn-clay text-sm px-6 py-3"
                >
                  <FiCompass size={15} />
                  <span>Plan My {current.title}</span>
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-secondary text-sm px-6 py-3"
                >
                  <span>Book Studio Consultation</span>
                </Link>
              </div>
            </div>

            {/* Right Matching Case Studies */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="architectural-tag text-[#727A61]">Matching Completed Work</h5>
                <Link
                  href="/portfolio"
                  className="text-xs text-[#A45138] hover:underline font-semibold flex items-center gap-1"
                >
                  View all <FiArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {current.featuredProjects.map((p) => (
                  <div
                    key={p.slug}
                    className="p-3.5 rounded-xl bg-[#F4F0E8] border border-[#DDD5C8] flex items-center gap-4 hover:border-[#727A61] transition-all group"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#DDD5C8]">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-[#727A61] block mb-0.5">
                        {p.scope}
                      </span>
                      <h6 className="font-serif text-base font-semibold text-[#242622] group-hover:text-[#A45138] transition-colors truncate">
                        {p.title}
                      </h6>
                      <p className="text-xs text-[#5A6057]">{p.location}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Link
                          href={`/portfolio/${p.slug}`}
                          className="text-xs text-[#242622] font-semibold underline underline-offset-2 hover:text-[#A45138]"
                        >
                          Explore Space
                        </Link>
                        <span className="text-neutral-300">•</span>
                        <button
                          onClick={() =>
                            toggleItem({
                              id: `entry-${p.slug}`,
                              type: "project",
                              title: p.title,
                              subtitle: p.location,
                              image: p.image,
                              notes: p.scope,
                            })
                          }
                          className="text-xs text-[#727A61] hover:text-[#A45138] font-medium"
                        >
                          {hasItem(`entry-${p.slug}`) ? "✓ Saved" : "+ Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
