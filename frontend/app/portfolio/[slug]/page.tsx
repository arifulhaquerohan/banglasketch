import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "../../../components/ProjectCard";
import { AnimateOnScroll } from "../../../components/AnimateOnScroll";
import { ImageLightbox } from "../../../components/ImageLightbox";
import { BeforeAfterSlider } from "../../../components/BeforeAfterSlider";
import { ArchitecturalDivider } from "../../../components/ServiceIcons";
import { getProjectBySlug, getProjects } from "../../../lib/api";
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

  const allProjects = await getProjects({ category: project.category });
  const related = allProjects.filter((p) => String(p.id) !== String(project.id)).slice(0, 3);
  const rawFeaturedImage =
    project.featured_image || project.coverImage || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
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
    <div className="pt-24 bg-[#F5F2EB]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }} />

      {/* Hero: Large architectural photo with warm dark scrim */}
      <section className="relative h-[55vh] min-h-[440px] max-h-[640px] overflow-hidden">
        <Image
          src={featuredImage}
          alt={project.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#242824] via-[#242824]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-10 z-10">
          <AnimateOnScroll>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#FCFAF7]/90 text-[#444D37] text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                {project.category.replace("-", " ")}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#DED5C7] bg-[#242824]/60 backdrop-blur-xs px-3 py-1 rounded-full">
                <FiMapPin className="text-[#829070]" /> Dhaka Handover
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-2">
              {project.title}
            </h1>
            {project.date_completed && (
              <p className="text-xs sm:text-sm text-[#DED5C7] flex items-center gap-1.5">
                <FiCalendar className="text-[#829070]" />
                Completed {new Date(project.date_completed).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </p>
            )}
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content Section */}
      <section className="section bg-[#FCFAF7] border-b border-[#DED5C7]/70">
        <div className="container max-w-4xl">
          <AnimateOnScroll>
            <div className="space-y-4 mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#727A61]">Architectural Narrative</span>
              <p className="font-serif text-xl md:text-2xl text-[#242622] leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Save to Collection CTA */}
            <div className="pt-6 border-t border-[#DDD5C8]/70 flex items-center justify-between gap-4">
              <span className="text-xs text-[#727A61] font-mono uppercase tracking-wider">
                Add to your Space Collection
              </span>
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
              <div className="mb-16 pt-8 border-t border-[#DED5C7]/70">
                <div className="text-center mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Transformation</span>
                  <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#242824] mt-1">Before & After Renovation</h3>
                  <ArchitecturalDivider />
                  <p className="text-xs sm:text-sm text-[#5A625A]">
                    Slide the divider to inspect the architectural carpentry and spatial overhaul.
                  </p>
                </div>
                <div className="max-w-3xl mx-auto">
                  <BeforeAfterSlider
                    before={project.before_image}
                    after={project.after_image}
                    beforeCaption="Original Apartment State"
                    afterCaption="Bangla Sketch Handover"
                  />
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {/* Interactive Lightbox Gallery */}
          {gallery.length > 0 && (
            <AnimateOnScroll delay={150}>
              <div className="mb-16 pt-8 border-t border-[#DED5C7]/70">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Craft & Detail</span>
                    <h3 className="font-serif text-2xl font-semibold text-[#242824] mt-1">Project Gallery</h3>
                  </div>
                  <span className="text-xs text-[#586348] font-medium hidden sm:inline">Click photo to expand view</span>
                </div>
                <ImageLightbox images={gallery} title={project.title} />
              </div>
            </AnimateOnScroll>
          )}

          {/* Client Testimonial */}
          {project.client_testimonial && (
            <AnimateOnScroll delay={200}>
              <div className="bg-[#EDE7DE] border-l-4 border-[#586348] p-8 rounded-r-2xl mb-12 shadow-xs">
                <p className="font-serif text-lg md:text-xl italic text-[#242824] leading-relaxed mb-4">
                  &ldquo;{project.client_testimonial}&rdquo;
                </p>
                {project.client_name && (
                  <p className="text-xs font-bold uppercase tracking-wider text-[#586348]">
                    — {project.client_name}
                  </p>
                )}
              </div>
            </AnimateOnScroll>
          )}

          {/* Consultation CTA Card */}
          <AnimateOnScroll delay={250}>
            <div className="card p-8 sm:p-10 text-center bg-[#F5F2EB] border border-[#DED5C7] rounded-3xl shadow-xs">
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348] block mb-2">Bespoke Living</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mb-3">
                Love This Architectural Direction?
              </h2>
              <p className="text-sm text-[#5A625A] max-w-lg mx-auto mb-6 leading-relaxed">
                Schedule a consultation to discuss floor plans, material selections, and turnkey budgets for your Dhaka home.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/contact" className="btn btn-primary text-xs px-7 py-3.5 shadow-sm">
                  <span>Book Free Studio Consultation</span>
                  <FiArrowRight size={14} />
                </Link>
                <Link href="/cost-estimator" className="btn btn-secondary text-xs px-7 py-3.5">
                  <FiCompass size={14} />
                  <span>Estimate Your Renovation</span>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Projects */}
      {related.length > 0 && (
        <section className="section bg-[#F5F2EB]">
          <div className="container">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">More Work</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mt-1">Related Projects</h2>
              <ArchitecturalDivider />
            </div>
            <div className="grid-2 md:grid-cols-3 gap-6 sm:gap-8">
              {related.map((p) => (
                <AnimateOnScroll key={p.id}>
                  <ProjectCard
                    title={p.title}
                    slug={p.slug}
                    category={p.category}
                    description={p.description}
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
