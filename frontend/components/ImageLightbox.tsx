"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight, FiMaximize2, FiZoomIn, FiZoomOut } from "react-icons/fi";

interface ImageLightboxProps {
  images: string[];
  title: string;
}

export function ImageLightbox({ images, title }: ImageLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") {
        setSelectedIndex(null);
        setIsZoomed(false);
      }
      if (e.key === "ArrowRight") {
        setIsZoomed(false);
        setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      }
      if (e.key === "ArrowLeft") {
        setIsZoomed(false);
        setSelectedIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    },
    [selectedIndex, images.length]
  );

  useEffect(() => {
    if (selectedIndex === null) {
      setIsZoomed(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      touchDeltaRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1 || isZoomed) return;
    touchDeltaRef.current = {
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || isZoomed) return;
    const { x, y } = touchDeltaRef.current;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    // Horizontal swipe threshold: 45px
    if (absX > 45 && absX > absY) {
      if (x < 0) {
        // Swipe Left -> Next Image
        setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      } else {
        // Swipe Right -> Previous Image
        setSelectedIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    } else if (y > 90 && absY > absX) {
      // Swipe Down -> Dismiss/Close
      setSelectedIndex(null);
      setIsZoomed(false);
    }

    touchStartRef.current = null;
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setIsZoomed((prev) => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div>
      {/* Gallery Grid: Optimized for Mobile (1 col), Tablet/iPad (2 cols), Desktop (2-3 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5 sm:gap-4 md:gap-5">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => {
              setSelectedIndex(i);
              setIsZoomed(false);
            }}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#DED5C7] cursor-pointer shadow-xs hover:border-[#586348] transition-all duration-300 bg-[#EDE7DE]"
          >
            <Image
              src={img}
              alt={`${title} gallery image ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Hover overlay with zoom hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#242824]/80 via-[#242824]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3.5 sm:p-4">
              <span className="text-xs text-white/95 font-medium">Photo {i + 1} of {images.length}</span>
              <span className="p-2 bg-[#586348] text-white rounded-xl font-bold shadow-md">
                <FiMaximize2 size={16} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal for iOS / Android / iPad / Web */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-fade-in touch-none overscroll-none h-[100dvh] w-[100dvw]"
          onClick={() => {
            setSelectedIndex(null);
            setIsZoomed(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery fullscreen view"
        >
          {/* Top Bar Controls (respects iOS Safe Area Notch / Dynamic Island) */}
          <div
            className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white pr-3 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#DED5C7] font-serif truncate">{title}</h4>
              <p className="text-[11px] sm:text-xs text-[#A8B498]">
                {selectedIndex + 1} of {images.length} • <span className="hidden sm:inline">Swipe or use arrows</span><span className="sm:hidden">Swipe to browse</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed((prev) => !prev);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-[#586348] text-white rounded-full transition-all duration-200 active:scale-95"
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                title={isZoomed ? "Zoom out" : "Zoom in"}
              >
                {isZoomed ? <FiZoomOut size={18} /> : <FiZoomIn size={18} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIndex(null);
                  setIsZoomed(false);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-[#586348] text-white rounded-full transition-all duration-200 active:scale-95"
                aria-label="Close fullscreen"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Main Stage with Image */}
          <div
            className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center px-2 sm:px-6 my-auto overflow-hidden"
            onClick={handleDoubleTap}
          >
            {/* Previous Button (Desktop / Tablet) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
                setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
              }}
              className="hidden sm:flex absolute left-4 lg:left-6 z-20 w-12 h-12 items-center justify-center bg-black/40 hover:bg-[#586348] border border-white/15 text-white rounded-full transition-all duration-200 shadow-xl active:scale-95 backdrop-blur-md"
              aria-label="Previous photo"
            >
              <FiChevronLeft size={24} />
            </button>

            {/* Displayed Image with Dynamic Aspect Ratio & Double-Tap Scale */}
            <div
              className={`relative w-full h-full max-h-[calc(100dvh-170px)] sm:max-h-[calc(100dvh-180px)] flex items-center justify-center transition-transform duration-300 ease-out ${
                isZoomed ? "scale-150 sm:scale-175 cursor-zoom-out overflow-auto" : "cursor-zoom-in"
              }`}
            >
              <Image
                src={images[selectedIndex]}
                alt={`${title} photo ${selectedIndex + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1200px"
                className="object-contain select-none pointer-events-none"
                priority
              />
            </div>

            {/* Next Button (Desktop / Tablet) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
                setSelectedIndex((selectedIndex + 1) % images.length);
              }}
              className="hidden sm:flex absolute right-4 lg:right-6 z-20 w-12 h-12 items-center justify-center bg-black/40 hover:bg-[#586348] border border-white/15 text-white rounded-full transition-all duration-200 shadow-xl active:scale-95 backdrop-blur-md"
              aria-label="Next photo"
            >
              <FiChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Thumbnails Strip (respects iOS Home Bar safe area) */}
          <div
            className="w-full px-4 py-3 sm:py-4 flex justify-center z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 max-w-[95vw] overflow-x-auto py-1.5 px-3 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-md scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative w-11 h-8 sm:w-14 sm:h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 active:scale-95 ${
                    selectedIndex === idx
                      ? "border-[#586348] scale-105 shadow-md opacity-100"
                      : "border-transparent opacity-40 hover:opacity-80"
                  }`}
                  aria-label={`Jump to photo ${idx + 1}`}
                >
                  <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
