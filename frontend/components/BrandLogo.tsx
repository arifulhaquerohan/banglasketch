import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME_EN, BRAND_TAGLINE_BN } from "../lib/constants";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND_NAME_EN} home`}
      className={`brand-logo transition-opacity duration-200 hover:opacity-95${light ? " brand-logo-footer" : ""}`}
    >
      <Image
        src="/brand-logo.png"
        alt={`${BRAND_NAME_EN} — ${BRAND_TAGLINE_BN}`}
        width={1020}
        height={820}
        priority={!light}
        className="brand-logo-image"
      />
    </Link>
  );
}
