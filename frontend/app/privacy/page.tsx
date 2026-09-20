import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight, FiChevronRight, FiMail, FiPhone, FiShield } from "react-icons/fi";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { BRAND_NAME_BN, CONTACT, SITE_NAME } from "../../lib/constants";
import { ArchitecturalDivider } from "../../components/ServiceIcons";

export const metadata: Metadata = {
  title: "Privacy Policy | Bangla Sketch",
  description: "Learn how Bangla Sketch collects, uses, and protects your information when you use our website and interior design services.",
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "information", label: "Information we collect" },
  { id: "use", label: "How we use information" },
  { id: "sharing", label: "Sharing & third parties" },
  { id: "cookies", label: "Cookies" },
  { id: "retention", label: "Data retention" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "Data security" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Policy changes" },
  { id: "contact", label: "Contact us" },
] as const;

function PrivacyNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Privacy policy sections" className={mobile ? "lg:hidden" : "hidden lg:block sticky top-28"}>
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

function PolicySection({
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

export default function PrivacyPage() {
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
              <span className="text-[#242824] font-medium">Privacy Policy</span>
            </nav>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348] inline-flex items-center gap-1.5 mb-2">
              <FiShield aria-hidden="true" size={13} /> Your Privacy Matters
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-1 mb-4">
              Privacy Policy
            </h1>
            <ArchitecturalDivider />
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#5A625A] md:text-base mt-4">
              We handle your inquiry and project information with the same care and precision we bring to every architectural space.
            </p>
            <p className="text-xs text-[#737D73] mt-2 font-medium">Last updated: September 6, 2026</p>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="container max-w-6xl mt-10">
        <div className="lg:hidden mb-6"><PrivacyNavigation mobile /></div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <PrivacyNavigation />
          <AnimateOnScroll delay={100}>
            <article className="rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] p-6 shadow-xs md:p-10">
              <div className="mb-8 rounded-2xl border border-[#D5DEC4] bg-[#EDF1EA] p-5 text-sm leading-relaxed text-[#383E38] font-medium">
                This policy explains how {SITE_NAME} ({BRAND_NAME_BN}) collects and manages personal information when you browse our website, send an inquiry, or discuss an interior design project with us.
              </div>

              <div className="space-y-8">
                <PolicySection id="overview" number={1} title="Overview">
                  <p>We respect your privacy and collect only the information needed to respond to your requests, deliver our services, and maintain a reliable website. By using this website or contacting us, you acknowledge the practices described in this policy.</p>
                </PolicySection>

                <PolicySection id="information" number={2} title="Information we collect">
                  <ul className="list-disc space-y-2 pl-5 marker:text-[#586348]">
                    <li>Contact details, such as your name, email address, and phone number, when you submit an inquiry.</li>
                    <li>Project details you choose to share, including location, room type, design requirements, budget expectations, and timeline.</li>
                    <li>Limited technical and usage information, such as browser type, pages visited, and device information, used to improve the website.</li>
                  </ul>
                </PolicySection>

                <PolicySection id="use" number={3} title="How we use your information">
                  <p>We use your information to answer inquiries, arrange consultations, prepare design proposals, manage active projects, provide customer support, and improve our services. We may also contact you about your specific request or project; we do not use your information for unrelated marketing without an appropriate basis to do so.</p>
                </PolicySection>

                <PolicySection id="sharing" number={4} title="Sharing & third-party services">
                  <p>We do not sell your personal information. We may share limited information with trusted service providers when necessary to operate our website, communicate with you, or deliver services. Embedded platforms and links—such as YouTube, WhatsApp, Google Maps, and social media—operate under their own privacy policies when you choose to use them.</p>
                </PolicySection>

                <PolicySection id="cookies" number={5} title="Cookies & similar technologies">
                  <p>Our website may use essential cookies or similar browser storage technologies to support normal site functionality and understand general usage. You can manage or delete cookies through your browser settings. Disabling some cookies may affect parts of the website, but it will not prevent you from contacting us directly.</p>
                </PolicySection>

                <PolicySection id="retention" number={6} title="Data retention">
                  <p>We retain inquiry and project information only for as long as reasonably necessary to respond to you, provide our services, meet legal or accounting obligations, resolve disputes, or maintain business records. When information is no longer needed, we delete it or anonymize it where practical.</p>
                </PolicySection>

                <PolicySection id="rights" number={7} title="Your privacy choices & rights">
                  <p>You may request access to, correction of, or deletion of the personal information we hold about you, subject to applicable law and legitimate record-keeping needs. You may also ask us to stop using your details for non-essential communications. Contact us using the details below and we will respond within a reasonable time.</p>
                </PolicySection>

                <PolicySection id="security" number={8} title="Data security">
                  <p>We use reasonable administrative and technical safeguards to protect information from unauthorized access, loss, misuse, or disclosure. No online transmission or storage system is completely secure, so we encourage you not to send highly sensitive personal or financial information through standard website forms.</p>
                </PolicySection>

                <PolicySection id="children" number={9} title="Children's privacy">
                  <p>Our website and design services are intended for adults and are not directed to children. We do not knowingly collect personal information from children. If you believe a child has provided us personal information, please contact us so that we can take appropriate action.</p>
                </PolicySection>

                <PolicySection id="changes" number={10} title="Changes to this policy">
                  <p>We may update this Privacy Policy as our website or services evolve. The most recent version will always be available on this page, with the updated date shown above. We encourage you to review it periodically.</p>
                </PolicySection>

                <PolicySection id="contact" number={11} title="Contact us">
                  <p>If you have a privacy question or wish to make a data request, please contact our studio team:</p>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-[#DED5C7] bg-[#EDE7DE] p-4 text-sm sm:grid-cols-2">
                    <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348]">
                      <FiMail aria-hidden="true" className="shrink-0 text-[#586348]" size={17} />
                      <span><span className="block text-xs text-[#737D73]">Email</span><span className="text-[#242824] font-medium group-hover:text-[#586348]">{CONTACT.email}</span></span>
                    </a>
                    <a href={`tel:${CONTACT.phone}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348]">
                      <FiPhone aria-hidden="true" className="shrink-0 text-[#586348]" size={17} />
                      <span><span className="block text-xs text-[#737D73]">Phone</span><span className="text-[#242824] font-medium group-hover:text-[#586348]">{CONTACT.phone}</span></span>
                    </a>
                    <p className="sm:col-span-2 px-2 pt-1 text-xs text-[#5A625A]">{CONTACT.address}</p>
                  </div>
                </PolicySection>
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-[#DED5C7] pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/terms" className="inline-flex items-center gap-1.5 font-semibold text-[#586348] transition-colors hover:text-[#242824]">
                  Read our Terms of Service <FiArrowUpRight aria-hidden="true" size={15} />
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
