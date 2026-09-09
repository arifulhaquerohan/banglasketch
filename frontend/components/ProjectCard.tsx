import Link from "next/link";
import Image from "next/image";
import { FiArrowUpRight } from "react-icons/fi";
import type { ServiceCategory } from "../lib/constants";
import { getOptimizedCloudinaryUrl } from "../lib/cloudinary";

interface ProjectCardProps {
  title: string;
  slug: string;
  category: ServiceCategory;
  description?: string;
  featuredImage?: string;
  dateCompleted?: string;
}

const LABELS: Record<ServiceCategory, string> = {
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  "living-room": "Living Space",
  bathroom: "Bathroom",
};

export function ProjectCard({ title, slug, category, description, featuredImage, dateCompleted }: ProjectCardProps) {
  const rawImg = featuredImage || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
  const img = getOptimizedCloudinaryUrl(rawImg, { width: 900, quality: "auto:good" });

  return (
    <Link
      href={`/portfolio/${slug}`}
      className="card group block overflow-hidden bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#ECE5DA]">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[#242824]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 z-10">
          <span className="badge bg-[#FCFAF7]/90 backdrop-blur-sm text-[#444D37] border border-[#DED5C7] text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1">
            {LABELS[category] || category}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className="w-8 h-8 rounded-full bg-[#FCFAF7] text-[#242824] flex items-center justify-center shadow-md">
            <FiArrowUpRight size={16} />
          </span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#242824] group-hover:text-[#586348] transition-colors duration-200 mb-2 leading-snug">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#5A625A] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-4 pt-3 border-t border-[#DED5C7]/60 flex items-center justify-between text-xs text-[#737D73]">
          {dateCompleted ? (
            <span>
              {new Date(dateCompleted).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
            </span>
          ) : (
            <span>Architectural Handover</span>
          )}
          <span className="text-[#586348] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Project →
          </span>
        </div>
      </div>
    </Link>
  );
}
