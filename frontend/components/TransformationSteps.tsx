"use client";

import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiMinus, FiPlus } from "react-icons/fi";

const PHASES = [
  {
    step: "01",
    title: "First, we listen.",
    label: "Consultation & site visit",
    description: "We get to know your everyday routines, your ideas, and your space. A site visit helps us understand the light, layout, and possibilities.",
    deliverable: "Your design brief, site measurements, and initial direction.",
  },
  {
    step: "02",
    title: "See the possibilities.",
    label: "Layout & 3D design",
    description: "Floor plans and 3D views bring your ideas into focus. Together, we refine the arrangement, furniture, and lighting before building begins.",
    deliverable: "Floor plans and 3D visualisations of your future space.",
  },
  {
    step: "03",
    title: "Make it feel like you.",
    label: "Materials & budget",
    description: "Explore textures, finishes, and material samples with us. We agree on the details and an itemised budget so you can move forward with confidence.",
    deliverable: "Your material selections and an itemised project budget.",
  },
  {
    step: "04",
    title: "Watch it come together.",
    label: "Build & supervision",
    description: "Our team coordinates the craftspeople and installation, checks the work against the design, and keeps you informed as your space takes shape.",
    deliverable: "Coordinated site supervision and regular progress updates.",
  },
  {
    step: "05",
    title: "Welcome home.",
    label: "Finishing & handover",
    description: "We take care of the finishing touches, walk through your completed space with you, and explain how to care for its materials and fittings.",
    deliverable: "Your finished space, final walkthrough, and care guidance.",
  },
];

export function TransformationSteps() {
  const [activeStep, setActiveStep] = useState<string | null>("01");

  return (
    <section id="process" aria-labelledby="process-heading" className="scroll-mt-24 border-b border-[#DDD5C8] bg-[#FAF7F2] py-16 sm:py-20 lg:py-24">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6A705D]">The way we work</p>
          <h2 id="process-heading" className="max-w-sm font-serif text-4xl font-normal leading-[1.1] sm:text-5xl lg:text-[56px]">Good design.<br /><span className="italic text-[#727A61]">A clear process.</span></h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-[#5A6057]">From our first conversation to the day you move in, we make each step considered, collaborative, and easy to understand.</p>
          <Link href="/contact" className="mt-7 inline-flex min-h-11 items-center gap-5 border-b border-[#A45138]/50 text-sm font-medium text-[#A45138] transition-colors hover:text-[#893E28]">Start a conversation <FiArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="border-t border-[#D4CEC2]">
          {PHASES.map((phase) => {
            const isActive = activeStep === phase.step;
            return (
              <div key={phase.step} className="border-b border-[#D4CEC2]">
                <h3>
                  <button id={`process-button-${phase.step}`} type="button" aria-expanded={isActive} aria-controls={`process-panel-${phase.step}`} onClick={() => setActiveStep(isActive ? null : phase.step)} className="group flex w-full items-center gap-4 py-5 text-left sm:gap-6 sm:py-6">
                    <span className={`font-sans text-xs font-medium ${isActive ? "text-[#A45138]" : "text-[#6A705D]"}`}>{phase.step}</span>
                    <span className="flex-1">
                      <span className={`block font-serif text-2xl font-normal transition-colors sm:text-[28px] ${isActive ? "text-[#A45138]" : "text-[#242622] group-hover:text-[#A45138]"}`}>{phase.title}</span>
                      <span className="mt-1 block font-sans text-xs font-normal tracking-wide text-[#64695F]">{phase.label}</span>
                    </span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${isActive ? "border-[#A45138] bg-[#A45138] text-white" : "border-[#CCC8BB] text-[#5A6057] group-hover:border-[#A45138]"}`}>{isActive ? <FiMinus aria-hidden="true" size={15} /> : <FiPlus aria-hidden="true" size={15} />}</span>
                  </button>
                </h3>
                <div id={`process-panel-${phase.step}`} role="region" aria-labelledby={`process-button-${phase.step}`} hidden={!isActive} className="pb-6 pl-8 pr-4 sm:pl-10 sm:pr-12">
                  <p className="max-w-lg text-base leading-7 text-[#5A6057]">{phase.description}</p>
                  <div className="mt-4 border-l-2 border-[#B5BBA5] pl-4">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#6A705D]">What you receive</span>
                    <p className="text-xs leading-6 text-[#41473D]">{phase.deliverable}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
