import Image from "next/image";
import Link from "next/link";
import { SERVICES, SAMPLE_PROJECTS, SAMPLE_TESTIMONIALS } from "../../../lib/constants";
import { ProjectCard } from "../../../components/ProjectCard";
import { TestimonialCard } from "../../../components/TestimonialCard";
import { AnimateOnScroll } from "../../../components/AnimateOnScroll";
import { ArchitecturalDivider, getServiceIcon } from "../../../components/ServiceIcons";
import { notFound } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ category: s.id }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const service = SERVICES.find((s) => s.id === category);
  if (!service) notFound();

  const projects = SAMPLE_PROJECTS.filter((p) => p.category === category);
  const testimonials = SAMPLE_TESTIMONIALS.slice(0, 2);

  return (
    <div className="pt-24 bg-[#F5F2EB]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[420px] max-h-[580px] overflow-hidden">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#242824] via-[#242824]/55 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-10 z-10">
          <AnimateOnScroll>
            <div className="w-12 h-12 rounded-2xl bg-[#FCFAF7]/90 text-[#586348] flex items-center justify-center mb-4 shadow-sm backdrop-blur-xs">
              {getServiceIcon(service.id, "w-6 h-6")}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#DED5C7]">Architectural Service</span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-3 mt-1">
              {service.name}
            </h1>
            <p className="text-sm sm:text-base text-[#EDE7DE] max-w-2xl leading-relaxed">
              {service.fullDescription}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Projects in Category */}
      <section className="section bg-[#FCFAF7] border-b border-[#DED5C7]/70">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Portfolio Selection</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mt-1">
              {service.name} Transformations
            </h2>
            <ArchitecturalDivider />
            <p className="text-xs sm:text-sm text-[#5A625A] max-w-xl mx-auto">
              Bespoke spatial design and custom woodwork handcrafted for residences in Dhaka.
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid-2 md:grid-cols-3 gap-6 sm:gap-8">
              {projects.map((p) => (
                <AnimateOnScroll key={p.id}>
                  <ProjectCard {...p} />
                </AnimateOnScroll>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#F5F2EB] rounded-3xl border border-[#DED5C7] max-w-xl mx-auto p-8">
              <p className="font-serif text-lg font-semibold text-[#242824] mb-2">Projects in Production</p>
              <p className="text-xs text-[#5A625A] mb-6">
                Our latest {service.name.toLowerCase()} handovers are currently being photographed. Contact us to review our print portfolio.
              </p>
              <Link href="/contact" className="btn btn-primary text-xs px-6 py-2.5">
                Inquire With Studio
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section bg-[#EDE7DE]">
          <div className="container">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Client Endorsements</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mt-1">
                Homeowner Experiences
              </h2>
              <ArchitecturalDivider />
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} {...t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Consultation CTA */}
      <section className="section text-center bg-[#F5F2EB] border-t border-[#DED5C7]/70">
        <div className="container max-w-2xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Start Collaboration</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242824] mt-2 mb-4">
              Ready for Your {service.name}?
            </h2>
            <p className="text-sm sm:text-base text-[#5A625A] mb-8 leading-relaxed">
              Schedule a visit at our design studio or have our architects evaluate your apartment floor plan.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn btn-primary text-xs px-8 py-3.5 shadow-sm">
                <span>Book Free Consultation</span>
                <FiArrowRight size={14} />
              </Link>
              <Link href="/portfolio" className="btn btn-secondary text-xs px-8 py-3.5">
                <span>View All Spaces</span>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
