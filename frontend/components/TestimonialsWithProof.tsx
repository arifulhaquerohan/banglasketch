"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiArrowRight, FiCheckCircle, FiClock, FiMaximize, FiStar } from "react-icons/fi";

interface VerifiedClientStory {
  id: string;
  clientName: string;
  clientTitle: string;
  location: string;
  residenceTitle: string;
  scope: string;
  area: string;
  duration: string;
  quote: string;
  projectSlug: string;
  homeImage: string;
  clientAvatar: string;
}

const VERIFIED_STORIES: VerifiedClientStory[] = [
  {
    id: "story-gulshan",
    clientName: "Farhan & Samira Chowdhury",
    clientTitle: "Senior Partner, Corporate Law & Design Collector",
    location: "Gulshan II, Dhaka",
    residenceTitle: "The Courtyard Pavilion",
    scope: "Full Turnkey Interior Architecture",
    area: "4,400 sq.ft",
    duration: "105 Days (Verified On-Time)",
    quote:
      "Bangla Sketch transformed what was a cavernous, echoey concrete shell into an intimate, light-filled sanctuary. The fluted teak craftsmanship and concealed air conditioning look like an architectural monograph. Our home breathes so effortlessly now.",
    projectSlug: "open-living-space",
    homeImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85",
    clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  },
  {
    id: "story-baridhara",
    clientName: "Dr. Shireen & Kabir Ahmed",
    clientTitle: "Cardiothoracic Surgeon & Renewable Energy Consultant",
    location: "Baridhara DOHS, Dhaka",
    residenceTitle: "The Riverine Sanctuary",
    scope: "Master Sanctuary & Acoustic Library",
    area: "3,200 sq.ft",
    duration: "75 Days (Verified On-Time)",
    quote:
      "After grueling 14-hour hospital shifts, stepping through our doorway is a physical exhale. The acoustic isolation, Belgian linen drapes, and indirect warm illumination give us the restorative sanctuary we desperately needed in the heart of Dhaka.",
    projectSlug: "luxury-bedroom-sanctuary",
    homeImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    id: "story-banani",
    clientName: "Tariq Rahman",
    clientTitle: "Fintech Founder & Culinary Enthusiast",
    location: "Banani, Dhaka",
    residenceTitle: "The Sculpted Culinary Studio",
    scope: "Gourmet Chef Kitchen & Breakfast Island",
    area: "650 sq.ft",
    duration: "38 Days (Fast-Track Handover)",
    quote:
      "They respected our timeline down to the hour. The Taj Mahal quartzite island and motorized downdraft ventilation work flawlessly. We cook high-heat curries daily with zero residual smell migrating to the living rooms. Pure functional elegance.",
    projectSlug: "modern-kitchen-renovation",
    homeImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85",
    clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
];

export function TestimonialsWithProof() {
  const [activeStoryId, setActiveStoryId] = useState<string>(VERIFIED_STORIES[0].id);

  return (
    <section className="section bg-[#F4F0E8] border-b border-[#DDD5C8]">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>Proof Through Lived Experience</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Sanctuaries Lived & Loved
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            A home is not just an aesthetic concept—it is a lived experience. See the real Dhaka residences completed by our studio, paired with verified scopes and client testimonials.
          </p>
        </div>

        {/* Story Selector Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {VERIFIED_STORIES.map((story) => {
            const isActive = story.id === activeStoryId;
            return (
              <div
                key={story.id}
                onClick={() => setActiveStoryId(story.id)}
                className={`cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  isActive
                    ? "bg-[#FAF7F2] border-[#A45138] ring-1 ring-[#A45138] shadow-xl"
                    : "bg-[#FAF7F2]/70 border-[#DDD5C8] hover:border-[#727A61]"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveStoryId(story.id);
                  }
                }}
              >
                {/* Home Photo with Verified Proof Badge */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#DDD5C8]">
                  <Image
                    src={story.homeImage}
                    alt={`Completed home of ${story.clientName}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/80 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242622]/85 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                      <FiCheckCircle className="text-[#727A61]" size={11} /> Verified Handover
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="architectural-tag text-[#DDD5C8] text-[9px] block">
                      {story.location}
                    </span>
                    <h3 className="font-serif text-lg font-semibold truncate">
                      {story.residenceTitle}
                    </h3>
                  </div>
                </div>

                {/* Scope & Verified Metrics */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-[#A45138]">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={14} className="fill-current" />
                      ))}
                    </div>

                    <blockquote className="text-xs sm:text-sm text-[#242622] leading-relaxed italic">
                      “{story.quote}”
                    </blockquote>
                  </div>

                  <div className="pt-4 border-t border-[#DDD5C8]/80 space-y-3">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#5A6057] bg-[#F4F0E8] p-2.5 rounded-lg border border-[#DDD5C8]/50">
                      <span className="flex items-center gap-1">
                        <FiMaximize size={12} className="text-[#727A61]" /> {story.area}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <FiClock size={12} className="text-[#A45138]" /> {story.duration}
                      </span>
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-serif text-sm font-semibold text-[#242622]">
                          {story.clientName}
                        </div>
                        <div className="text-[11px] text-[#727A61] truncate max-w-[200px]">
                          {story.clientTitle}
                        </div>
                      </div>

                      <Link
                        href={`/portfolio/${story.projectSlug}`}
                        className="text-xs font-semibold text-[#A45138] hover:underline flex items-center gap-1"
                      >
                        Space <FiArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-14 p-6 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C8] grid sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold text-[#242622]">200+</span>
            <p className="text-xs text-[#5A6057]">Sanctuaries Completed Across Dhaka</p>
          </div>
          <div className="space-y-1 sm:border-x sm:border-[#DDD5C8]">
            <span className="font-serif text-3xl font-bold text-[#727A61]">100%</span>
            <p className="text-xs text-[#5A6057]">Fixed-Price BOQ Guarantee with Zero Hidden Costs</p>
          </div>
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold text-[#A45138]">10 Years</span>
            <p className="text-xs text-[#5A6057]">Craftsmanship & Structural Joinery Warranty</p>
          </div>
        </div>
      </div>
    </section>
  );
}
