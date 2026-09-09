"use client";

import { useId, useRef, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { getOptimizedCloudinaryUrl } from "../lib/cloudinary";

export interface BeforeAfterSlide {
  id?: string;
  title?: string;
  category?: string;
  before: string;
  after: string;
  beforeCaption?: string;
  afterCaption?: string;
}

export interface BeforeAfterSliderProps {
  slides?: BeforeAfterSlide[];
  before?: string;
  after?: string;
  beforeCaption?: string;
  afterCaption?: string;
  className?: string;
}

function isKnownDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "images.unsplash.com" ||
      parsed.hostname === "res.cloudinary.com" ||
      parsed.hostname.endsWith(".cloudinary.com")
    );
  } catch {
    return false;
  }
}

export function BeforeAfterSlider({
  slides,
  before,
  after,
  beforeCaption,
  afterCaption,
  className = "",
}: BeforeAfterSliderProps) {
  const normalizedSlides: BeforeAfterSlide[] = slides && slides.length > 0
    ? slides
    : before && after
    ? [{ before, after, beforeCaption, afterCaption }]
    : [];

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [pos, setPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const labelId = useId();

  const currentSlide = normalizedSlides[activeSlideIndex] || {
    before: before || "",
    after: after || "",
    beforeCaption,
    afterCaption,
  };

  const optimizedBefore = getOptimizedCloudinaryUrl(currentSlide.before, {
    width: 1600,
    quality: "auto:good",
  });
  const optimizedAfter = getOptimizedCloudinaryUrl(currentSlide.after, {
    width: 1600,
    quality: "auto:good",
  });

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rawX = clientX - rect.left;
    const percentage = (rawX / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, percentage)));
  }, []);

  const animateTo = useCallback((targetPos: number, durationMs = 320) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startPos = pos;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPos(startPos + (targetPos - startPos) * eased);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [pos]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updatePosition(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, updatePosition]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    setHasInteracted(true);
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    setHasInteracted(true);
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setPos((current) => Math.max(0, current - step));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setPos((current) => Math.min(100, current + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      animateTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      animateTo(100);
    }
  };

  const handleSlideChange = (newIndex: number) => {
    if (newIndex === activeSlideIndex) return;
    setActiveSlideIndex(newIndex);
    animateTo(50, 250);
  };

  if (!currentSlide.before || !currentSlide.after) {
    return null;
  }

  const isBeforeKnown = isKnownDomain(optimizedBefore);
  const isAfterKnown = isKnownDomain(optimizedAfter);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Tabs */}
      {normalizedSlides.length > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            {normalizedSlides.map((slide, idx) => {
              const isActive = idx === activeSlideIndex;
              const label = slide.category || slide.title || `Space ${idx + 1}`;
              return (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => handleSlideChange(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-[#242824] text-[#FCFAF7] shadow-sm"
                      : "bg-[#EDE7DE] text-[#5A625A] hover:bg-[#DED5C7] hover:text-[#242824] border border-[#DED5C7]"
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {Math.round(pos) !== 50 && (
            <button
              type="button"
              onClick={() => animateTo(50)}
              className="text-xs text-[#586348] hover:text-[#242824] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FCFAF7] border border-[#DED5C7] transition"
              title="Reset comparison to center (50%)"
            >
              <span>Reset 50/50</span>
            </button>
          )}
        </div>
      )}

      {/* Main Slider Container */}
      <div className="relative group/slider">
        <div
          ref={containerRef}
          className={`relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden select-none shadow-md border border-[#DED5C7] bg-[#ECE5DA] transition-shadow duration-300 ${
            isDragging ? "cursor-grabbing ring-2 ring-[#586348]" : "cursor-ew-resize hover:border-[#586348]"
          }`}
          style={{ touchAction: "pan-y" }}
          role="slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% before view revealed`}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => animateTo(50)}
        >
          <span id={labelId} className="sr-only">
            Before and after renovation comparison slider.
          </span>

          {/* Layer 1: AFTER image */}
          <div className="absolute inset-0 w-full h-full select-none pointer-events-none">
            <Image
              src={optimizedAfter}
              alt={currentSlide.afterCaption || "Finished interior design after renovation"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
              className="object-cover pointer-events-none select-none"
              draggable={false}
              unoptimized={!isAfterKnown}
            />
          </div>

          {/* Layer 2: BEFORE image */}
          <div
            className="absolute inset-0 w-full h-full select-none pointer-events-none overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          >
            <Image
              src={optimizedBefore}
              alt={currentSlide.beforeCaption || "Original space before renovation"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
              className="object-cover pointer-events-none select-none"
              draggable={false}
              unoptimized={!isBeforeKnown}
            />
          </div>

          {/* Vertical divider line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-20 -translate-x-1/2 bg-[#FCFAF7] shadow-[0_0_8px_rgba(0,0,0,0.4)]"
            style={{ left: `${pos}%` }}
          />

          {/* Center Handle Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none"
            style={{ left: `${pos}%` }}
          >
            <div
              className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                isDragging
                  ? "scale-110 bg-[#242824] border-[#FCFAF7] shadow-xl ring-4 ring-[#586348]/30 text-white"
                  : "bg-[#FCFAF7] border-[#242824] text-[#242824] shadow-lg group-hover/slider:scale-105"
              }`}
            >
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <div className="w-[1.5px] h-3 bg-current opacity-40 rounded-full" />
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {!hasInteracted && !isDragging && (
                <span className="absolute inset-0 rounded-full border border-[#586348] animate-ping opacity-40 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Quick-reveal: Before badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              animateTo(100);
            }}
            className={`absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all duration-200 border flex items-center gap-1.5 shadow-md ${
              pos > 85
                ? "bg-[#242824] text-[#FCFAF7] border-[#242824]"
                : "bg-[#242824]/80 text-[#FCFAF7] border-white/20 hover:bg-[#242824]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B86B52]" />
            Before
          </button>

          {/* Quick-reveal: After badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              animateTo(0);
            }}
            className={`absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all duration-200 border flex items-center gap-1.5 shadow-md ${
              pos < 15
                ? "bg-[#586348] text-white border-[#586348]"
                : "bg-[#586348]/85 text-white border-[#586348]/40 hover:bg-[#586348]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#829070]" />
            After Studio Work
          </button>

          {/* Bottom Captions */}
          {currentSlide.beforeCaption && (
            <div
              className={`absolute bottom-4 left-4 z-20 max-w-[45%] pointer-events-none transition-opacity duration-200 ${
                pos < 18 ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="bg-[#242824]/90 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-xs text-[#EDE7DE] shadow-md line-clamp-2">
                <span className="text-[#DED5C7] font-semibold mr-1.5">Original:</span>
                {currentSlide.beforeCaption}
              </div>
            </div>
          )}

          {currentSlide.afterCaption && (
            <div
              className={`absolute bottom-4 right-4 z-20 max-w-[45%] pointer-events-none transition-opacity duration-200 ${
                pos > 82 ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="bg-[#FCFAF7]/95 backdrop-blur-md border border-[#DED5C7] px-3.5 py-2 rounded-xl text-xs text-[#242824] shadow-md line-clamp-2 text-right">
                <span className="text-[#586348] font-semibold mr-1.5">Banglasketch:</span>
                {currentSlide.afterCaption}
              </div>
            </div>
          )}
        </div>

        {/* Previous & Next Room Arrows */}
        {normalizedSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => handleSlideChange((activeSlideIndex - 1 + normalizedSlides.length) % normalizedSlides.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#FCFAF7]/90 hover:bg-[#242824] text-[#242824] hover:text-white border border-[#DED5C7] flex items-center justify-center transition-all duration-200 shadow-md active:scale-95"
              aria-label="Previous space"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleSlideChange((activeSlideIndex + 1) % normalizedSlides.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#FCFAF7]/90 hover:bg-[#242824] text-[#242824] hover:text-white border border-[#DED5C7] flex items-center justify-center transition-all duration-200 shadow-md active:scale-95"
              aria-label="Next space"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#737D73] px-1">
        <span className="text-[#586348] font-medium">
          {currentSlide.title || "Renovation Comparison"}
        </span>
        <span className="hidden sm:inline">
          Drag divider to inspect architectural details
        </span>
      </div>
    </div>
  );
}
