import { ContactTabs } from "../../components/ContactTabs";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider } from "../../components/ServiceIcons";
import { CONTACT, SOCIAL } from "../../lib/constants";
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="pt-24 bg-[#F5F2EB]">
      {/* Hero Section */}
      <section className="py-16 md:py-20 bg-[#EDE7DE] border-b border-[#DED5C7]">
        <div className="container text-center max-w-3xl">
          <AnimateOnScroll>
            <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Get in Touch</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242824] mt-2 mb-4">
              Begin Your Architectural Journey
            </h1>
            <ArchitecturalDivider />
            <p className="text-base text-[#5A625A] leading-relaxed mt-4">
              Whether you are planning a complete penthouse overhaul, modular kitchen renovation, or architectural consultation across Dhaka, we welcome your inquiries.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left - Form */}
            <div className="lg:col-span-7">
              <AnimateOnScroll>
                <div className="card p-8 sm:p-10 bg-[#FCFAF7] border border-[#DED5C7] shadow-xs rounded-3xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block mb-1">Direct Consultation</span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5A625A] mb-8 leading-relaxed">
                    Share a few details about your space. An architect will review your project and get back to you within 24 hours.
                  </p>
                  <ContactTabs />
                </div>
              </AnimateOnScroll>
            </div>

            {/* Right - Info */}
            <div className="lg:col-span-5 space-y-6">
              {/* Studio Info Card */}
              <AnimateOnScroll>
                <div className="card p-7 sm:p-8 bg-[#FCFAF7] border border-[#DED5C7] shadow-xs rounded-3xl">
                  <h3 className="font-serif text-lg font-semibold text-[#242824] mb-6">
                    Studio Information
                  </h3>
                  <div className="space-y-6 text-sm">
                    <a href={`tel:${CONTACT.phone}`} className="flex items-start gap-4 group">
                      <div className="w-11 h-11 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] group-hover:bg-[#242824] group-hover:text-white transition-all duration-200 shrink-0">
                        <FiPhone size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-[#737D73] font-medium">Phone & WhatsApp</p>
                        <p className="text-[#242824] font-semibold mt-0.5 group-hover:text-[#586348] transition-colors">
                          {CONTACT.phone}
                        </p>
                      </div>
                    </a>

                    <a href={`mailto:${CONTACT.email}`} className="flex items-start gap-4 group">
                      <div className="w-11 h-11 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] group-hover:bg-[#242824] group-hover:text-white transition-all duration-200 shrink-0">
                        <FiMail size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-[#737D73] font-medium">Direct Email</p>
                        <p className="text-[#242824] font-semibold mt-0.5 group-hover:text-[#586348] transition-colors">
                          {CONTACT.email}
                        </p>
                      </div>
                    </a>

                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348] shrink-0">
                        <FiMapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-[#737D73] font-medium">Design Studio</p>
                        <p className="text-[#242824] font-medium leading-relaxed mt-0.5">
                          {CONTACT.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#DED5C7] space-y-2 text-xs text-[#5A625A]">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-[#586348]" />
                      <span>Studio visits by prior appointment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-[#586348]" />
                      <span>Saturday – Thursday (10:00 AM – 7:30 PM)</span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* WhatsApp Fast Track */}
              <AnimateOnScroll delay={100}>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
                    "Hello Bangla Sketch, I would like to arrange an interior design consultation."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block card p-7 bg-[#FCFAF7] border-2 border-[#586348]/40 hover:border-[#586348] rounded-3xl transition-all duration-300 shadow-xs group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                      <FaWhatsapp size={22} />
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-base text-[#242824]">Instant WhatsApp Chat</h4>
                      <p className="text-xs text-[#737D73]">Quick answers, blueprints & catalogs</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#5A625A] mt-3 leading-relaxed">
                    Prefer direct messaging? Chat with our architectural project team for immediate preliminary inquiries.
                  </p>
                  <div className="btn btn-whatsapp w-full mt-4 text-xs py-3 font-semibold shadow-xs">
                    Start WhatsApp Chat — {CONTACT.phone}
                  </div>
                </a>
              </AnimateOnScroll>

              {/* Social Channels */}
              <AnimateOnScroll delay={150}>
                <div className="card p-6 bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl shadow-xs">
                  <h4 className="font-serif text-sm font-semibold text-[#242824] mb-3">
                    Follow Our Design Work
                  </h4>
                  <div className="flex gap-3">
                    {[
                      { href: SOCIAL.facebook, icon: FiFacebook, label: "Facebook" },
                      { href: SOCIAL.instagram, icon: FiInstagram, label: "Instagram" },
                      { href: SOCIAL.youtube, icon: FiYoutube, label: "YouTube" },
                    ].map(({ href, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-2xl bg-[#EDE7DE] border border-[#DED5C7] flex items-center justify-center text-[#5A625A] hover:bg-[#242824] hover:text-[#FCFAF7] hover:border-[#242824] transition-all duration-200"
                        aria-label={label}
                      >
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>

          {/* Map */}
          <AnimateOnScroll delay={200}>
            <div className="mt-14 rounded-3xl overflow-hidden border border-[#DED5C7] shadow-md bg-[#EDE7DE]">
              <iframe
                src={CONTACT.googleMapsUrl}
                width="100%"
                height="380"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
                title="Banglasketch Studio Location"
              />
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
