import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME_BN, BRAND_NAME_EN, BRAND_TAGLINE_BN } from "../lib/constants";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND_NAME_EN} home`}
      className="brand-logo group inline-flex min-w-0 items-center gap-3.5 transition-opacity duration-200 hover:opacity-95"
    >
      <span
        className={`brand-logo-mark-shell ${
          light ? "is-light-footer" : "is-light-header"
        }`}
      >
        <Image
          src={light ? "/logo-icon-light.svg" : "/logo-icon.svg"}
          alt={`${BRAND_NAME_EN} Logo`}
          width={52}
          height={52}
          priority
          className="brand-logo-mark shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      <span className="brand-logo-copy min-w-0">
        <span className="block font-serif text-[27px] md:text-[29px] font-bold leading-none tracking-tight transition-colors">
          <span className={light ? "text-[#FAF7F2] group-hover:text-[#E8EDE0]" : "text-[#222524]"}>
            bangla
          </span>{" "}
          <span
            className={
              light
                ? "text-[#E57358] font-sans font-semibold text-[22px] tracking-wider"
                : "text-[#D05A3F] font-sans font-semibold text-[22px] tracking-wider"
            }
          >
            sketch
          </span>
        </span>
        <span
          className={`mt-1.5 flex items-center gap-2 text-[10.5px] leading-none tracking-wider font-medium ${
            light ? "text-[#DCE2D5]" : "text-olive-dark"
          }`}
        >
          <span lang="bn" className="font-semibold normal-case tracking-normal">
            {BRAND_NAME_BN}
          </span>
          <span
            aria-hidden="true"
            className={`h-1 w-1 rounded-full ${light ? "bg-[#E57358]" : "bg-[#D05A3F]"}`}
          />
          <span lang="bn" className="normal-case tracking-normal opacity-90">
            {BRAND_TAGLINE_BN}
          </span>
        </span>
      </span>
    </Link>
  );
}
