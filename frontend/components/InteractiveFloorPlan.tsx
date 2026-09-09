"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiBookmark, FiCheck, FiCompass, FiMaximize, FiSun } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface RoomPlanData {
  id: string;
  name: string;
  bnName: string;
  area: string;
  orientation: string;
  photo: string;
  concept: string;
  designDecisions: string[];
  materials: string[];
  planCoord: {
    x: number;
    y: number;
    w: number;
    h: number;
    tagX: number;
    tagY: number;
  };
}

const ROOMS_DATA: RoomPlanData[] = [
  {
    id: "foyer",
    name: "01 Foyer Gallery",
    bnName: "প্রবেশ গ্যালারি",
    area: "240 sq.ft",
    orientation: "East Entry / Filtered Welcome",
    photo: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80",
    concept:
      "A decompression threshold from the urban bustle of Dhaka. Concealed shoe joinery and an antiqued mirror create an immediate sense of quiet order.",
    designDecisions: [
      "Floor-to-ceiling concealed teak push-latches with zero exterior hardware",
      "Soft indirect 2400K architectural cove lighting to relax the eyes upon arrival",
      "Seamless limestone plinth floor with integrated brass welcome threshold",
    ],
    materials: ["Bleached Teak", "Roman Limestone", "Aged Brass"],
    planCoord: { x: 40, y: 380, w: 180, h: 180, tagX: 130, tagY: 480 },
  },
  {
    id: "living",
    name: "02 Living Pavilion",
    bnName: "লিভিং প্যাভিলিয়ন",
    area: "850 sq.ft",
    orientation: "North & West / Panoramic Daylight",
    photo: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85",
    concept:
      "The social and meditative core of the residence. Low-profile seating preserves visual continuity toward the landscaped verandah.",
    designDecisions: [
      "Sunken travertine plinth coffee table anchoring the central seating cluster",
      "Acoustic fluted teak wall paneling concealing high-definition surround speakers",
      "Motorized sheer linen drops tempering afternoon glare while retaining tree canopy views",
    ],
    materials: ["Navona Travertine", "Chittagong Teak", "Belgian Linen"],
    planCoord: { x: 230, y: 220, w: 420, h: 340, tagX: 440, tagY: 390 },
  },
  {
    id: "dining",
    name: "03 Dining Alcove",
    bnName: "ডাইনিং স্পেস",
    area: "340 sq.ft",
    orientation: "North Light Corridor",
    photo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=85",
    concept:
      "Intimate banquet dining framed between the central living pavilion and the sculptural culinary studio.",
    designDecisions: [
      "Solid 8-seater live-edge teak dining slab mounted on blackened bronze trestles",
      "Recessed architectural ceiling trough with dimmable linear warm downlighting",
      "Custom wall credenza housing fine dining chinaware with internal warm LED wash",
    ],
    materials: ["Solid Teak Slab", "Blackened Bronze", "Textured Plaster"],
    planCoord: { x: 230, y: 60, w: 280, h: 150, tagX: 370, tagY: 140 },
  },
  {
    id: "kitchen",
    name: "04 Culinary Studio",
    bnName: "রান্নাঘর ও ব্রেকফাস্ট বার",
    area: "380 sq.ft",
    orientation: "North-East / Morning Light",
    photo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85",
    concept:
      "A high-performance gourmet kitchen balancing high-heat Bengali cooking with social open-concept gathering.",
    designDecisions: [
      "Taj Mahal quartzite waterfall island serving as morning breakfast bar and prep hub",
      "Secondary wet-kitchen sealed behind motorized fluted acoustic glass pocket doors",
      "Integrated 1,200 m³/hr downdraft extraction preventing culinary vapor escape",
    ],
    materials: ["Taj Mahal Quartzite", "Fluted Glass", "Matte Bronze"],
    planCoord: { x: 520, y: 60, w: 260, h: 220, tagX: 650, tagY: 170 },
  },
  {
    id: "master",
    name: "05 Master Suite",
    bnName: "মাস্টার স্যুট",
    area: "520 sq.ft",
    orientation: "South-East / Gentle Dawn Illumination",
    photo: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85",
    concept:
      "An acoustic sanctuary for restorative rest. Full-width upholstered headboard plinth and concealed walk-in wardrobe.",
    designDecisions: [
      "Double acoustic wall partitions dropping outside arterial traffic sound by 34 dB",
      "Concealed pocket door connecting to a private meditation alcove and terrace",
      "Indirect nocturnal warm lighting calibrated at 2200K to prepare the circadian cycle for sleep",
    ],
    materials: ["Smoked Oak", "Bouclé Wool", "Unlacquered Brass"],
    planCoord: { x: 660, y: 290, w: 290, h: 270, tagX: 800, tagY: 420 },
  },
  {
    id: "bath",
    name: "06 Spa Bathroom Sanctuary",
    bnName: "স্পা বাথরুম",
    area: "180 sq.ft",
    orientation: "East Facing Clerestory",
    photo: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85",
    concept:
      "A private bath ritual framed in monolithic Carrara marble and warm water rainfalls.",
    designDecisions: [
      "Freestanding stone soaking tub positioned beneath high-level frosted privacy window",
      "Concealed thermostatic shower valves with ceiling-recessed chromotherapy rain head",
      "Floating teak vanity with backlit mirror defogger and undermount marble basin",
    ],
    materials: ["Carrara Marble", "Waterproof Teak", "Brushed Gunmetal"],
    planCoord: { x: 790, y: 60, w: 160, h: 220, tagX: 870, tagY: 170 },
  },
];

export function InteractiveFloorPlan() {
  const [activeRoomId, setActiveRoomId] = useState<string>("living");
  const { toggleItem, hasItem } = useSpaceCollection();

  const currentRoom = ROOMS_DATA.find((r) => r.id === activeRoomId) || ROOMS_DATA[1];
  const isSaved = hasItem(`plan-${currentRoom.id}`);

  return (
    <section className="section bg-[#FAF7F2] border-b border-[#DDD5C8] relative">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>Spatial Exploration</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Interactive Project Floor Plan
          </h2>

          <p className="text-base sm:text-lg text-[#5A6057] mt-3 leading-relaxed">
            Click any zone on the architectural floor plan below to inspect its photography, interior design rationale, and bespoke material specification.
          </p>
        </div>

        {/* Room Navigation Chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ROOMS_DATA.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoomId(r.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRoomId === r.id
                  ? "bg-[#242622] text-[#FAF7F2] shadow-md"
                  : "bg-[#F4F0E8] text-[#5A6057] border border-[#DDD5C8] hover:bg-[#DDD5C8]/40 hover:text-[#242622]"
              }`}
            >
              <span>{r.name}</span>
            </button>
          ))}
        </div>

        {/* Interactive Floor Plan & Room Inspector */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Vector Floor Plan (Col 7) */}
          <div className="lg:col-span-7 bg-[#242622] p-4 sm:p-6 rounded-2xl border border-[#DDD5C8] shadow-2xl relative select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-[#DDD5C8]">
              <span className="flex items-center gap-1.5 text-white">
                <FiCompass className="text-[#A45138]" /> ARCHITECTURAL MASTER PLAN • 3,400 SQ.FT
              </span>
              <span className="text-[#727A61]">CLICK ANY ROOM TO INSPECT</span>
            </div>

            {/* Floor Plan SVG */}
            <div className="relative aspect-[16/11] mt-3 bg-[#171815] rounded-xl overflow-hidden border border-white/10">
              <svg
                viewBox="0 0 1000 620"
                className="w-full h-full stroke-current"
                style={{ strokeWidth: 1.5 }}
              >
                <defs>
                  <pattern id="planGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="rgba(221, 213, 200, 0.05)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#planGrid)" />

                {/* Exterior Wall Boundary */}
                <rect
                  x="30"
                  y="40"
                  width="930"
                  height="540"
                  fill="none"
                  stroke="#DDD5C8"
                  strokeWidth="4"
                />

                {/* Clickable Room Rectangles */}
                {ROOMS_DATA.map((room) => {
                  const isCurrent = room.id === activeRoomId;
                  const c = room.planCoord;
                  return (
                    <g
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className="cursor-pointer group"
                    >
                      {/* Room Area Fill */}
                      <rect
                        x={c.x}
                        y={c.y}
                        width={c.w}
                        height={c.h}
                        fill={
                          isCurrent
                            ? "rgba(164, 81, 56, 0.35)"
                            : "rgba(114, 122, 97, 0.12)"
                        }
                        stroke={isCurrent ? "#A45138" : "#DDD5C8"}
                        strokeWidth={isCurrent ? 2.5 : 1}
                        className="transition-all duration-300 group-hover:fill-opacity-40"
                      />

                      {/* Room Label */}
                      <text
                        x={c.tagX}
                        y={c.tagY - 8}
                        textAnchor="middle"
                        fill={isCurrent ? "#FFFFFF" : "#DDD5C8"}
                        fontSize="12"
                        fontWeight={isCurrent ? "bold" : "normal"}
                        fontFamily="monospace"
                        className="pointer-events-none transition-colors"
                      >
                        {room.name.toUpperCase()}
                      </text>
                      <text
                        x={c.tagX}
                        y={c.tagY + 10}
                        textAnchor="middle"
                        fill={isCurrent ? "#A45138" : "#727A61"}
                        fontSize="10"
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        {room.area}
                      </text>
                    </g>
                  );
                })}

                {/* Structural Concrete Pillars */}
                <rect x="25" y="35" width="20" height="20" fill="#DDD5C8" />
                <rect x="480" y="35" width="20" height="20" fill="#DDD5C8" />
                <rect x="945" y="35" width="20" height="20" fill="#DDD5C8" />
                <rect x="25" y="565" width="20" height="20" fill="#DDD5C8" />
                <rect x="480" y="565" width="20" height="20" fill="#DDD5C8" />
                <rect x="945" y="565" width="20" height="20" fill="#DDD5C8" />

                {/* Entry Arrow Indicator */}
                <g transform="translate(130, 565)">
                  <line x1="0" y1="20" x2="0" y2="0" stroke="#A45138" strokeWidth="2" />
                  <polygon points="-4,6 0,0 4,6" fill="#A45138" />
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    fill="#A45138"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ENTRY
                  </text>
                </g>
              </svg>
            </div>

            <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-[#DDD5C8]">
              <span className="text-[#DDD5C8]/80">CURRENTLY FOCUSING: {currentRoom.name}</span>
              <span className="text-[#A45138]">{currentRoom.area}</span>
            </div>
          </div>

          {/* Right Column: Room Inspector & Photograph (Col 5) */}
          <div className="lg:col-span-5 bg-[#FAF7F2] p-6 rounded-2xl border border-[#DDD5C8] shadow-md space-y-5">
            {/* Room Photo */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#DDD5C8] border border-[#DDD5C8] group">
              <Image
                key={currentRoom.photo}
                src={currentRoom.photo}
                alt={currentRoom.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover animate-fade-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/70 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="architectural-tag text-[#DDD5C8] text-[9px] block">
                  {currentRoom.bnName}
                </span>
                <h4 className="font-serif text-lg font-semibold">{currentRoom.name}</h4>
              </div>
            </div>

            {/* Room Specs & Rationale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#727A61] pb-2 border-b border-[#DDD5C8]">
                <span className="flex items-center gap-1.5">
                  <FiMaximize size={13} /> {currentRoom.area}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiSun size={13} /> {currentRoom.orientation}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#5A6057] leading-relaxed">
                {currentRoom.concept}
              </p>

              <div>
                <span className="architectural-tag text-[#727A61] block mb-2">
                  Architectural Decisions
                </span>
                <div className="space-y-2">
                  {currentRoom.designDecisions.map((dec, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-[#F4F0E8] border border-[#DDD5C8]/70 text-xs text-[#242622] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A45138] shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{dec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material Palette in this Room */}
              <div className="pt-2">
                <span className="architectural-tag text-[#727A61] block mb-1.5">
                  Room Material Palette
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRoom.materials.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#EEF1EA] text-[#575E4A] text-xs font-medium border border-[#D0D6C7]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#DDD5C8] flex items-center justify-between gap-3">
                <button
                  onClick={() =>
                    toggleItem({
                      id: `plan-${currentRoom.id}`,
                      type: "room",
                      title: currentRoom.name,
                      subtitle: `${currentRoom.area} • ${currentRoom.orientation}`,
                      image: currentRoom.photo,
                      notes: currentRoom.concept,
                    })
                  }
                  className={`btn text-xs px-4 py-2.5 flex items-center gap-1.5 ${
                    isSaved ? "btn-secondary border-[#A45138] text-[#A45138]" : "btn-clay"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <FiCheck size={14} /> Saved in Collection
                    </>
                  ) : (
                    <>
                      <FiBookmark size={14} /> Save Room Idea
                    </>
                  )}
                </button>

                <Link
                  href="/portfolio"
                  className="text-xs font-semibold text-[#242622] hover:text-[#A45138] underline underline-offset-4"
                >
                  See Similar Spaces →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
