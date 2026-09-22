import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FiCheckCircle, FiCompass, FiFeather, FiLayers, FiShield, FiHeart, FiAward, FiArrowRight } from "react-icons/fi";
import { STATS, SAMPLE_TESTIMONIALS } from "../../lib/constants";
import { TestimonialCard } from "../../components/TestimonialCard";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider } from "../../components/ServiceIcons";

export const metadata: Metadata = {
  title: "About Us • Bangla Sketch Architectural Studio",
  description: "Learn about Bangla Sketch's 10+ years of architectural practice, design philosophy, and commitment to bespoke interior architecture in Dhaka.",
  openGraph: {
    title: "About Bangla Sketch • Architectural Studio Dhaka",
    description: "10+ years of dedicated architectural & interior practice in Dhaka. Over 200 bespoke handovers completed.",
    images: [{ url: "/logo-512.png", width: 512, height: 512 }],
  },
};

const PHILOSOPHIES = [
  {
    title: "Beauty Without Compromise",
    desc: "We never sacrifice aesthetics for function or vice versa. Every space we design achieves both beautifully.",
    icon: FiFeather,
  },
  {
    title: "Function Meets Aesthetics",
    desc: "Design should enhance how you live, not just look good in photos. We create spaces that work as hard as you do.",
    icon: FiCompass,
  },
  {
    title: "Budget-Conscious Luxury",
    desc: "Luxury isn't about exorbitant price tags — it's about thoughtful architectural choices and material longevity.",
    icon: FiLayers,
  },
  {
    title: "Sustainable & Climate-Smart",
    desc: "We prioritize eco-friendly, locally sourced materials tailored for Dhaka's climate and urban living.",
    icon: FiShield,
  },
  {
    title: "Your Vision First",
    desc: "We listen deeply to understand your lifestyle, translating your narrative into spaces that feel genuinely yours.",
    icon: FiHeart,
  },
  {
    title: "Local Artisanal Craft",
    desc: "We partner with skilled Bangladeshi carpenters and craftsmen to deliver heirloom quality to every handover.",
    icon: FiAward,
  },
];

const WHY_CHOOSE_ITEMS = [
  "10+ years of dedicated architectural & interior practice in Dhaka",
  "200+ bespoke residential & commercial handovers completed",
  "Award-winning design philosophy blending modernism and heritage",
  "Personalized 3D architectural renders & VR spatial visualization",
  "Turnkey project management from civil overhaul to carpentry",
  "Transparent itemized BOQ pricing with zero surprise costs",
  "Structured post-handover warranty and care maintenance",
  "Dedicated client portal & milestone progress tracking",
];

export default function AboutPage() {
  return (
    <div className="pt-24 bg-[#F5F2EB]">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-[#EDE7DE] border-b border-[#DED5C7]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div className="relative max-w-md mx-auto w-full">
                <div className="absolute -inset-3 rounded-3xl bg-[#586348]/10 blur-xl" />
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border border-[#DED5C7] bg-[#FCFAF7]">
                  <Image
                    src="https://res.cloudinary.com/dqcppfhuc/image/upload/v1788702780/trqjrpskci7nsbcvf9xe.png"
                    alt="Bangla Sketch Principal Designer"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[#242824] text-[#FCFAF7] px-6 py-4 rounded-2xl shadow-xl border border-[#586348]/40">
                  <p className="text-3xl font-serif font-bold text-[#DED5C7] leading-none">10+</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A8B498] mt-1">Years Studio Practice</p>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">
                  About Bangla Sketch
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-2 mb-6 leading-tight text-balance">
                  Crafting Timeless Sanctuaries in Dhaka
                </h1>
                <p className="text-[#5A625A] text-base leading-relaxed mb-4 text-pretty max-w-xl">
                  Welcome to Bangla Sketch. For over a decade, our architectural studio has been transforming bare apartments, penthouses, and commercial spaces across Bangladesh into thoughtfully composed sanctuaries.
                </p>
                <p className="text-[#5A625A] text-base leading-relaxed mb-4 text-pretty max-w-xl">
                  We believe interior architecture is not mere decoration — it is the thoughtful choreography of natural light, tactile materials, spatial flow, and structural precision tailored around the rituals of everyday life.
                </p>
                <p className="text-[#5A625A] text-base leading-relaxed mb-8 text-pretty max-w-xl">
                  Whether you are remodeling a single residence or embarking on a full-floor corporate handover, our team guides you seamlessly from conceptual sketches to turnkey delivery.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <Link href="/contact" className="btn btn-primary text-xs sm:text-sm px-7 py-3.5 shadow-sm">
                    <span>Book Studio Consultation</span>
                    <FiArrowRight size={14} />
                  </Link>
                  <Link href="/portfolio" className="btn btn-secondary text-xs sm:text-sm px-7 py-3.5">
                    Explore Handover Portfolio
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Numerical Highlights / Stats */}
      <section className="py-12 bg-[#FCFAF7] border-b border-[#DED5C7]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((stat, i) => (
              <AnimateOnScroll key={stat.label} delay={80 * i}>
                <div className="p-6 rounded-2xl bg-[#F5F2EB] border border-[#DED5C7] text-center transition-all duration-300 hover:border-[#586348] hover:shadow-xs">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#586348] mb-1">{stat.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#737D73]">{stat.label}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="section bg-[#F5F2EB]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <AnimateOnScroll>
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Core Values</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242824] mt-1 mb-3">Our Architectural Philosophy</h2>
              <ArchitecturalDivider />
              <p className="text-sm text-[#5A625A] leading-relaxed mt-3">
                Every line we draw and material we specify is guided by principles that prioritize spatial harmony, durability, and human comfort.
              </p>
            </AnimateOnScroll>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {PHILOSOPHIES.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateOnScroll key={item.title} delay={90 * i}>
                  <div className="card p-7 sm:p-8 bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl shadow-xs hover:border-[#586348] transition-all duration-300 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] mb-5 shadow-xs">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#242824] mb-2.5">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5A625A] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Bangla Sketch */}
      <section className="section bg-[#FCFAF7] border-y border-[#DED5C7]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Distinction</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242824] mt-1 mb-6">
                  Why Discerning Homeowners Choose Bangla Sketch
                </h2>
                <div className="space-y-3.5">
                  {WHY_CHOOSE_ITEMS.map((item) => (
                    <div key={item} className="flex items-start gap-3.5 text-[#242824]">
                      <div className="w-6 h-6 rounded-full bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] shrink-0 mt-0.5 shadow-2xs">
                        <FiCheckCircle size={13} />
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed text-[#383E38] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left">
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-[#DED5C7]">
                  <Image
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
                    alt="Bangla Sketch Interior Craftsmanship"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#242824] text-[#FCFAF7] border border-[#586348]/40 rounded-full px-6 py-2.5 shadow-xl whitespace-nowrap">
                  <p className="text-xs font-semibold text-[#DED5C7]">Trusted by 200+ Dhaka Families & Brands</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Client Feedback Showcase */}
      <section className="section bg-[#F5F2EB]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <AnimateOnScroll>
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Endorsements</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242824] mt-1 mb-3">What Our Clients Say</h2>
              <ArchitecturalDivider />
              <p className="text-sm text-[#5A625A] leading-relaxed mt-3">
                Genuine reflections from residential and commercial clients across Gulshan, Banani, Dhanmondi, and Uttara.
              </p>
            </AnimateOnScroll>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SAMPLE_TESTIMONIALS.map((t, i) => (
              <AnimateOnScroll key={t.id} delay={100 * i}>
                <TestimonialCard {...t} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Full-width Architectural Call to Action */}
      <section className="py-20 bg-[#242824] text-[#FCFAF7] border-t border-[#383E38]">
        <div className="container text-center max-w-3xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A8B498] block mb-3">
              Let&apos;s Build Together
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-sm sm:text-base text-[#DED5C7] max-w-xl mx-auto mb-8 leading-relaxed">
              Schedule a private consultation at our studio or request an on-site architectural evaluation for your Dhaka property.
            </p>
            <div className="flex gap-3.5 justify-center flex-wrap">
              <Link href="/contact" className="btn btn-primary text-xs sm:text-sm px-8 py-4 shadow-md">
                <span>Book Free Consultation</span>
                <FiArrowRight size={14} />
              </Link>
              <Link href="/portfolio" className="inline-flex items-center gap-2 px-8 py-4 rounded-md border border-[#DED5C7]/40 text-xs sm:text-sm font-semibold text-[#FCFAF7] hover:bg-[#383E38] transition">
                <span>Explore Portfolio</span>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
