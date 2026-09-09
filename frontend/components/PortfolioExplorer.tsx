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
  { id: "kitchen", label: "Kitchens" },
  { id: "bedroom", label: "Bedrooms" },
  { id: "living-room", label: "Living Spaces" },
  { id: "bathroom", label: "Bathrooms" },
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
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#586348]">
            <FiSearch size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by space, material (e.g. marble, oak, fluted), or location (Gulshan, Banani)..."
            name="search"
            aria-label="Search projects"
            defaultValue={searchQuery}
            key={searchQuery}
            maxLength={200}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348]/60 focus:border-[#586348] rounded-2xl py-3.5 pl-11 pr-24 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none transition-all duration-300 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary py-2 px-5 text-xs rounded-xl"
          >
            Search
          </button>
        </form>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/portfolio?${new URLSearchParams({ category: cat.id, ...(search ? { search } : {}) })}`}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-[#242824] text-[#FCFAF7] shadow-sm font-semibold"
                    : "bg-[#FCFAF7] text-[#5A625A] border border-[#DED5C7] hover:border-[#586348] hover:text-[#242824]"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="text-center text-xs text-[#737D73] flex items-center justify-center gap-2">
          <FiSliders size={13} className="text-[#586348]" />
          <span>
            Showing <strong className="text-[#242824] font-semibold">{filteredProjects.length}</strong>{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </span>
          {searchQuery && <span>matching &ldquo;{searchQuery}&rdquo;</span>}
        </div>
      </div>

      <PageLinks path="/portfolio" page={page} hasMore={hasMore} category={activeCategory} search={search} />

      {/* Grid Display */}
      <div className="mt-12">
        {filteredProjects.length > 0 ? (
          <div className="grid-2 md:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((p, idx) => (
              <AnimateOnScroll key={p.id} delay={Math.min(idx * 50, 300)}>
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
        ) : (
          <div className="text-center py-16 bg-[#FCFAF7] rounded-3xl border border-[#DED5C7] max-w-xl mx-auto p-8 shadow-sm">
            <p className="font-serif text-xl font-semibold text-[#242824] mb-2">No matching projects found</p>
            <p className="text-sm text-[#5A625A] mb-6">
              Try adjusting your search query or selecting a different space category.
            </p>
            <Link href="/portfolio" className="btn btn-primary py-2.5 px-6 text-xs">
              Reset Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
