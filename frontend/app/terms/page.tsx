import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight, FiBriefcase, FiChevronRight, FiMail, FiPhone } from "react-icons/fi";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { BRAND_NAME_BN, CONTACT, SITE_NAME } from "../../lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Banglasketch",
  description: "Read the terms that govern your use of the Banglasketch website and our interior design consultation services.",
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
      <div className={mobile ? "flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none" : "bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-4"}>
        {!mobile && (
          <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c5a059] border-b border-[#c5a059]/15">
            On this page
          </p>
        )}
        <div className={mobile ? "flex gap-2 whitespace-nowrap" : "pt-2 space-y-0.5"}>
          {SECTIONS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={mobile
                ? "shrink-0 rounded-full border border-[#c5a059]/25 bg-[#0a2540] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-[#c5a059] hover:text-[#c5a059] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
                : "group flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-[#c5a059]/10 hover:text-[#c5a059] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"}
            >
              {!mobile && <span className="text-[#c5a059]/50 group-hover:text-[#c5a059]">{String(index + 1).padStart(2, "0")}</span>}
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
    <section id={id} className="scroll-mt-32 space-y-3 border-b border-[#c5a059]/15 pb-8 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#c5a059]/40 bg-[#c5a059]/10 text-xs font-bold text-[#c5a059]">
          {number}
        </span>
        <h2 className="pt-0.5 text-xl font-bold text-white md:text-2xl">{title}</h2>
      </div>
      <div className="pl-0 md:pl-10 text-sm leading-relaxed text-gray-300 md:text-base">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div id="top" className="pt-28 pb-20">
      <div className="container max-w-6xl">
        <AnimateOnScroll>
          <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="transition-colors hover:text-[#c5a059]">Home</Link>
            <FiChevronRight aria-hidden="true" size={13} />
            <span>Legal</span>
            <FiChevronRight aria-hidden="true" size={13} />
            <span className="text-gray-200">Terms of Service</span>
          </nav>
        </AnimateOnScroll>

        <AnimateOnScroll delay={60}>
          <header className="relative overflow-hidden rounded-3xl border border-[#c5a059]/25 bg-gradient-to-br from-[#0a2540] via-[#0a2540] to-[#061a30] px-6 py-10 text-center shadow-2xl md:px-10 md:py-14">
            <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#e07b2a]/10 blur-3xl" />
            <div className="relative mx-auto max-w-3xl space-y-4">
              <span className="badge badge-gold inline-flex items-center gap-2"><FiBriefcase aria-hidden="true" size={13} /> Clear expectations</span>
              <h1 className="text-3xl font-extrabold text-white md:text-5xl">Terms of Service</h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                These terms explain how you may use our website and how design consultations move toward a formal project agreement.
              </p>
              <p className="text-xs text-gray-400">Last updated: September 6, 2026</p>
            </div>
          </header>
        </AnimateOnScroll>

        <div className="mt-7"><TermsNavigation mobile /></div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <TermsNavigation />
          <AnimateOnScroll delay={100}>
            <article className="rounded-3xl border border-[#c5a059]/20 bg-[#0a2540] p-6 shadow-xl md:p-10">
              <div className="mb-8 rounded-2xl border border-[#c5a059]/15 bg-[#061a30] p-5 text-sm leading-relaxed text-gray-300">
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
                  <p>For questions about these terms or an upcoming design consultation, contact our team:</p>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-[#c5a059]/15 bg-[#061a30] p-4 text-sm sm:grid-cols-2">
                    <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#c5a059]/10">
                      <FiMail aria-hidden="true" className="shrink-0 text-[#c5a059]" size={17} />
                      <span><span className="block text-xs text-gray-400">Email</span><span className="text-gray-100 group-hover:text-[#c5a059]">{CONTACT.email}</span></span>
                    </a>
                    <a href={`tel:${CONTACT.phone}`} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#c5a059]/10">
                      <FiPhone aria-hidden="true" className="shrink-0 text-[#c5a059]" size={17} />
                      <span><span className="block text-xs text-gray-400">Phone</span><span className="text-gray-100 group-hover:text-[#c5a059]">{CONTACT.phone}</span></span>
                    </a>
                  </div>
                </TermsSection>
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-[#c5a059]/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/privacy" className="inline-flex items-center gap-1.5 font-medium text-[#c5a059] transition-colors hover:text-[#e07b2a]">
                  Read our Privacy Policy <FiArrowUpRight aria-hidden="true" size={15} />
                </Link>
                <a href="#top" className="inline-flex items-center gap-1.5 text-gray-400 transition-colors hover:text-[#c5a059]">
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
