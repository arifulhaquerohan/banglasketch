"use client";

import Link from "next/link";
import { PageLinks } from "./PageLinks";
import { ProjectCard } from "./ProjectCard";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { FiSearch, FiSliders } from "react-icons/fi";
import type { ServiceCategory } from "../lib/constants";

interface ProjectItem {
  id: string | number;
  title: string;
  slug: string;
  category: ServiceCategory;
  description?: string;
  location?: string;
  area?: string;
  style?: string;
  year?: string;
  featured_image?: string;
  coverImage?: string;
  date_completed?: string;
}

interface PortfolioExplorerProps {
  initialProjects: ProjectItem[];
  activeCategory: string;
  search: string;
  page: number;
  hasMore: boolean;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Spaces" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bedroom", label: "Bedroom" },
  { id: "living-room", label: "Living" },
  { id: "commercial", label: "Commercial" },
];

export function PortfolioExplorer({
  initialProjects,
  activeCategory,
  search,
  page,
  hasMore,
}: PortfolioExplorerProps) {
  const searchQuery = search;
  const selectedCategory = activeCategory;
  const filteredProjects = initialProjects;

  return (
    <div>
      {/* Search & Category Filter Bar */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search Input Box */}
        <form action="/portfolio" className="relative">
          <input type="hidden" name="category" value={activeCategory} />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#727A61]">
            <FiSearch size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by space, material (e.g. travertine, teak, quartzite), or location (Gulshan, Banani)..."
            name="search"
            aria-label="Search projects"
            defaultValue={searchQuery}
            key={searchQuery}
            maxLength={200}
            className="w-full bg-[#FAF7F2] border border-[#DDD5C8] hover:border-[#727A61]/70 focus:border-[#727A61] rounded-2xl py-3.5 pl-11 pr-24 text-sm text-[#242622] placeholder:text-[#8C948C] focus:outline-none transition-all duration-200 shadow-2xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-clay py-2 px-5 text-xs rounded-xl"
          >
            Search
          </button>
        </form>

        {/* Category Pill Filters (Kitchen, Bedroom, Living, Commercial) */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/portfolio?${new URLSearchParams({
                  category: cat.id,
                  ...(search ? { search } : {}),
                })}`}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-[#242622] text-[#FAF7F2] shadow-sm font-semibold"
                    : "bg-[#FAF7F2] text-[#5A6057] border border-[#DDD5C8] hover:border-[#727A61] hover:text-[#242622]"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="text-center text-xs text-[#767E73] flex items-center justify-center gap-2">
          <FiSliders size={13} className="text-[#727A61]" />
          <span>
            Showing <strong className="text-[#242622] font-semibold">{filteredProjects.length}</strong>{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </span>
          {searchQuery && <span>matching &ldquo;{searchQuery}&rdquo;</span>}
        </div>
      </div>

      <PageLinks path="/portfolio" page={page} hasMore={hasMore} category={activeCategory} search={search} />

      {/* Grid Display with Enquiry Panel */}
      <div className="mt-12">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredProjects.map((p, idx) => (
              <AnimateOnScroll key={p.id} delay={Math.min(idx * 60, 300)}>
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
        ) : (
          <div className="text-center py-16 bg-[#FAF7F2] rounded-3xl border border-[#DDD5C8] max-w-xl mx-auto p-8 shadow-sm">
            <p className="font-serif text-2xl font-semibold text-[#242622] mb-2">No matching projects found</p>
            <p className="text-sm text-[#5A6057] mb-6">
              Try adjusting your search query or selecting a different space category.
            </p>
            <Link href="/portfolio" className="btn btn-clay py-2.5 px-6 text-xs">
              Reset Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
