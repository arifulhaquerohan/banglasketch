import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiCompass, FiMapPin, FiLayers } from "react-icons/fi";
import { FadeUp } from "../components/HomeAnimations";
import { TheLivingBlueprint } from "../components/TheLivingBlueprint";
import { ChooseStartingPoint } from "../components/ChooseStartingPoint";
import { EditorialSelectedSpaces } from "../components/EditorialSelectedSpaces";
import { MaterialMoodSelector } from "../components/MaterialMoodSelector";
import { TransformationSteps } from "../components/TransformationSteps";
import { InteractiveFloorPlan } from "../components/InteractiveFloorPlan";
import { TestimonialsWithProof } from "../components/TestimonialsWithProof";
import { SanctuaryEnquiryForm } from "../components/SanctuaryEnquiryForm";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      {/* 1. CINEMATIC EDITORIAL HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-44 lg:pb-28 overflow-hidden bg-[#F4F0E8] border-b border-[#DDD5C8]">
        {/* Subtle architectural blueprint grid watermark */}
        <div className="blueprint-grid absolute inset-0 opacity-40 pointer-events-none" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-6">
              <FadeUp>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-xs font-semibold text-[#727A61] tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#A45138]" />
                  <span>From Space to Sanctuary • বাংলা স্কেচ</span>
                </div>
              </FadeUp>

              <FadeUp delay={0.1}>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.12] text-[#242622] tracking-tight">
                  Thoughtful interiors.
                  <span className="block text-[#727A61] italic font-normal mt-1">
                    Beautiful everyday living.
                  </span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.15}>
                <p className="text-base sm:text-lg text-[#5A6057] leading-relaxed max-w-xl">
                  We transform raw apartments across Dhaka into tactile, light-filled architectural sanctuaries. Grounded in natural teak, honed limestone, acoustic serenity, and transparent craftsmanship.
                </p>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="flex flex-wrap gap-3.5 pt-2">
                  <Link href="#blueprint" className="btn btn-clay text-sm px-7 py-3.5 shadow-sm flex items-center gap-2">
                    <FiLayers size={15} />
                    <span>Experience The Blueprint</span>
                  </Link>
                  <Link href="#enquiry" className="btn btn-secondary text-sm px-7 py-3.5 flex items-center gap-2">
                    <span>Initiate Dialogue</span>
                    <FiArrowRight size={14} />
                  </Link>
                </div>
              </FadeUp>

              <FadeUp delay={0.25}>
                <div className="pt-6 border-t border-[#DDD5C8] grid grid-cols-3 gap-4 text-[#242622]">
                  <div>
                    <div className="font-serif text-2xl font-bold text-[#242622]">10+</div>
                    <div className="text-[11px] font-mono text-[#727A61] uppercase tracking-wider">Years Studio</div>
                  </div>
                  <div>
                    <div className="font-serif text-2xl font-bold text-[#242622]">200+</div>
                    <div className="text-[11px] font-mono text-[#727A61] uppercase tracking-wider">Sanctuaries</div>
                  </div>
                  <div>
                    <div className="font-serif text-2xl font-bold text-[#A45138]">100%</div>
                    <div className="text-[11px] font-mono text-[#727A61] uppercase tracking-wider">Fixed BOQ</div>
                  </div>
                </div>
              </FadeUp>
            </div>

            {/* Right Photography Column: Architectural Hero Framed Photograph */}
            <div className="lg:col-span-6 xl:col-span-7">
              <FadeUp delay={0.2}>
                <div className="relative aspect-[4/3] lg:aspect-[14/11] rounded-2xl overflow-hidden border border-[#DDD5C8] shadow-2xl bg-[#EDE7DE] group">
                  <Image
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85"
                    alt="Light-filled architectural sanctuary living room in Gulshan by Bangla Sketch"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
                  />
                  {/* Subtle warm architectural gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/70 via-transparent to-transparent pointer-events-none" />

                  {/* Architectural Blueprint Floating Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242622]/85 backdrop-blur-md text-white text-[11px] font-mono border border-white/15 shadow-md">
                      <FiCompass className="text-[#A45138]" size={12} />
                      GULSHAN II RESIDENCE • 4,400 SQ.FT
                    </span>
                  </div>

                  {/* Project Tag Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white z-10">
                    <div className="bg-[#242622]/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                      <p className="text-[10px] font-semibold text-[#DDD5C8] uppercase tracking-wider font-mono">
                        Turnkey Handover
                      </p>
                      <p className="font-serif text-sm sm:text-base font-medium text-white">
                        The Courtyard Pavilion • Bleached Teak & Honed Limestone
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#DDD5C8] bg-[#242622]/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                      <FiMapPin className="text-[#727A61]" /> Dhaka, Bangladesh
                    </span>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE TRANSFORMATION: THE LIVING BLUEPRINT */}
      <section id="blueprint">
        <TheLivingBlueprint />
      </section>

      {/* 3. CHOOSE YOUR STARTING POINT: 3 ARCHITECTURAL ENTRY POINTS */}
      <section id="starting-point">
        <ChooseStartingPoint />
      </section>

      {/* 4. SELECTED SPACES: EDITORIAL MAGAZINE STUDY WITH HOTSPOTS */}
      <section id="spaces">
        <EditorialSelectedSpaces />
      </section>

      {/* 5. MATERIAL MOOD SELECTOR: 3 TACTILE PALETTES & SWATCHES */}
      <section id="materials">
        <MaterialMoodSelector />
      </section>

      {/* 6. HOW THE TRANSFORMATION HAPPENS: 5-PHASE ROADMAP */}
      <section id="process">
        <TransformationSteps />
      </section>

      {/* 7. INTERACTIVE FLOOR PLAN: ARCHITECTURAL MASTER PLAN */}
      <section id="floor-plan">
        <InteractiveFloorPlan />
      </section>

      {/* 8. SANCTUARIES LIVED & LOVED: VERIFIED PROOF & STORIES */}
      <section id="stories">
        <TestimonialsWithProof />
      </section>

      {/* 9. SANCTUARY ENQUIRY FORM: ARCHITECTURAL CONSULTATION */}
      <SanctuaryEnquiryForm />
    </>
  );
}
