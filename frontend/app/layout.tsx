import type { Metadata } from "next";
import {
  Instrument_Serif,
  Manrope,
  Noto_Serif_Bengali,
  Noto_Sans_Bengali,
} from "next/font/google";
import { FloatingWhatsApp } from "../components/FloatingWhatsApp";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { MaintenancePopup } from "../components/MaintenancePopup";
import { MobileStickyBar } from "../components/MobileStickyBar";
import { SpaceCollectionProvider } from "../components/SpaceCollectionContext";
import { SpaceCollectionDrawer } from "../components/SpaceCollectionDrawer";
import "../styles/globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-bn",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-bn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://banglasketch.com"),
  title: "From Space to Sanctuary • বাংলা স্কেচ Bangla Sketch — Architectural Studio",
  description: "A better way to feel at home. Bespoke interior architecture and turnkey craftsmanship in Dhaka, Bangladesh.",
  keywords: "interior design, architectural studio, Dhaka, Bangladesh, kitchen, bedroom, living room, bathroom, Banglasketch, বাংলাস্কেচ, home renovation, luxury design",
  openGraph: {
    title: "বাংলা স্কেচ • Bangla Sketch — Warm Architectural Studio | Dhaka",
    description: "Dhaka's premium interior design firm — 200+ completed projects over 10+ years. Thoughtful interiors, everyday living.",
    images: [{ url: "/logo-512.png", width: 512, height: 512 }],
    type: "website",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo-64.png", sizes: "64x64", type: "image/png" },
      { url: "/logo-128.png", sizes: "128x128", type: "image/png" },
      { url: "/logo-256.png", sizes: "256x256", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/logo-256.png", sizes: "256x256", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${manrope.variable} ${notoSerifBengali.variable} ${notoSansBengali.variable} ${manrope.className}`}
    >
      <body className="bg-ivory text-charcoal overflow-x-hidden min-h-screen selection:bg-olive-tint selection:text-olive-dark font-sans">
        <SpaceCollectionProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-3 focus:font-bold focus:text-ivory-light focus:shadow-xl"
          >
            Skip to main content
          </a>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "InteriorDesignService",
                name: "Banglasketch",
                alternateName: "বাংলা স্কেচ",
                url: "https://banglasketch.com",
                logo: "https://banglasketch.com/logo-512.png",
                description: "Warm architectural interior studio in Dhaka, Bangladesh. From Space to Sanctuary — 200+ completed projects, 10+ years of craftsmanship.",
                address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
                telephone: "+8801712458794",
                priceRange: "$$",
                sameAs: ["https://youtube.com/@banglasketch", "https://facebook.com/banglasketch", "https://instagram.com/banglasketch"],
              }),
            }}
          />
          <Navbar />
          <MaintenancePopup />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <Footer />
          <FloatingWhatsApp />
          <MobileStickyBar />
          <SpaceCollectionDrawer />
        </SpaceCollectionProvider>
      </body>
    </html>
  );
}
