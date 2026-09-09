"use client";

import { useState } from "react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { FiCheckCircle, FiCompass, FiShield, FiSend, FiInfo } from "react-icons/fi";

const FINISH_TIERS = [
  {
    id: "essential",
    name: "Essential Elegance",
    ratePerSqFt: 1400,
    desc: "Clean modern design, melamine/HDF boards, high-grade hardware, aesthetic paint & lighting tracks.",
  },
  {
    id: "luxury",
    name: "Contemporary Luxury",
    ratePerSqFt: 2100,
    desc: "Gorjan/Oak veneer accents, imported quartz countertops, fluted acoustic panels, concealed ambient lighting.",
    popular: true,
  },
  {
    id: "signature",
    name: "Architectural Signature",
    ratePerSqFt: 3200,
    desc: "Italian marble feature walls, custom solid seasoned teak woodwork, motorized blinds, bespoke luxury fittings.",
  },
];

const ROOM_OPTIONS = [
  { id: "kitchen", label: "Modular Chef's Kitchen", defaultSelected: true },
  { id: "master-bed", label: "Master Bedroom Suite", defaultSelected: true },
  { id: "living", label: "Living & Dining Lounge", defaultSelected: true },
  { id: "bathrooms", label: "Modern Bathrooms", defaultSelected: true },
  { id: "guest-bed", label: "Guest / Kids Bedroom", defaultSelected: false },
  { id: "balcony", label: "Biophilic Green Balcony", defaultSelected: false },
];

export function CostEstimator() {
  const [sqft, setSqft] = useState<number>(1600);
  const [tier, setTier] = useState<string>("luxury");
  const [selectedRooms, setSelectedRooms] = useState<string[]>(["kitchen", "master-bed", "living", "bathrooms"]);
  const [clientLocation, setClientLocation] = useState<string>("Gulshan / Banani");

  const selectedTierObj = FINISH_TIERS.find((t) => t.id === tier) || FINISH_TIERS[1];

  const baseCost = sqft * selectedTierObj.ratePerSqFt;
  const roomFactor = 0.7 + (selectedRooms.length / ROOM_OPTIONS.length) * 0.4;
  const estimatedTotal = Math.round(baseCost * roomFactor);
  const minRange = Math.round(estimatedTotal * 0.9);
  const maxRange = Math.round(estimatedTotal * 1.15);

  const toggleRoom = (id: string) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((r) => r !== id) : prev) : [...prev, id]
    );
  };

  const getWhatsAppEstimateUrl = () => {
    const message = `Hello Banglasketch! 🏡

I just calculated an estimate on your website:
• Apartment Area: ${sqft} sq ft (${clientLocation})
• Finish Package: ${selectedTierObj.name}
• Included Rooms: ${selectedRooms.join(", ")}
• Estimated Budget: ৳ ${(minRange / 100000).toFixed(2)} Lacs - ৳ ${(maxRange / 100000).toFixed(2)} Lacs

Could you share a detailed material breakdown and free 3D design consultation?`;
    return `https://wa.me/8801712458794?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6 sm:p-10 border border-[#DED5C7] bg-[#FCFAF7] shadow-md relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#EDF1EA] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none opacity-60" />

        {/* Step 1: Area Slider */}
        <div className="mb-10 relative">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="badge bg-[#EDF1EA] text-[#444D37] border border-[#D5DEC4] mb-1">Step 1</span>
              <label htmlFor="sqft-range" className="font-serif text-lg font-semibold text-[#242824] block">
                Apartment Size (Square Feet)
              </label>
              <p className="text-xs text-[#737D73] mt-0.5">Drag to match your Dhaka apartment or floor layout</p>
            </div>
            <div className="text-right">
              <span className="font-serif text-3xl font-bold text-[#586348]">{sqft.toLocaleString()}</span>
              <span className="text-xs text-[#737D73] ml-1">sq ft</span>
            </div>
          </div>

          <input
            id="sqft-range"
            type="range"
            min={600}
            max={5000}
            step={50}
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="w-full h-2 bg-[#DED5C7] rounded-lg appearance-none cursor-pointer accent-[#586348]"
          />
          <div className="flex justify-between text-[11px] text-[#737D73] mt-2.5 font-medium">
            <span>600 sq ft (Compact Unit)</span>
            <span>1,600 sq ft (Standard 3BHK)</span>
            <span>3,000+ sq ft (Duplex/Penthouse)</span>
          </div>
        </div>

        {/* Step 2: Location */}
        <div className="mb-10 relative">
          <span className="badge bg-[#EDF1EA] text-[#444D37] border border-[#D5DEC4] mb-3 inline-block">Step 2</span>
          <label className="font-serif text-lg font-semibold text-[#242824] block mb-3">
            Apartment Location in Dhaka
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {["Gulshan / Banani", "Dhanmondi / Lalmatia", "Uttara / Mirpur DOHS", "Bashundhara / Other"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setClientLocation(loc)}
                className={`p-3.5 text-xs font-semibold rounded-xl border transition-all duration-200 text-center ${
                  clientLocation === loc
                    ? "bg-[#242824] border-[#242824] text-[#FCFAF7] shadow-sm"
                    : "bg-[#FCFAF7] border-[#DED5C7] text-[#5A625A] hover:border-[#586348] hover:text-[#242824]"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Finish Tier */}
        <div className="mb-10 relative">
          <span className="badge bg-[#EDF1EA] text-[#444D37] border border-[#D5DEC4] mb-3 inline-block">Step 3</span>
          <label className="font-serif text-lg font-semibold text-[#242824] block mb-3">
            Select Interior Finish Level
          </label>
          <div className="grid sm:grid-cols-3 gap-4">
            {FINISH_TIERS.map((t) => {
              const active = tier === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    active
                      ? "bg-[#242824] border-[#586348] shadow-lg ring-2 ring-[#586348]/30"
                      : "bg-[#FCFAF7] border-[#DED5C7] hover:border-[#586348]/60"
                  }`}
                >
                  {t.popular && (
                    <span className="absolute -top-3 right-3 bg-[#586348] text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  )}
                  <h4 className={`font-serif font-semibold text-base mb-1.5 ${active ? "text-[#FCFAF7]" : "text-[#242824]"}`}>
                    {t.name}
                  </h4>
                  <div className={`font-bold text-lg mb-2 ${active ? "text-[#DED5C7]" : "text-[#586348]"}`}>
                    ৳ {t.ratePerSqFt.toLocaleString()}{" "}
                    <span className={`text-xs font-normal ${active ? "text-[#829070]" : "text-[#737D73]"}`}>/ sq ft approx</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${active ? "text-[#A8B2A8]" : "text-[#5A625A]"}`}>
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Included Rooms */}
        <div className="mb-10 relative">
          <span className="badge bg-[#EDF1EA] text-[#444D37] border border-[#D5DEC4] mb-3 inline-block">Step 4</span>
          <label className="font-serif text-lg font-semibold text-[#242824] block mb-3">
            Select Included Spaces
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROOM_OPTIONS.map((room) => {
              const isSelected = selectedRooms.includes(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? "bg-[#242824]/90 border-[#242824] text-[#FCFAF7]"
                      : "bg-[#FCFAF7] border-[#DED5C7] text-[#5A625A] hover:border-[#586348]/60 hover:text-[#242824]"
                  }`}
                >
                  <FiCheckCircle
                    className={`shrink-0 ${isSelected ? "text-[#586348]" : "text-[#DED5C7]"}`}
                    size={16}
                  />
                  <span>{room.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estimation Summary Box */}
        <div className="bg-[#FCFAF7] border-2 border-[#586348]/50 p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-repeat bg-[url('data:image/svg+xml,%3Csvg width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 20 20&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M10 0L20 10L10 20L0 10Z&quot; fill=&quot;%23586348&quot;/&gt;%3C/svg%3E')]" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#586348] text-xs font-bold uppercase tracking-wider mb-2">
                <FiCompass className="text-[#586348]" />
                <span>Estimated Turnkey Cost</span>
              </div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#242824]">
                ৳ {(minRange / 100000).toFixed(2)} - {(maxRange / 100000).toFixed(2)}{" "}
                <span className="text-base text-[#586348] font-normal">Lacs</span>
              </div>
              <p className="text-xs text-[#5A625A] mt-2.5 flex items-center gap-1.5">
                <FiInfo className="text-[#586348]" />
                Includes 3D architectural renders, site supervision, woodwork, hardware, paint & illumination.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={getWhatsAppEstimateUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp text-sm px-6 py-3.5 font-semibold shadow-sm"
              >
                <FaWhatsapp className="text-lg" />
                <span>Get Blueprint on WhatsApp</span>
              </a>
              <Link href="/contact" className="btn btn-primary text-sm px-6 py-3.5">
                Book Free Consultation
              </Link>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#DED5C7] text-xs text-[#5A625A] font-medium">
          <div className="flex items-center gap-2">
            <FiShield className="text-[#586348] text-base flex-shrink-0" />
            <span>Zero Hidden Costs & Fixed Contract</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-[#586348] text-base flex-shrink-0" />
            <span>10-Year Craftsmanship Warranty</span>
          </div>
          <div className="flex items-center gap-2">
            <FiSend className="text-[#586348] text-base flex-shrink-0" />
            <span>45 to 60-Day On-Time Handover Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
