import Image from "next/image";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import { STATS, SAMPLE_TESTIMONIALS } from "../../lib/constants";
import { TestimonialCard } from "../../components/TestimonialCard";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { ArchitecturalDivider } from "../../components/ServiceIcons";

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="section bg-gradient-to-b from-[#0a2540] to-[#061a30]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div className="relative max-w-md mx-auto w-full">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#c5a059]/30 to-[#e07b2a]/20 blur-xl opacity-70" />
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-[#c5a059]/40 bg-[#0a2540]">
                  <Image
                    src="https://res.cloudinary.com/dqcppfhuc/image/upload/v1788702780/trqjrpskci7nsbcvf9xe.png"
                    alt="Banglasketch Designer"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-[#c5a059] to-[#e07b2a] text-[#0a2540] px-5 py-3 rounded-xl shadow-xl border border-[#e8dcc5]/30">
                  <p className="text-2xl font-extrabold leading-none">10+</p>
                  <p className="text-xs font-bold tracking-wide">Years Experience</p>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-left">
              <div>
                <div className="text-[#c5a059] font-semibold text-sm uppercase tracking-widest mb-2">About Us</div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">About <span className="text-[#c5a059]">Banglasketch</span></h1>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Hi, we&apos;re the Banglasketch team. With over 10 years of experience in interior design, we&apos;ve helped more than 200 families and businesses in Dhaka create spaces they absolutely love.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We believe great design isn&apos;t just about aesthetics — it&apos;s about creating spaces that work perfectly for how you actually live. Our approach combines the latest design trends with timeless elegance, always keeping your budget and vision at the center.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Whether you&apos;re renovating a single room or an entire home, we&apos;re here to make the process smooth and exciting from concept to completion.
                </p>
                <Link href="/contact" className="btn btn-primary text-base px-8 py-3">Let&apos;s Work Together</Link>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-[#061a30]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <AnimateOnScroll key={stat.label} delay={100 * i}>
                <div className="bg-[#0a2540] rounded-2xl p-6 text-center border border-[#c5a059]/20 hover:border-[#c5a059] transition-all duration-300 hover:shadow-[0_0_30px_rgba(197,160,89,0.1)]">
                  <div className="text-4xl font-extrabold text-[#c5a059] mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <AnimateOnScroll>
              <ArchitecturalDivider />
              <h2 className="section-title">Our Design Philosophy</h2>
            </AnimateOnScroll>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Beauty Without Compromise", desc: "We never sacrifice aesthetics for function or vice versa. Every space we design achieves both beautifully." },
              { title: "Function Meets Aesthetics", desc: "Design should enhance how you live, not just look good in photos. We create spaces that work as hard as you do." },
              { title: "Budget-Conscious Luxury", desc: "Luxury isn't about price tags — it's about thoughtful choices. We maximize value without compromising quality." },
              { title: "Sustainable Design", desc: "We prioritize eco-friendly materials and practices that are better for your home and the planet." },
              { title: "Your Vision First", desc: "We listen deeply to understand your lifestyle, then translate your vision into spaces that feel uniquely yours." },
              { title: "Local Craftsmanship", desc: "We partner with skilled Bangladeshi artisans to bring authentic quality and local expertise to every project." },
            ].map((item, i) => (
              <AnimateOnScroll key={item.title} delay={100 * i}>
                <div className="card p-6 border border-[#c5a059]/20 hover:border-[#c5a059] transition-all duration-300 relative group overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="w-2.5 h-2.5 rotate-45 border border-[#c5a059] bg-[#0a2540]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-[#c5a059] transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-[#061a30]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose <span className="text-[#c5a059]">Banglasketch</span>?</h2>
                <div className="space-y-4">
                  {[
                    "10+ years of professional experience",
                    "200+ successful projects completed",
                    "Award-winning designs",
                    "Personalized approach for every client",
                    "Expert project management from concept to completion",
                    "Transparent pricing — no hidden costs",
                    "Comprehensive post-project support",
                    "Dedicated WhatsApp communication"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] shrink-0 shadow-sm">
                        <FiCheckCircle size={14} />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-left">
              <div className="relative">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-[#c5a059]/30">
                  <Image src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80" alt="Interior Design" fill className="object-cover" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0a2540] border-2 border-[#c5a059] rounded-full px-6 py-3 shadow-xl">
                  <p className="text-sm font-bold text-[#c5a059]">Trusted by 180+ Clients</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <AnimateOnScroll><h2 className="section-title">What Our Clients Say</h2></AnimateOnScroll>
            <AnimateOnScroll delay={100}><p className="section-subtitle">Real feedback from real clients in Dhaka.</p></AnimateOnScroll>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SAMPLE_TESTIMONIALS.map((t, i) => (
              <AnimateOnScroll key={t.id} delay={100 * i}>
                <TestimonialCard {...t} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gradient-to-br from-[#0a2540] to-[#061a30] border-y-2 border-[#c5a059]/20">
        <div className="container text-center">
          <AnimateOnScroll><h2 className="text-3xl md:text-5xl font-extrabold mb-4">Let&apos;s Create Something Beautiful</h2></AnimateOnScroll>
          <AnimateOnScroll delay={100}><p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Have questions? Want to discuss your project? We&apos;d love to hear from you.</p></AnimateOnScroll>
          <AnimateOnScroll delay={200} className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact" className="btn btn-primary text-lg px-8 py-4">Get in Touch</Link>
            <Link href="/portfolio" className="btn btn-secondary text-lg px-8 py-4">View Portfolio</Link>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
