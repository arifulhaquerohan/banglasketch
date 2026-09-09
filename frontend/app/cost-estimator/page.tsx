import type { Metadata } from "next";
import { CostEstimator } from "../../components/CostEstimator";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider } from "../../components/ServiceIcons";

export const metadata: Metadata = {
  title: "Interior Design Cost Estimator Dhaka | Bangla Sketch",
  description:
    "Calculate instant interior design and turnkey renovation estimates for your Dhaka apartment. Transparent pricing per sq ft for kitchen, bedroom, and living spaces.",
};

export default function CostEstimatorPage() {
  return (
    <div className="pt-24 min-h-screen bg-[#F5F2EB]">
      {/* Header */}
      <section className="py-16 md:py-20 bg-[#EDE7DE] border-b border-[#DED5C7]">
        <div className="container text-center max-w-3xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Transparent Valuation</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-2 mb-4">
              Dhaka Apartment Cost Estimator
            </h1>
            <ArchitecturalDivider />
            <p className="text-base text-[#5A625A] leading-relaxed mt-4">
              Explore transparent turnkey ballpark estimates calibrated for residential layouts in Gulshan, Banani, Dhanmondi, Uttara, and Bashundhara.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="section">
        <div className="container">
          <AnimateOnScroll delay={100}>
            <CostEstimator />
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
