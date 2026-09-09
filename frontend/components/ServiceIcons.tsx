import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

// Architectural Kitchen / Dining Icon
export function KitchenIcon({ className = "w-7 h-7 text-[#586348]", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Upper wall cabinet */}
      <path d="M3 3h18v6H3z" />
      <path d="M12 3v6" />
      {/* Range hood / counter line */}
      <path d="M7 9v3h10V9" />
      <circle cx="9" cy="16" r="1.5" />
      <circle cx="15" cy="16" r="1.5" />
      {/* Base Counter */}
      <path d="M3 13h18v8H3z" />
      <path d="M12 13v8" />
    </svg>
  );
}

// Master Bedroom Sanctuary Icon
export function BedroomIcon({ className = "w-7 h-7 text-[#586348]", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Headboard */}
      <path d="M3 5h18v6H3z" />
      {/* Pillows */}
      <path d="M6 11V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" />
      <path d="M13 11V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" />
      {/* Mattress / Frame */}
      <path d="M2 14h20v4H2z" />
      {/* Bed legs */}
      <path d="M4 18v3" />
      <path d="M20 18v3" />
    </svg>
  );
}

// Modern Living Lounge / Sofa Icon
export function LivingRoomIcon({ className = "w-7 h-7 text-[#586348]", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Backrest */}
      <path d="M5 8c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v4H5V8z" />
      {/* Armrests */}
      <path d="M2 11a2 2 0 0 1 2-2h1v8H3a1 1 0 0 1-1-1v-5z" />
      <path d="M19 9h1a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2V9z" />
      {/* Seat Cushion */}
      <path d="M5 12h14v5H5z" />
      {/* Legs */}
      <path d="M6 17v4" />
      <path d="M18 17v4" />
    </svg>
  );
}

// Luxury Spa Bathroom Icon
export function BathroomIcon({ className = "w-7 h-7 text-[#586348]", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Shower head & water lines */}
      <path d="M4 3v4a3 3 0 0 0 3 3h3" />
      <path d="M10 8l4 4" />
      <path d="M13 5l2 2" />
      {/* Freestanding Bath Tub */}
      <path d="M2 13h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-2z" />
      {/* Feet */}
      <path d="M5 21v1" />
      <path d="M19 21v1" />
    </svg>
  );
}

// Architectural Diamond Divider Emblem
export function ArchitecturalDivider({ className = "my-3" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#DED5C7] to-[#586348]" />
      <div className="relative flex items-center justify-center w-4 h-4">
        <span className="w-2 h-2 rotate-45 border border-[#586348] bg-[#F5F2EB]" />
        <span className="absolute w-1 h-1 rounded-full bg-[#586348]" />
      </div>
      <span className="w-12 h-[1px] bg-gradient-to-l from-transparent via-[#DED5C7] to-[#586348]" />
    </div>
  );
}

// Service icon lookup helper
export function getServiceIcon(id: string, className?: string, size?: number) {
  switch (id) {
    case "kitchen":
      return <KitchenIcon className={className} size={size} />;
    case "bedroom":
      return <BedroomIcon className={className} size={size} />;
    case "living-room":
      return <LivingRoomIcon className={className} size={size} />;
    case "bathroom":
      return <BathroomIcon className={className} size={size} />;
    default:
      return <KitchenIcon className={className} size={size} />;
  }
}
