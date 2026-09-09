"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";

interface ImageLightboxProps {
  images: string[];
  title: string;
}

export function ImageLightbox({ images, title }: ImageLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
    },
    [selectedIndex, images.length]
  );

  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, handleKeyDown]);

  if (!images || images.length === 0) return null;

  return (
    <div>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#c5a059]/25 cursor-pointer shadow-lg hover:border-[#c5a059] transition-all duration-300"
          >
            <Image
              src={img}
              alt={`${title} gallery image ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Hover overlay with zoom hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
              <span className="text-xs text-white/90 font-medium">Photo {i + 1} of {images.length}</span>
              <span className="p-2 bg-[#c5a059] text-[#0a2540] rounded-xl font-bold shadow-md">
                <FiMaximize2 size={16} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in touch-none"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery fullscreen view"
        >
          {/* Top Bar Controls */}
          <div
            className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white">
              <h4 className="text-sm font-bold text-[#c5a059]">{title}</h4>
              <p className="text-xs text-gray-400">
                Photo {selectedIndex + 1} of {images.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="p-3 bg-white/10 hover:bg-[#c5a059] hover:text-[#0a2540] text-white rounded-full transition-all duration-200"
              aria-label="Close fullscreen"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Previous Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
            }}
            className="absolute left-3 sm:left-6 z-10 p-3 sm:p-4 bg-white/10 hover:bg-[#c5a059] hover:text-[#0a2540] text-white rounded-full transition-all duration-200"
            aria-label="Previous photo"
          >
            <FiChevronLeft size={24} />
          </button>

          {/* Main Displayed Image */}
          <div
            className="relative w-[92vw] h-[78vh] max-w-5xl flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`${title} fullscreen photo ${selectedIndex + 1}`}
              fill
              sizes="95vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((selectedIndex + 1) % images.length);
            }}
            className="absolute right-3 sm:right-6 z-10 p-3 sm:p-4 bg-white/10 hover:bg-[#c5a059] hover:text-[#0a2540] text-white rounded-full transition-all duration-200"
            aria-label="Next photo"
          >
            <FiChevronRight size={24} />
          </button>

          {/* Bottom Thumbnails */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[90vw] overflow-x-auto py-2 px-4 bg-black/60 rounded-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-12 h-9 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  selectedIndex === idx ? "border-[#c5a059] scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
