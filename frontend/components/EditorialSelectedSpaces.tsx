import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { getPublicPage } from "../lib/api";
import { SAMPLE_PROJECTS, type ServiceCategory } from "../lib/constants";
import { SelectedSpaceSaveButton } from "./SelectedSpaceSaveButton";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  "living-room": "Living spaces",
  kitchen: "Kitchens",
  bedroom: "Bedrooms",
  bathroom: "Bathrooms",
  commercial: "Workspaces",
};

export async function EditorialSelectedSpaces() {
  const { data } = await getPublicPage("projects", { limit: 2 });
  const projects = data.slice(0, 2).map((project) => {
    const image = project.featured_image || project.coverImage || "";
    // The API helper uses these same records as its offline fallback. Keep
    // their stock photography clearly separate from completed studio work.
    const isInspiration = SAMPLE_PROJECTS.some(
      (sample) => sample.slug === project.slug && sample.featuredImage === image,
    );

    return {
      ...project,
      image,
      isInspiration,
      categoryLabel: CATEGORY_LABELS[project.category] || "Interior design",
    };
  });
  const inspirationOnly = projects.length > 0 && projects.every((project) => project.isInspiration);

  return (
    <section
      aria-labelledby="selected-spaces-heading"
      className="selected-work-section border-b border-[#DDD5C8] bg-[#FAF7F2] py-20 sm:py-24 lg:py-28"
    >
      <div className="container">
        <div className="mb-10 flex flex-col justify-between gap-7 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#747963] sm:text-xs">
              <span aria-hidden="true" className="h-px w-8 bg-[#A45138]" />
              {inspirationOnly ? "Spaces to inspire" : "Selected spaces"}
            </p>
            <h2
              id="selected-spaces-heading"
              className="font-serif text-[2.8rem] font-normal leading-[1.05] tracking-[-0.035em] text-[#303529] sm:text-6xl lg:text-[4.4rem]"
            >
              Thoughtfully made.
              <br />
              <span className="font-normal italic text-[#747963]">Beautifully lived in.</span>
            </h2>
          </div>
          <div className="max-w-[285px] md:pb-1">
            <p className="mb-5 text-base leading-7 text-[#686C60]">
              A little inspiration for the way you want to live. Find the details that feel like you.
            </p>
            <Link
              href="/portfolio"
              className="group inline-flex min-h-11 items-center gap-6 border-b border-[#A45138] py-2 text-xs font-semibold text-[#303529] transition-colors hover:text-[#A45138]"
            >
              Explore the portfolio
              <FiArrowUpRight
                size={17}
                aria-hidden="true"
                className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="grid items-start gap-10 md:grid-cols-12 md:gap-8 lg:gap-14">
            {projects.map((project, index) => (
              <article
                key={project.id}
                className={index === 0 ? "min-w-0 md:col-span-7" : "min-w-0 md:col-span-5 md:mt-24"}
              >
                <div className="group relative overflow-hidden bg-[#E7E3D9]">
                  <Link
                    href={`/portfolio/${project.slug}`}
                    aria-label={`Explore ${project.title}`}
                    className={`relative block overflow-hidden ${index === 0 ? "aspect-[5/4]" : "aspect-[5/4] md:aspect-[1/1]"}`}
                  >
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.isInspiration ? `${project.categoryLabel} design inspiration` : project.title}
                        fill
                        sizes={index === 0 ? "(max-width: 767px) 100vw, (max-width: 1280px) 58vw, 680px" : "(max-width: 767px) 100vw, (max-width: 1280px) 42vw, 490px"}
                        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
                      />
                    ) : (
                      <span className="absolute inset-6 flex items-center justify-center border border-[#747963]/25 p-8 text-center font-serif text-4xl text-[#747963]">
                        {project.categoryLabel}
                      </span>
                    )}
                    <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF7F2] text-[#303529] transition-colors group-hover:bg-[#303529] group-hover:text-[#FAF7F2] sm:bottom-5 sm:right-5">
                      <FiArrowUpRight size={21} aria-hidden="true" />
                    </span>
                  </Link>

                  <SelectedSpaceSaveButton
                    id={`portfolio-${project.id}`}
                    title={project.title}
                    subtitle={`${project.categoryLabel}${project.isInspiration ? " · Design inspiration" : ""}`}
                    image={project.image}
                  />

                  {project.isInspiration && (
                    <span className="pointer-events-none absolute bottom-5 left-4 bg-[#FAF7F2]/95 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#555D49] sm:bottom-6 sm:left-5">
                      Design inspiration
                    </span>
                  )}
                </div>

                <div className="mt-5 flex gap-4 border-b border-[#DDD5C8] pb-5">
                  <span aria-hidden="true" className="pt-1 text-xs font-medium text-[#A45138]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#747963] sm:text-xs">
                      {project.categoryLabel}
                    </p>
                    <h3 className="font-serif text-[1.7rem] font-normal leading-tight text-[#303529] lg:text-[2rem]">
                      <Link href={`/portfolio/${project.slug}`} className="transition-colors hover:text-[#A45138]">
                        {project.title}
                      </Link>
                    </h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-[#DDD5C8] py-12">
            <p className="mb-3 font-serif text-3xl font-normal text-[#303529]">Your space could be the next story.</p>
            <Link href="#enquiry" className="inline-flex min-h-11 items-center gap-3 text-sm text-[#A45138]">
              Tell us what you have in mind <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-8 flex flex-col justify-between gap-3 text-xs leading-relaxed text-[#747963] sm:flex-row sm:items-center">
            <p>Save what speaks to you. Let it be the start of our conversation.</p>
            {projects.some((project) => project.isInspiration) && (
              <p className="text-xs">Inspiration images are illustrative.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
