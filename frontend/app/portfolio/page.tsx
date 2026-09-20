import type { Metadata } from "next";
import { PortfolioExplorer } from "../../components/PortfolioExplorer";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider } from "../../components/ServiceIcons";
import { getPublicPage } from "../../lib/api";

export const metadata: Metadata = {
  title: "Interior Design Portfolio | Bangla Sketch Studio",
  description:
    "Explore our complete portfolio of modern kitchens, luxury master bedrooms, living spaces, and bespoke residences in Dhaka, Bangladesh.",
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || "all";
  const { data: projects, page, hasMore } = await getPublicPage("projects", {
    category: activeCategory,
    page: Number(resolvedParams.page),
    search: resolvedParams.search,
  });

  return (
    <div className="pt-24 min-h-screen bg-[#F4F0E8]">
      {/* Header */}
      <section className="py-16 md:py-20 bg-[#EAE3D5] border-b border-[#DDD5C8]">
        <div className="container text-center max-w-3xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#575E4A] font-mono">
              Portfolio Index
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] mt-2 mb-4">
              Architectural Works
            </h1>
            <ArchitecturalDivider />
            <p className="text-base text-[#5A6057] leading-relaxed mt-4">
              Browse through our residential & commercial interior transformations across Dhaka. Filter by space or search by materials like travertine, teak, and fluted acoustic veneer.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Explorer Content */}
      <section className="section bg-[#FAF7F2]">
        <div className="container">
          <PortfolioExplorer
            initialProjects={projects.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              category: p.category,
              description: p.description,
              location: p.location,
              area: p.area,
              style: p.style,
              year: p.year,
              featured_image: p.featured_image,
              coverImage: p.coverImage,
              date_completed: p.date_completed,
            }))}
            activeCategory={activeCategory}
            search={resolvedParams.search || ""}
            page={page}
            hasMore={hasMore}
          />
        </div>
      </section>
    </div>
  );
}
