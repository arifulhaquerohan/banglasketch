"use client";

import React, { useState } from "react";
import { FiCheckCircle, FiFileText, FiLayers, FiShield, FiSliders, FiTool } from "react-icons/fi";

interface PhaseStep {
  step: string;
  title: string;
  subtitle: string;
  timeline: string;
  description: string;
  deliverable: string;
  deliverableDetails: string[];
  icon: React.ReactNode;
}

const PHASES: PhaseStep[] = [
  {
    step: "01",
    title: "Consultation & Spatial Audit",
    subtitle: "Understanding Daily Routines & Daylight",
    timeline: "Week 01 – 02",
    description:
      "We begin at your space in Dhaka, observing natural sun corridors, family living patterns, acoustic challenges, and structural column locations.",
    deliverable: "Spatial Audit Document & Mood Intent Matrix",
    deliverableDetails: [
      "Precise laser site dimensional survey",
      "Sunlight angle & cross-ventilation analysis",
      "Lifestyle habit & storage inventory worksheet",
    ],
    icon: <FiFileText className="text-[#A45138]" size={20} />,
  },
  {
    step: "02",
    title: "Architectural Concept & 3D Modeling",
    subtitle: "Resolving Volumes, Circulation & Sightlines",
    timeline: "Week 03 – 04",
    description:
      "Our architects draft CAD floor plans and photorealistic 3D models. You see exact lighting drops, joinery proportions, and materials before any construction begins.",
    deliverable: "Photorealistic 3D Renders & CAD Layout Blueprints",
    deliverableDetails: [
      "High-resolution 3D walkthroughs for each room",
      "Dimensioned 2D floor plans & furniture clearances",
      "Reflected ceiling plans & HVAC plenum layouts",
    ],
    icon: <FiLayers className="text-[#727A61]" size={20} />,
  },
  {
    step: "03",
    title: "Material & Joinery Specification",
    subtitle: "Curating the Tactile Swatch Board",
    timeline: "Week 05 – 06",
    description:
      "We invite you to our studio to touch authentic marble slabs, natural teak veneers, textured linens, and aged brass samples. Zero ambiguous selections.",
    deliverable: "Physical Swatch Board & Transparent Itemized BOQ",
    deliverableDetails: [
      "Tangible sample board for woods, stones & hardware",
      "100% itemized bill of quantities with fixed pricing",
      "Sanitary fixture & architectural lighting schedule",
    ],
    icon: <FiSliders className="text-[#A45138]" size={20} />,
  },
  {
    step: "04",
    title: "Artisan Execution & Site Supervision",
    subtitle: "Turnkey Craftsmanship with Zero Deviation",
    timeline: "Week 07 – 14",
    description:
      "Our dedicated full-time site architects oversee master carpenters, marble masons, and certified electricians. Every joint and shadowline is verified against drawings.",
    deliverable: "Weekly Milestone Verification & Quality Logs",
    deliverableDetails: [
      "On-site resident engineer supervision daily",
      "Weekly photo & 360° video progress reports",
      "Pre-installation MEP acoustic pressure testing",
    ],
    icon: <FiTool className="text-[#727A61]" size={20} />,
  },
  {
    step: "05",
    title: "White-Glove Handover & Sanctuary Living",
    subtitle: "The Seamless Transition to Your New Home",
    timeline: "Week 15",
    description:
      "Deep architectural cleaning, lighting scene calibration, custom soft furnishings placement, and formal handover of your completed sanctuary.",
    deliverable: "10-Year Craftsmanship Warranty & Care Manual",
    deliverableDetails: [
      "Formal certificate of 10-year structural warranty",
      "Architectural Living Manual with material maintenance tips",
      "Complimentary 6-month and 12-month post-handover tune-up",
    ],
    icon: <FiShield className="text-[#A45138]" size={20} />,
  },
];

export function TransformationSteps() {
  const [activeStep, setActiveStep] = useState<string>("01");

  return (
    <section className="section bg-[#FAF7F2] border-b border-[#DDD5C8] relative">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>Structured Transparency</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            How the Transformation Happens
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            Renovation is often fraught with uncertainty. We replace ambiguity with a rigorous 5-phase architectural roadmap where every milestone delivers a concrete, reviewable artifact.
          </p>
        </div>

        {/* Desktop Fine Animated Line Timeline */}
        <div className="relative">
          {/* Continuous Fine Architectural Axis Rule */}
          <div className="hidden lg:block absolute top-[44px] left-8 right-8 h-[1.5px] bg-[#DDD5C8] z-0">
            {/* Animated accent gradient runner */}
            <div className="h-full bg-[#727A61]/60 w-full" />
          </div>

          {/* 5 Phase Column Cards */}
          <div className="grid lg:grid-cols-5 gap-6 relative z-10">
            {PHASES.map((phase) => {
              const isActive = activeStep === phase.step;
              return (
                <div
                  key={phase.step}
                  onClick={() => setActiveStep(phase.step)}
                  className={`cursor-pointer rounded-xl p-5 sm:p-6 transition-all duration-300 border flex flex-col justify-between ${
                    isActive
                      ? "bg-[#F4F0E8] border-[#A45138] ring-1 ring-[#A45138] shadow-lg translate-y-[-4px]"
                      : "bg-[#FAF7F2] border-[#DDD5C8] hover:border-[#727A61] hover:bg-[#FAF7F2]/90"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStep(phase.step);
                    }
                  }}
                >
                  <div>
                    {/* Top Step Pill & Timeline */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border transition-colors ${
                          isActive
                            ? "bg-[#A45138] text-white border-[#A45138]"
                            : "bg-[#FAF7F2] text-[#242622] border-[#DDD5C8]"
                        }`}
                      >
                        {phase.step}
                      </div>
                      <span className="text-[10px] font-mono text-[#727A61] uppercase tracking-wider">
                        {phase.timeline}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-[#242622] mb-1.5 leading-snug">
                      {phase.title}
                    </h3>
                    <p className="text-xs text-[#727A61] font-medium mb-3">
                      {phase.subtitle}
                    </p>
                    <p className="text-xs text-[#5A6057] leading-relaxed mb-4 line-clamp-3">
                      {phase.description}
                    </p>
                  </div>

                  {/* Concrete Deliverable Badge */}
                  <div className="pt-4 border-t border-[#DDD5C8]/80">
                    <span className="architectural-tag text-[#A45138] block text-[9px] mb-1">
                      Deliverable
                    </span>
                    <div className="text-xs font-semibold text-[#242622] leading-snug flex items-start gap-1.5">
                      <FiCheckCircle className="text-[#727A61] shrink-0 mt-0.5" size={13} />
                      <span>{phase.deliverable}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Expanded Inspector for Active Phase */}
        {(() => {
          const selected = PHASES.find((p) => p.step === activeStep) || PHASES[0];
          return (
            <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-[#F4F0E8] border border-[#DDD5C8] shadow-sm animate-fade-in">
              <div className="grid md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="architectural-tag text-[#A45138]">Phase {selected.step} Milestone Deep-Dive</span>
                    <span className="text-[#DDD5C8]">•</span>
                    <span className="text-xs font-mono text-[#727A61]">{selected.timeline}</span>
                  </div>
                  <h4 className="font-serif text-2xl font-semibold text-[#242622]">
                    {selected.title}: What Homeowners Receive
                  </h4>
                  <p className="text-sm text-[#5A6057] leading-relaxed">
                    {selected.description}
                  </p>
                  <div className="pt-2 grid sm:grid-cols-3 gap-3">
                    {selected.deliverableDetails.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#FAF7F2] border border-[#DDD5C8] text-xs text-[#242622] flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A45138] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 p-5 rounded-xl bg-[#242622] text-[#FAF7F2] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      {selected.icon}
                    </div>
                    <div>
                      <span className="architectural-tag text-[#DDD5C8] text-[9px] block">
                        Official Deliverable
                      </span>
                      <h5 className="font-serif text-sm font-semibold text-white">
                        {selected.deliverable}
                      </h5>
                    </div>
                  </div>
                  <p className="text-xs text-[#DDD5C8]/80 leading-relaxed border-t border-white/10 pt-2">
                    All deliverables are transferred into your digital studio dossier and backed by our turnkey guarantee.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
