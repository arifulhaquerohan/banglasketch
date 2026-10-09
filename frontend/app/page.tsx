import Link from "next/link";
import { getPublicPage } from "../lib/api";
import Image from "next/image";
import { FiArrowDown, FiArrowUpRight, FiLayers, FiMapPin } from "react-icons/fi";
import { ChooseStartingPoint } from "../components/ChooseStartingPoint";
import { EditorialSelectedSpaces } from "../components/EditorialSelectedSpaces";
import { MaterialMoodSelector } from "../components/MaterialMoodSelector";
import { TransformationSteps } from "../components/TransformationSteps";
import { SanctuaryEnquiryForm } from "../components/SanctuaryEnquiryForm";
import { StudioClientStories } from "../components/StudioClientStories";

export const revalidate = 60;

export default async function HomePage() {
  const { data: projects } = await getPublicPage("projects", { limit: 6 });
  const heroProject = projects.find(project => {
    const image = project.featured_image || project.coverImage;
    return image && !image.includes("images.unsplash.com");
  });
  const heroImage = heroProject?.featured_image || heroProject?.coverImage || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85";
  return (
    <div className="studio-home">
      <section className="studio-hero" aria-labelledby="hero-title">
        <div className="container">
          <div className="studio-hero-grid">
            <div className="studio-hero-copy">
              <p className="studio-eyebrow"><span /> Thoughtful interiors. Everyday living.</p>
              <h1 id="hero-title">Thoughtful interiors. <em>Made for your life.</em></h1>
              <p className="studio-hero-description">
                From your first idea to the finishing touches, we create thoughtful interiors that reflect your life, your style, and what home means to you.
              </p>
              <p lang="bn" className="studio-hero-bengali">আপনার গল্প, আপনার ঘর—প্রতিটি কোণে আপনার ছোঁয়া।</p>
              <div className="studio-hero-actions">
                <Link href="#spaces" className="studio-button">Explore Our Work <FiArrowUpRight size={19} /></Link>
                <Link href="#enquiry" className="studio-text-link">Let’s Design Your Space <FiArrowUpRight size={17} /></Link>
              </div>
              <div className="studio-hero-note">
                <span className="studio-note-icon"><FiLayers size={20} strokeWidth={1.3} /></span>
                <p>From the first sketch<br /><strong>to the feeling of home.</strong></p>
              </div>
            </div>

            <figure className="studio-hero-visual">
              <div className="studio-hero-photo">
                <Image
                  src={heroImage}
                  alt={heroProject?.title || "Interior inspiration with warm wood furniture, soft neutral textiles, and natural daylight"}
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 52vw, 650px"
                  className="object-cover"
                />
                <div className="studio-photo-shade" />
                <span className="studio-photo-label">The art of feeling at home</span>
                <figcaption className="studio-photo-caption"><span>{heroProject ? heroProject.title : "01 / A quieter kind of living"}</span><span>{heroProject ? "Selected project" : "Interior inspiration"}</span></figcaption>
              </div>
              <Link href="#materials" className="studio-material-note">
                <div className="studio-material-swatches" aria-hidden="true"><span /><span /><span /></div>
                <span><small>Find your feeling</small><strong>A palette that feels like you</strong></span>
                <FiArrowUpRight size={20} />
              </Link>
              <span className="studio-image-index" aria-hidden="true">BANGLA SKETCH — SPACES WITH SOUL</span>
            </figure>
          </div>

          <div className="studio-hero-bottom">
            <span><FiMapPin size={14} /> Rooted in Dhaka. Designed around you.</span>
            <a href="#studio" className="studio-scroll-link">A little about us <FiArrowDown size={15} /></a>
          </div>
        </div>
      </section>

      <section id="spaces" aria-label="Selected spaces"><EditorialSelectedSpaces /></section>
      <ChooseStartingPoint projects={projects} />

      <section id="studio" className="studio-introduction" aria-labelledby="studio-title">
        <div className="container studio-introduction-grid">
          <p className="studio-eyebrow"><span /> The Bangla Sketch approach</p>
          <div>
            <h2 id="studio-title">Good design looks beautiful.<br /><em>Great design feels like home.</em></h2>
            <div className="studio-introduction-detail">
              <p>A place to slow down, gather, and grow. We believe your space should make room for what matters to you — with every material, corner, and detail working together.</p>
              <Link href="/about" className="studio-text-link">Meet the studio <FiArrowUpRight size={17} /></Link>
            </div>
          </div>
        </div>
      </section>

      <MaterialMoodSelector />
      <TransformationSteps />
      <StudioClientStories projects={projects} />
      <SanctuaryEnquiryForm />
    </div>
  );
}
