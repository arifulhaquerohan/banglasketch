import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight, FiBriefcase, FiChevronRight, FiMail, FiPhone } from "react-icons/fi";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { BRAND_NAME_BN, CONTACT, SITE_NAME } from "../../lib/constants";
import { ArchitecturalDivider } from "../../components/ServiceIcons";

export const metadata: Metadata = {
  title: "Terms of Service | Bangla Sketch",
  description: "Read the terms that govern your use of the Bangla Sketch website and our interior design consultation services.",
};

const SECTIONS = [
  { id: "agreement", label: "Agreement to terms" },
  { id: "services", label: "Design services" },
  { id: "consultations", label: "Consultations & estimates" },
  { id: "payments", label: "Payments" },
  { id: "cancellation", label: "Cancellation" },
  { id: "property", label: "Intellectual property" },
  { id: "liability", label: "Liability" },
  { id: "conduct", label: "Acceptable use" },
  { id: "law", label: "Governing law" },
  { id: "changes", label: "Changes to terms" },
  { id: "contact", label: "Contact us" },
] as const;

function TermsNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Terms of Service sections" className={mobile ? "lg:hidden" : "hidden lg:block sticky top-28"}>
      <div className={mobile ? "flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none" : "bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-5 shadow-xs"}>
        {!mobile && (
          <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#586348] border-b border-[#DED5C7]">
            On this page
          </p>
        )}
        <div className={mobile ? "flex gap-2 whitespace-nowrap" : "pt-2 space-y-0.5"}>
          {SECTIONS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={mobile
                ? "shrink-0 rounded-full border border-[#DED5C7] bg-[#FCFAF7] px-3.5 py-1.5 text-xs text-[#5A625A] transition-colors hover:border-[#586348] hover:text-[#242824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#586348]"
                : "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#5A625A] transition-colors hover:bg-[#EDF1EA] hover:text-[#242824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#586348]"}
            >
              {!mobile && <span className="text-[#8C9678] font-mono text-[11px] group-hover:text-[#586348]">{String(index + 1).padStart(2, "0")}</span>}
              {section.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function TermsSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 space-y-3 border-b border-[#DED5C7] pb-8 last:border-0 last:pb-0">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D5DEC4] bg-[#EDF1EA] text-xs font-bold text-[#586348] shadow-2xs">
          {number}
        </span>
        <h2 className="pt-0.5 text-xl font-serif font-semibold text-[#242824] md:text-2xl">{title}</h2>
      </div>
      <div className="pl-0 md:pl-10 text-sm leading-relaxed text-[#5A625A] md:text-base">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div id="top" className="pt-24 pb-20 bg-[#F5F2EB]">
      {/* Header Banner */}
      <section className="py-14 md:py-20 bg-[#EDE7DE] border-b border-[#DED5C7]">
        <div className="container max-w-4xl text-center">
          <AnimateOnScroll>
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-center gap-1.5 text-xs text-[#737D73]">
              <Link href="/" className="transition-colors hover:text-[#586348]">Home</Link>
              <FiChevronRight aria-hidden="true" size={13} />
              <span>Legal</span>
              <FiChevronRight aria-hidden="true" size={13} />
              <span className="text-[#242824] font-medium">Terms of Service</span>
            </nav>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348] inline-flex items-center gap-1.5 mb-2">
              <FiBriefcase aria-hidden="true" size={13} /> Clear Expectations
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-1 mb-4">
              Terms of Service
            </h1>
            <ArchitecturalDivider />
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#5A625A] md:text-base mt-4">
              These terms explain how you may use our website and how design consultations move toward a formal project agreement.
            </p>
            <p className="text-xs text-[#737D73] mt-2 font-medium">Last updated: September 6, 2026</p>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="container max-w-6xl mt-10">
        <div className="lg:hidden mb-6"><TermsNavigation mobile /></div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <TermsNavigation />
          <AnimateOnScroll delay={100}>
            <article className="rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] p-6 shadow-xs md:p-10">
              <div className="mb-8 rounded-2xl border border-[#D5DEC4] bg-[#EDF1EA] p-5 text-sm leading-relaxed text-[#383E38] font-medium">
                These Terms of Service apply to your use of the {SITE_NAME} ({BRAND_NAME_BN}) website and any initial communication with us. Specific design, construction, and procurement work is governed by the written agreement prepared for your project.
              </div>

              <div className="space-y-8">
                <TermsSection id="agreement" number={1} title="Agreement to these terms">
                  <p>By accessing this website or submitting an inquiry, you agree to follow these terms and all applicable laws. If you do not agree, please do not use the website or submit information through it.</p>
                </TermsSection>

                <TermsSection id="services" number={2} title="Interior design services">
                  <p>{SITE_NAME} provides interior design consultation and related project services. Portfolio images, concept renders, and descriptions are provided to illustrate our work and capabilities; they do not guarantee that an identical result, material, timeline, or price will be available for every project.</p>
                </TermsSection>

                <TermsSection id="consultations" number={3} title="Consultations, proposals & estimates">
                  <p>Information shared through this website is an initial inquiry, not a final booking or contract. Design recommendations, budgets, timelines, and estimates may change after site measurements, material selection, scope review, and written approval. A project begins only once both parties agree to formal written terms.</p>
                </TermsSection>

                <TermsSection id="payments" number={4} title="Payments">
                  <p>Any project deposit, milestone schedule, procurement charge, and accepted payment method will be stated in the applicable written proposal or agreement. Unless that agreement says otherwise, invoices are due according to their stated terms and work or deliveries may be paused when an overdue balance remains unpaid.</p>
                </TermsSection>

                <TermsSection id="cancellation" number={5} title="Cancellation & rescheduling">
                  <p>Please notify us as early as possible if you need to reschedule a consultation. Cancellation, refund, and rescheduling terms for a confirmed project depend on its written agreement, including work already completed, custom orders, supplier commitments, and site preparation costs.</p>
                </TermsSection>

                <TermsSection id="property" number={6} title="Intellectual property">
                  <p>Unless otherwise noted, the website’s designs, project images, renderings, copy, logo, graphics, and other materials belong to {SITE_NAME} or are used with permission. You may view and share links to these materials for personal reference, but may not reproduce, modify, republish, or use them commercially without prior written permission.</p>
                </TermsSection>

                <TermsSection id="liability" number={7} title="Limitation of liability">
                  <p>We work to keep this website accurate and available, but it is provided on an “as available” basis. To the extent permitted by applicable law, {SITE_NAME} is not liable for indirect, incidental, or consequential loss arising from website use, reliance on general portfolio content, or third-party links. Nothing here limits rights that cannot legally be limited.</p>
                </TermsSection>

                <TermsSection id="conduct" number={8} title="Acceptable use">
                  <p>You must not misuse the website, attempt to access restricted systems, disrupt its operation, submit unlawful or misleading content, or use our content in a way that infringes another person’s rights. We may restrict access where we reasonably believe these terms have been violated.</p>
                </TermsSection>

                <TermsSection id="law" number={9} title="Governing law & resolving concerns">
                  <p>These terms are governed by the laws of Bangladesh. If a concern arises, please contact us first so that we can try to resolve it promptly and in good faith. Any further process will be handled in accordance with applicable law and the terms of any signed project agreement.</p>
                </TermsSection>

                <TermsSection id="changes" number={10} title="Changes to these terms">
                  <p>We may revise these terms as the website and our services evolve. The latest version will appear on this page with a revised date. Continuing to use the website after an update means you accept the updated terms.</p>
                </TermsSection>

                <TermsSection id="contact" number={11} title="Contact us">
                  <p>For questions about these terms or an upcoming design consultation, contact our studio team:</p>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-[#DED5C7] bg-[#EDE7DE] p-4 text-sm sm:grid-cols-2">
                    <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348]">
                      <FiMail aria-hidden="true" className="shrink-0 text-[#586348]" size={17} />
                      <span><span className="block text-xs text-[#737D73]">Email</span><span className="text-[#242824] font-medium group-hover:text-[#586348]">{CONTACT.email}</span></span>
                    </a>
                    <a href={`tel:${CONTACT.phone}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348]">
                      <FiPhone aria-hidden="true" className="shrink-0 text-[#586348]" size={17} />
                      <span><span className="block text-xs text-[#737D73]">Phone</span><span className="text-[#242824] font-medium group-hover:text-[#586348]">{CONTACT.phone}</span></span>
                    </a>
                  </div>
                </TermsSection>
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-[#DED5C7] pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-[#586348] transition-colors hover:text-[#242824]">
                  Read our Privacy Policy <FiArrowUpRight aria-hidden="true" size={15} />
                </Link>
                <a href="#top" className="inline-flex items-center gap-1.5 text-[#737D73] transition-colors hover:text-[#242824] font-medium">
                  Back to top <FiArrowUpRight aria-hidden="true" size={15} className="-rotate-45" />
                </a>
              </div>
            </article>
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
}
