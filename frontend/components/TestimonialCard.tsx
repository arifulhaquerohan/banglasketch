import Image from "next/image";
import { FiStar } from "react-icons/fi";
import { getOptimizedCloudinaryUrl } from "../lib/cloudinary";

interface TestimonialCardProps {
  clientName: string;
  clientLocation?: string;
  quote: string;
  rating?: number;
  clientImage?: string;
}

export function TestimonialCard({
  clientName,
  clientLocation,
  quote,
  rating = 5,
  clientImage,
}: TestimonialCardProps) {
  const optimizedAvatar = clientImage
    ? getOptimizedCloudinaryUrl(clientImage, {
        width: 120,
        height: 120,
        quality: "auto:good",
        crop: "fill",
      })
    : undefined;

  return (
    <div className="card p-6 sm:p-7 relative overflow-hidden bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <FiStar
              key={i}
              size={15}
              className={i < rating ? "text-[#586348] fill-[#586348]" : "text-[#DED5C7]"}
            />
          ))}
        </div>
        <p className="font-serif text-[#242824] mb-6 italic leading-relaxed text-base sm:text-lg">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-3.5 pt-4 border-t border-[#DED5C7]/70">
        {optimizedAvatar ? (
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#DED5C7] shadow-sm shrink-0">
            <Image src={optimizedAvatar} alt={clientName} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] font-serif font-bold text-base shadow-sm shrink-0">
            {clientName.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-semibold text-sm text-[#242824] leading-snug">{clientName}</div>
          {clientLocation && (
            <div className="text-xs text-[#586348] font-medium mt-0.5">{clientLocation}</div>
          )}
        </div>
      </div>
    </div>
  );
}
