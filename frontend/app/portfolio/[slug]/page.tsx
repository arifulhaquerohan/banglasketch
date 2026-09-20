import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "../../../components/ProjectCard";
import { AnimateOnScroll } from "../../../components/AnimateOnScroll";
import { ImageLightbox } from "../../../components/ImageLightbox";
import { BeforeAfterSlider } from "../../../components/BeforeAfterSlider";
import { ArchitecturalDivider } from "../../../components/ServiceIcons";
import { getProjectBySlug, getProjects, getPublicPage } from "../../../lib/api";
import { SaveProjectButton } from "../../../components/SaveProjectButton";
import { getOptimizedCloudinaryUrl } from "../../../lib/cloudinary";
import { notFound } from "next/navigation";
import { FiArrowRight, FiCalendar, FiCompass, FiMapPin } from "react-icons/fi";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found | Bangla Sketch" };

  const image = project.featured_image || project.coverImage;
  return {
    title: `${project.title} | Bangla Sketch Architectural Studio`,
    description: project.description,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: `${project.title} | Bangla Sketch`,
      description: project.description,
      type: "article",
      images: image ? [{ url: image, alt: project.title }] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { data: allProjects } = await getPublicPage("projects", { category: project.category, limit: 4 });
  const related = allProjects.filter((p) => String(p.id) !== String(project.id)).slice(0, 3);
  const rawFeaturedImage =
    project.featured_image || project.coverImage || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=85";
  const featuredImage = getOptimizedCloudinaryUrl(rawFeaturedImage, { width: 1920, quality: "auto:good" });
  const gallery = (project.gallery || []).map((img) =>
    getOptimizedCloudinaryUrl(img, { width: 1200, quality: "auto:good" })
  );

  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: [featuredImage, ...gallery],
    creator: { "@type": "Organization", name: "Bangla Sketch" },
  };

  return (
    <div className="pt-24 bg-[#F4F0E8]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(projectJsonLd) }} />

      {/* Hero: Large architectural photo with warm charcoal scrim */}
      <section className="relative h-[60vh] min-h-[460px] max-h-[660px] overflow-hidden">
        <Image
          src={featuredImage}
          alt={project.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#242622] via-[#242622]/55 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-10 z-10">
          <AnimateOnScroll>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#FAF7F2]/95 text-[#575E4A] text-xs font-semibold uppercase tracking-wider backdrop-blur-xs border border-[#DDD5C8]">
                {project.category.replace("-", " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#EAE3D5] bg-[#242622]/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10 font-medium">
                <FiMapPin className="text-[#A45138]" /> {project.location || "Dhaka, Bangladesh"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#EAE3D5] bg-[#242622]/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10 font-medium">
                <FiCalendar className="text-[#C5A059]" /> {project.year || "2026"}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-2 leading-tight">
              {project.title}
            </h1>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-[#DDD5C8] font-mono">
              <span>Area: {project.area || "Bespoke Residence"}</span>
              <span>•</span>
              <span>Style: {project.style || "Quiet Luxury"}</span>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content Section */}
      <section className="section bg-[#FAF7F2] border-b border-[#DDD5C8]/70">
        <div className="container max-w-4xl">
          <AnimateOnScroll>
            <div className="space-y-4 mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#727A61] font-mono">
                Architectural Narrative
              </span>
              <p className="font-serif text-xl md:text-2xl text-[#242622] leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Save to Collection & Specification Strip */}
            <div className="pt-6 border-t border-[#DDD5C8] flex flex-wrap items-center justify-between gap-4 bg-[#F4F0E8] p-5 rounded-2xl">
              <div className="space-y-1">
                <span className="text-xs text-[#727A61] font-mono uppercase tracking-wider block">
                  Studio Space Collection
                </span>
                <p className="text-xs text-[#5A6057]">
                  Save this project direction to review during your consultation.
                </p>
              </div>
              <SaveProjectButton
                id={`portfolio-${project.id}`}
                title={project.title}
                category={project.category}
                image={project.featured_image || project.coverImage || ""}
              />
            </div>
          </AnimateOnScroll>

          {/* Before & After Renovation Comparison (if available) */}
          {project.before_image && project.after_image && (
            <AnimateOnScroll delay={100}>
              <div className="mb-16 pt-12 border-t border-[#DDD5C8]/70">
                <div className="text-center mb-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#727A61] font-mono">
                    Transformation
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#242622] mt-1">
                    Before & After Renovation
                  </h3>
                  <ArchitecturalDivider />
                  <p className="text-xs sm:text-sm text-[#5A6057]">
                    Slide the divider to inspect the architectural carpentry and spatial overhaul.
                  </p>
                </div>
                <div className="max-w-3xl mx-auto">
                  <BeforeAfterSlider
                    before={project.before_image}
                    after={project.after_image}
                    beforeCaption="Original Site State"
                    afterCaption="Bangla Sketch Handover"
                  />
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {/* Interactive Lightbox Gallery */}
          {gallery.length > 0 && (
            <AnimateOnScroll delay={150}>
              <div className="mb-16 pt-12 border-t border-[#DDD5C8]/70">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#727A61] font-mono">
                      Craft & Materiality
                    </span>
                    <h3 className="font-serif text-2xl font-semibold text-[#242622] mt-1">
                      Project Photography
                    </h3>
                  </div>
                  <span className="text-xs text-[#727A61] font-medium hidden sm:inline">Click image to expand</span>
                </div>
                <ImageLightbox images={gallery} title={project.title} />
              </div>
            </AnimateOnScroll>
          )}

          {/* Client Testimonial */}
          {project.client_testimonial && (
            <AnimateOnScroll delay={200}>
              <div className="bg-[#EAE3D5] border-l-4 border-[#575E4A] p-8 rounded-r-2xl mb-12 shadow-2xs">
                <p className="font-serif text-lg md:text-xl italic text-[#242622] leading-relaxed mb-4">
                  &ldquo;{project.client_testimonial}&rdquo;
                </p>
                {project.client_name && (
                  <p className="text-xs font-bold uppercase tracking-wider text-[#575E4A] font-mono">
                    — {project.client_name}
                  </p>
                )}
              </div>
            </AnimateOnScroll>
          )}

          {/* Consultation CTA Card */}
          <AnimateOnScroll delay={250}>
            <div className="card p-8 sm:p-10 text-center bg-[#FAF7F2] border border-[#DDD5C8] rounded-3xl shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#727A61] font-mono block mb-2">
                Bespoke Residence
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242622] mb-3">
                Love This Architectural Direction?
              </h2>
              <p className="text-sm text-[#5A6057] max-w-lg mx-auto mb-6 leading-relaxed">
                Connect with our lead architect to discuss spatial layouts, teak millwork, and turnkey execution in Dhaka.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/contact" className="btn btn-clay text-xs px-7 py-3.5 shadow-sm">
                  <span>Book Free Studio Consultation</span>
                  <FiArrowRight size={14} />
                </Link>
                <Link href="/cost-estimator" className="btn btn-secondary text-xs px-7 py-3.5">
                  <FiCompass size={14} />
                  <span>Estimate Your Space</span>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Projects */}
      {related.length > 0 && (
        <section className="section bg-[#F4F0E8]">
          <div className="container">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#727A61] font-mono">
                Curated Works
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242622] mt-1">
                Related Projects
              </h2>
              <ArchitecturalDivider />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {related.map((p) => (
                <AnimateOnScroll key={p.id}>
                  <ProjectCard
                    title={p.title}
                    slug={p.slug}
                    category={p.category}
                    description={p.description}
                    location={p.location}
                    area={p.area}
                    style={p.style}
                    year={p.year}
                    featuredImage={p.featured_image || p.coverImage}
                    dateCompleted={p.date_completed}
                  />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
