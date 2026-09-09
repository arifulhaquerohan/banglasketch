"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FiArrowRight, FiBookmark, FiCheck } from "react-icons/fi";
import { InteractiveHotspotLayer, HotspotItem } from "./InteractiveHotspot";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface EditorialProject {
  id: string;
  slug: string;
  number: string;
  title: string;
  location: string;
  year: string;
  area: string;
  scope: string;
  challenge: string;
  resolution: string;
  heroImage: {
    src: string;
    alt: string;
    caption: string;
    hotspots: HotspotItem[];
  };
  tallCrop: {
    src: string;
    alt: string;
    caption: string;
  };
  materialDetail: {
    src: string;
    alt: string;
    caption: string;
    materialName: string;
  };
}

const EDITORIAL_PROJECTS: EditorialProject[] = [
  {
    id: "proj-gulshan-pavilion",
    slug: "open-living-space",
    number: "01",
    title: "The Courtyard Pavilion",
    location: "Gulshan II, Dhaka",
    year: "2026",
    area: "4,400 sq.ft",
    scope: "Turnkey Architecture & Interior Landscape",
    challenge:
      "A deep, narrow floorplate starved the core family room of daylight, while heavy concrete columns visually fragmented the main entertaining area.",
    resolution:
      "We framed structural columns in tactile fluted teak and introduced a 14-foot reflective limestone axis that draws natural morning daylight 40 feet deep into the residence.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=85",
      alt: "Open-plan living pavilion with travertine plinth and fluted teak wall",
      caption: "Main Living Pavilion • Expansive conversation zone framed in warm limestone and natural teak",
      hotspots: [
        {
          id: "cp-1",
          x: 25,
          y: 35,
          title: "Reflective Daylight Plenum",
          category: "Daylight",
          description: "Low-sheen Italian limestone floor bounces diffuse daylight toward the inner dining quarters.",
          spec: "Honed Roman Travertine • 800x800mm seamless joint",
        },
        {
          id: "cp-2",
          x: 75,
          y: 40,
          title: "Acoustic Fluted Teak Column Encasement",
          category: "Circulation",
          description: "Structural load columns transformed into warm tactile dividers concealing audio wiring and indirect vertical LED washes.",
          spec: "Hand-routed solid teak battens with acoustic felt backing",
        },
      ],
    },
    tallCrop: {
      src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=85",
      alt: "Vertical crop of the high ceiling dining gallery",
      caption: "Dining Gallery & Screen",
    },
    materialDetail: {
      src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
      alt: "Detail of brushed brass shadowline and natural ash veneer",
      caption: "Precision 6mm recessed brass shadowline between wall panel and stone skirting",
      materialName: "Brushed Aged Brass & Ash",
    },
  },
  {
    id: "proj-baridhara-sanctuary",
    slug: "luxury-bedroom-sanctuary",
    number: "02",
    title: "The Riverine Sanctuary",
    location: "Baridhara DOHS, Dhaka",
    year: "2026",
    area: "3,200 sq.ft",
    scope: "Penthouse Suite & Private Library",
    challenge:
      "The client required absolute acoustic seclusion for reading and restful sleep, despite the apartment overlooking a vibrant arterial thoroughfare.",
    resolution:
      "We engineered continuous acoustic wall paneling wrapped in Belgian linen, concealed sliding pocket doors, and double-glazed low-emissivity glass to drop ambient sound by 34 dB.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85",
      alt: "Master bedroom suite with upholstered headboard and bespoke lighting",
      caption: "Master Suite • Acoustic tranquility achieved through soft textiles and recessed warm 2700K lighting",
      hotspots: [
        {
          id: "bs-1",
          x: 45,
          y: 48,
          title: "Floating Upholstered Headboard Plinth",
          category: "Comfort",
          description: "Wall-to-wall acoustic bouclé paneling with integrated brass touch switches and indirect nocturnal amber uplighting.",
          spec: "Kvadrat wool-linen blend • Concealed fire-retardant foam core",
        },
        {
          id: "bs-2",
          x: 82,
          y: 30,
          title: "Full-Height Smoked Oak Pocket Screen",
          category: "Storage",
          description: "Glide system enables master bath and walk-in wardrobe to vanish completely into the wall.",
          spec: "Hafele EKU soft-close flush track system",
        },
      ],
    },
    tallCrop: {
      src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=85",
      alt: "Tall architectural crop of the private library alcove",
      caption: "Library Reading Alcove",
    },
    materialDetail: {
      src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      alt: "Detail of tactile bouclé fabric and dark walnut joinery",
      caption: "Bespoke smoked walnut millwork paired with tactile woven bouclé",
      materialName: "Smoked Walnut & Bouclé",
    },
  },
  {
    id: "proj-culinary-minimal",
    slug: "modern-kitchen-renovation",
    number: "03",
    title: "The Sculpted Culinary Studio",
    location: "Banani, Dhaka",
    year: "2026",
    area: "650 sq.ft",
    scope: "Gourmet Chef Kitchen & Breakfast Island",
    challenge:
      "Balancing high-heat Bengali wok cooking with the open-concept social desire for family gatherings without oil mist migrating to living spaces.",
    resolution:
      "We engineered a dual-zone architectural kitchen: an invisible heavy-prep wet zone behind fluted smoked glass, and a sculptural social dry island in quartzite stone.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85",
      alt: "Sculptural kitchen island with quartzite waterfall counter and brass taps",
      caption: "Culinary Studio • Monolithic quartzite island acting as the social centerpiece of the residence",
      hotspots: [
        {
          id: "ck-1",
          x: 48,
          y: 55,
          title: "Taj Mahal Quartzite Waterfall",
          category: "Material",
          description: "Non-porous, stain-resistant natural quartzite selected specifically to withstand turmeric, citrus, and high culinary demands.",
          spec: "30mm Honed Brazilian Taj Mahal Quartzite with bookmatched mitred aprons",
        },
        {
          id: "ck-2",
          x: 85,
          y: 35,
          title: "Concealed Induction Downdraft",
          category: "Storage",
          description: "Motorized 1,200 m³/hr extraction rises directly from the counter surface, keeping overhead ceiling vistas entirely unobstructed.",
          spec: "Bora Professional 3.0 Integrated Extraction System",
        },
      ],
    },
    tallCrop: {
      src: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=85",
      alt: "Tall crop of the pantry joinery and breakfast coffee bar",
      caption: "Breakfast Bar & Concealed Pantry",
    },
    materialDetail: {
      src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
      alt: "Detail of fluted smoked glass and matte bronze profile",
      caption: "Fluted smoked glass partition providing acoustic division without sacrificing light",
      materialName: "Fluted Glass & Matte Bronze",
    },
  },
];

export function EditorialSelectedSpaces() {
  const { toggleItem, hasItem } = useSpaceCollection();

  return (
    <section className="section bg-[#FAF7F2] border-b border-[#DDD5C8]">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>Curated Portfolio</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Selected Spaces
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            An editorial study of recent interior architectural handovers. Each project represents a unique spatial equation resolved through craftsmanship, authentic materials, and quiet restraint.
          </p>
        </div>

        {/* Editorial Project Compositions */}
        <div className="space-y-28 lg:space-y-36">
          {EDITORIAL_PROJECTS.map((project) => {
            const isSaved = hasItem(project.id);
            return (
              <article key={project.id} className="relative">
                {/* Architectural Project Header Annotation */}
                <div className="border-t border-[#242622] pt-4 pb-8 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-[#727A61] font-bold">
                      PROJ {project.number}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#242622]">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#5A6057]">
                    <span>
                      <strong className="text-[#242622]">Location:</strong> {project.location}
                    </span>
                    <span className="hidden sm:inline text-[#DDD5C8]">|</span>
                    <span>
                      <strong className="text-[#242622]">Area:</strong> {project.area}
                    </span>
                    <span className="hidden sm:inline text-[#DDD5C8]">|</span>
                    <span>
                      <strong className="text-[#242622]">Scope:</strong> {project.scope}
                    </span>
                    <button
                      onClick={() =>
                        toggleItem({
                          id: project.id,
                          type: "project",
                          title: project.title,
                          subtitle: `${project.location} • ${project.area}`,
                          image: project.heroImage.src,
                          notes: project.scope,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        isSaved
                          ? "bg-[#A45138] text-white border-[#A45138]"
                          : "bg-[#FAF7F2] text-[#242622] border-[#DDD5C8] hover:border-[#727A61]"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <FiCheck size={13} /> Saved to Collection
                        </>
                      ) : (
                        <>
                          <FiBookmark size={13} /> Save Project
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Editorial 3-Image Composition: 1 Large Hero, 1 Tall Crop, 1 Material Detail */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Hero Image (Col 8) */}
                  <div className="lg:col-span-8 flex flex-col justify-between">
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[15/10] rounded-xl overflow-hidden border border-[#DDD5C8] shadow-md bg-[#DDD5C8] group">
                      <Image
                        src={project.heroImage.src}
                        alt={project.heroImage.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                      />

                      {/* Hotspots layer */}
                      <InteractiveHotspotLayer
                        hotspots={project.heroImage.hotspots}
                        projectName={project.title}
                        showToggle={true}
                      />

                      <div className="absolute bottom-3 left-4 right-4 text-xs text-white/90 bg-[#242622]/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 hidden sm:block">
                        {project.heroImage.caption}
                      </div>
                    </div>

                    {/* Challenge & Resolution Narrative */}
                    <div className="mt-6 pt-5 border-t border-[#DDD5C8] grid sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                      <div>
                        <span className="architectural-tag text-[#A45138] block mb-1">
                          Design Challenge
                        </span>
                        <p className="text-[#5A6057] leading-relaxed">{project.challenge}</p>
                      </div>
                      <div>
                        <span className="architectural-tag text-[#727A61] block mb-1">
                          Architectural Resolution
                        </span>
                        <p className="text-[#242622] leading-relaxed font-medium">
                          {project.resolution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Tall Crop & Material Detail (Col 4) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Tall Crop */}
                    <div className="relative aspect-[4/5] sm:aspect-[3/4] rounded-xl overflow-hidden border border-[#DDD5C8] bg-[#DDD5C8] group">
                      <Image
                        src={project.tallCrop.src}
                        alt={project.tallCrop.alt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white bg-[#242622]/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-white/10">
                        {project.tallCrop.caption}
                      </div>
                    </div>

                    {/* Material Detail */}
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#DDD5C8] bg-[#DDD5C8] group">
                      <Image
                        src={project.materialDetail.src}
                        alt={project.materialDetail.alt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="architectural-tag text-[#DDD5C8] block text-[9px]">
                          Material Joinery
                        </span>
                        <p className="text-xs font-semibold">{project.materialDetail.materialName}</p>
                      </div>
                    </div>

                    {/* Link to Detailed Project Page */}
                    <div className="pt-2">
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="w-full btn btn-secondary text-xs py-3 flex items-center justify-between group"
                      >
                        <span>Explore Full Case Study</span>
                        <FiArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Portfolio Gallery Link */}
        <div className="text-center mt-20 pt-10 border-t border-[#DDD5C8]">
          <Link href="/portfolio" className="btn btn-clay text-sm px-8 py-3.5 shadow-md">
            <span>View All Architectural Projects</span>
            <FiArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
