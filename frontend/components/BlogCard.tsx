import Link from "next/link";
import Image from "next/image";
import { FiArrowUpRight } from "react-icons/fi";
import { getOptimizedCloudinaryUrl } from "../lib/cloudinary";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  featured_image?: string;
  category: string;
  publishedDate?: string;
  published_date?: string;
  readingTime?: number;
  reading_time?: number;
}

export function BlogCard({
  title,
  slug,
  excerpt,
  featuredImage,
  featured_image,
  category,
  publishedDate,
  published_date,
  readingTime,
  reading_time,
}: BlogCardProps) {
  const rawImg = featuredImage || featured_image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
  const img = getOptimizedCloudinaryUrl(rawImg, { width: 800, quality: "auto:good" });
  const publishedAt = publishedDate || published_date;
  const minutes = readingTime || reading_time;

  return (
    <Link
      href={`/blog/${slug}`}
      className="card group block overflow-hidden bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#ECE5DA]">
        <Image
          src={img}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="badge bg-[#FCFAF7]/90 backdrop-blur-sm text-[#444D37] border border-[#DED5C7] text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className="w-8 h-8 rounded-full bg-[#FCFAF7] text-[#242824] flex items-center justify-center shadow-md">
            <FiArrowUpRight size={16} />
          </span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-[#737D73] mb-2.5 font-medium">
          {publishedAt && (
            <time>
              {new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          )}
          {minutes && (
            <>
              <span>•</span>
              <span>{minutes} min read</span>
            </>
          )}
        </div>
        <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#242824] group-hover:text-[#586348] transition-colors duration-200 mb-2 leading-snug">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-[#5A625A] line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
