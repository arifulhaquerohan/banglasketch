"use client";

import React, { useState } from "react";
import { FiBookmark, FiCheck, FiInfo, FiX } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

export interface HotspotItem {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  title: string;
  category: "Storage" | "Daylight" | "Circulation" | "Comfort" | "Material";
  description: string;
  spec?: string;
}

interface InteractiveHotspotProps {
  hotspots: HotspotItem[];
  projectName?: string;
  showToggle?: boolean;
}

export function InteractiveHotspotLayer({
  hotspots,
  projectName = "Sanctuary Space",
  showToggle = true,
}: InteractiveHotspotProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const { toggleItem, hasItem } = useSpaceCollection();

  return (
    <>
      {/* Toggle button */}
      {showToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEnabled(!enabled);
          }}
          className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all duration-300 backdrop-blur-md shadow-md ${
            enabled
              ? "bg-[#242622]/85 text-[#F4F0E8] border border-[#DDD5C8]/30"
              : "bg-[#F4F0E8]/85 text-[#242622] border border-[#242622]/20"
          }`}
          title="Toggle architectural rationale annotations"
        >
          <FiInfo size={13} className={enabled ? "text-[#727A61]" : "text-[#A45138]"} />
          <span>Why this works</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              enabled ? "bg-[#727A61]" : "bg-[#DDD5C8]"
            }`}
          />
        </button>
      )}

      {/* Hotspots rendering */}
      {enabled &&
        hotspots.map((h, idx) => {
          const isActive = activeId === h.id;
          return (
            <div
              key={h.id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(isActive ? null : h.id);
                }}
                className={`relative group flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform duration-300 focus:outline-none ${
                  isActive ? "scale-115" : "hover:scale-110"
                }`}
                aria-label={`View design decision: ${h.title}`}
                aria-expanded={isActive}
              >
                {/* Pulsing architectural ring */}
                <span
                  className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                    isActive ? "bg-[#A45138]" : "bg-[#727A61]"
                  }`}
                />
                <span
                  className={`relative w-full h-full rounded-full border border-white/80 shadow-lg flex items-center justify-center text-[11px] font-mono font-bold transition-colors ${
                    isActive
                      ? "bg-[#A45138] text-white"
                      : "bg-[#242622]/90 text-[#F4F0E8] group-hover:bg-[#727A61]"
                  }`}
                >
                  0{idx + 1}
                </span>
              </button>

              {/* Tooltip on Desktop / Inline Popover */}
              {isActive && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-10 sm:top-11 w-64 sm:w-72 bg-[#FAF7F2] text-[#242622] rounded-xl p-4 shadow-2xl border border-[#DDD5C8] z-30 animate-scale-in text-left pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#DDD5C8]/70">
                    <span className="architectural-tag text-[#727A61]">{h.category} Principle</span>
                    <button
                      onClick={() => setActiveId(null)}
                      className="text-[#5A6057] hover:text-[#242622]"
                      aria-label="Close note"
                    >
                      <FiX size={15} />
                    </button>
                  </div>

                  <h5 className="font-serif text-base font-semibold text-[#242622] mt-2 mb-1">
                    {h.title}
                  </h5>
                  <p className="text-xs text-[#5A6057] leading-relaxed mb-2.5">
                    {h.description}
                  </p>

                  {h.spec && (
                    <div className="bg-[#EEF1EA] px-2.5 py-1.5 rounded text-[10px] font-mono text-[#575E4A] mb-3">
                      SPEC: {h.spec}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#DDD5C8]/60 flex items-center justify-between">
                    <span className="text-[10px] text-[#727A61] uppercase tracking-wider">
                      Architectural Note
                    </span>
                    <button
                      onClick={() =>
                        toggleItem({
                          id: `hotspot-${h.id}`,
                          type: "room",
                          title: h.title,
                          subtitle: projectName,
                          notes: h.description,
                        })
                      }
                      className="text-xs font-semibold text-[#A45138] hover:underline flex items-center gap-1"
                    >
                      {hasItem(`hotspot-${h.id}`) ? (
                        <>
                          <FiCheck size={12} /> Saved
                        </>
                      ) : (
                        <>
                          <FiBookmark size={12} /> Save Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}
