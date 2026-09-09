import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME_BN, BRAND_NAME_EN } from "../lib/constants";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label={`${BRAND_NAME_EN} home`} className="brand-logo group">
      <Image
        src="/logo.svg"
        alt={`${BRAND_NAME_EN} Emblem`}
        width={48}
        height={48}
        priority
        className="brand-logo-mark transition-transform duration-300 group-hover:scale-105"
      />
      <span className="min-w-0">
        <span className={`block font-serif text-[26px] md:text-[27px] font-bold leading-none tracking-tight transition-colors ${light ? "text-[#FAF7F2] group-hover:text-[#D4AF37]" : "text-[#242824] group-hover:text-[#1B4D3E]"}`}>
          {BRAND_NAME_EN}
        </span>
        <span className={`mt-1.5 flex items-center gap-2 text-[10px] leading-none tracking-wider uppercase font-medium ${light ? "text-[#C2C9BA]" : "text-[#626D59]"}`}>
          <span lang="bn" className="font-semibold normal-case tracking-normal">{BRAND_NAME_BN}</span>
          <span aria-hidden="true" className="h-0.5 w-0.5 rounded-full bg-[#C5A059]" />
          <span>Interior Architecture</span>
        </span>
      </span>
    </Link>
  );
}
