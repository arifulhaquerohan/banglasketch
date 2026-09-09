import Link from "next/link";
import { SERVICES } from "../../lib/constants";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider, getServiceIcon } from "../../components/ServiceIcons";
import { FiArrowRight } from "react-icons/fi";

export default function ServicesPage() {
  return (
    <div className="pt-24 bg-[#F5F2EB]">
      {/* Header */}
      <section className="py-16 md:py-20 bg-[#EDE7DE] border-b border-[#DED5C7]">
        <div className="container text-center max-w-3xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Disciplines & Craft</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-2 mb-4">
              Interior Architecture & Custom Joinery
            </h1>
            <ArchitecturalDivider />
            <p className="text-base text-[#5A625A] leading-relaxed mt-4">
              We design and construct tailored living environments across Dhaka, each centered on functional ergonomics, enduring materials, and timeless proportions.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section bg-[#FCFAF7] border-b border-[#DED5C7]/70">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <AnimateOnScroll key={s.id} delay={100 * i}>
                <Link
                  href={`/portfolio?category=${s.id}`}
                  className="group block h-full"
                >
                  <div className="card p-7 sm:p-8 h-full bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] transition-all duration-300 rounded-3xl shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-13 h-13 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                        {getServiceIcon(s.id, "w-6 h-6 text-[#586348]")}
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#242824] mb-2.5 group-hover:text-[#586348] transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5A625A] leading-relaxed mb-6">
                        {s.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#DED5C7]/70 flex items-center justify-between text-xs font-semibold text-[#586348]">
                      <span>{s.projectCount} Completed Projects</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Banner */}
      <section className="section bg-[#EDE7DE]">
        <div className="container max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#586348] block mb-2">
            Turnkey Service
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242824] mb-4">
            Need a Full Apartment Overhaul?
          </h2>
          <p className="text-sm sm:text-base text-[#5A625A] leading-relaxed mb-8">
            From civil reconfiguration and lighting layouts to bespoke teak cabinetry and site supervision, we manage the entire renovation turnkey.
          </p>
          <div className="flex flex-wrap gap-3.5 justify-center">
            <Link href="/contact" className="btn btn-primary text-xs px-8 py-3.5 shadow-sm">
              <span>Book Studio Consultation</span>
              <FiArrowRight size={14} />
            </Link>
            <Link href="/cost-estimator" className="btn btn-secondary text-xs px-8 py-3.5">
              <span>Calculate Turnkey Estimate</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
