"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "../lib/api";
import { FiArrowRight, FiBookmark, FiCheck } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

const ENTRY_POINTS = [
  {
    id: "entire-home",
    title: "An entire home",
    subtitle: "Considered, room by room",
    heading: "A home that feels entirely yours.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
    imageAlt: "Warm contemporary living room with natural materials and sculptural furniture",
    typicalArea: "2,400–6,500 sq.ft",
    duration: "90–120 days",
    description:
      "From the first floor plan to the finishing touches, we bring every room together around the way you live.",
    deliverables: ["Space planning & 3D design", "Materials, lighting & custom furniture", "Construction & site supervision"],
  },
  {
    id: "one-room",
    title: "One special room",
    subtitle: "Small scope, meaningful change",
    heading: "Make your favourite room even better.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
    imageAlt: "Bright kitchen with thoughtfully arranged cabinetry and a central island",
    typicalArea: "250–800 sq.ft",
    duration: "25–45 days",
    description:
      "A kitchen made for gathering. A bedroom made for slowing down. Thoughtful design, focused on the room that matters to you.",
    deliverables: ["Room layout & 3D visualisation", "Custom cabinetry & material selection", "Lighting, installation & finishing"],
  },
  {
    id: "renovation",
    title: "A fresh beginning",
    subtitle: "Renovation & remodelling",
    heading: "Familiar spaces. New possibilities.",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
    imageAlt: "Renovated living space with a warm neutral palette and natural light",
    typicalArea: "1,500–4,000 sq.ft",
    duration: "60–90 days",
    description:
      "Open up the layout, rethink the finishes, and make an existing home work beautifully for its next chapter.",
    deliverables: ["Existing-space review & layout redesign", "Plumbing, electrical & finish updates", "Coordinated renovation & site supervision"],
  },
] as const;

export function ChooseStartingPoint({ projects = [] }: { projects?: Project[] }) {
  const [selectedId, setSelectedId] = useState<string>("entire-home");
  const { toggleItem, hasItem } = useSpaceCollection();
  const current = ENTRY_POINTS.find((option) => option.id === selectedId) || ENTRY_POINTS[0];

  const featuredProjects = projects.filter((project) =>
    selectedId !== "one-room" || ["kitchen", "bedroom", "bathroom"].includes(project.category)
  ).slice(0, 2);

  return (
    <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 bg-[#EEEAE1] py-16 sm:py-20 lg:py-24">
      <div className="container">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#6A705D]">Designed around you</p>
            <h2 id="services-heading" className="font-serif text-4xl font-normal leading-[1.1] sm:text-5xl lg:text-[56px]">Every space has a starting point.</h2>
          </div>
          <p className="max-w-xs text-base leading-7 text-[#5A6057]">A whole home or a single room. Find the right way to begin.</p>
        </div>

        <div className="mb-7 grid grid-cols-3 border-b border-[#CDC8BA]" aria-label="Choose your project scope">
          {ENTRY_POINTS.map((option, index) => {
            const selected = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                aria-controls="service-details"
                onClick={() => setSelectedId(option.id)}
                className={`relative flex min-h-[84px] items-start gap-3 px-2 py-5 text-left transition-colors sm:px-5 ${selected ? "text-[#242622]" : "text-[#64695F] hover:bg-[#FAF7F2]/60"}`}
              >
                <span className={`hidden pt-1 text-xs sm:block ${selected ? "text-[#A45138]" : "text-[#64695F]"}`}>0{index + 1}</span>
                <span>
                  <span className="block font-serif text-lg sm:text-2xl">{option.title}</span>
                  <span className="mt-1 hidden text-xs text-[#64695F] md:block">{option.subtitle}</span>
                </span>
                {selected && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#A45138]" />}
              </button>
            );
          })}
        </div>

        <div id="service-details" className="grid overflow-hidden bg-[#FAF7F2] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[290px] sm:min-h-[380px] lg:min-h-[520px]">
            <Image src={current.image} alt={current.imageAlt} fill sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-7 gap-y-3 bg-gradient-to-t from-[#242622]/85 to-transparent px-6 pb-6 pt-20 text-[#FAF7F2] sm:px-8">
              <div><span className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/75">Typical area</span><span className="text-sm">{current.typicalArea}</span></div>
              <div><span className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/75">Estimated timeline</span><span className="text-sm">{current.duration}</span></div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10 xl:p-12">
            <h3 className="max-w-md font-serif text-3xl font-normal leading-[1.15] sm:text-4xl">{current.heading}</h3>
            <p className="mt-4 max-w-md text-base leading-7 text-[#5A6057]">{current.description}</p>
            <ul className="my-6 space-y-3">
              {current.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#41473D]"><FiCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#727A61]" size={16} />{item}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={`/design-brief?scope=${current.id}`} className="inline-flex min-h-12 items-center justify-center gap-4 bg-[#A45138] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#893E28]">Plan your space <FiArrowRight aria-hidden="true" /></Link>
              <Link href="/contact" className="inline-flex min-h-11 items-center border-b border-[#B6B7AA] text-sm text-[#41473D] transition-colors hover:text-[#A45138]">Let’s talk first</Link>
            </div>

            {featuredProjects.length > 0 && <div className="mt-8 border-t border-[#DDD5C8] pt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A705D]">Spaces to explore</p>
                <Link href="/portfolio" className="inline-flex min-h-8 items-center gap-1 text-xs text-[#6A705D] hover:text-[#A45138]">View all <FiArrowRight aria-hidden="true" size={13} /></Link>
              </div>
              {featuredProjects.map((project) => {
                const saved = hasItem(`entry-${project.slug}`);
                return (
                  <div key={project.slug} className="flex items-center justify-between gap-3">
                    <Link href={`/portfolio/${project.slug}`} className="py-2 text-xs leading-5 text-[#41473D] transition-colors hover:text-[#A45138]">{project.title}</Link>
                    <button type="button" aria-label={`${saved ? "Remove" : "Save"} ${project.title}${saved ? " from" : " to"} your collection`} aria-pressed={saved} onClick={() => toggleItem({ id: `entry-${project.slug}`, type: "project", title: project.title, subtitle: project.location, image: project.featured_image || project.coverImage, notes: project.area })} className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors hover:bg-[#EEEAE1] ${saved ? "text-[#A45138]" : "text-[#6A705D]"}`}>
                      {saved ? <FiCheck aria-hidden="true" size={15} /> : <FiBookmark aria-hidden="true" size={15} />}
                    </button>
                  </div>
                );
              })}
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
