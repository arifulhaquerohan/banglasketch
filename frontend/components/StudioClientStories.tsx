import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { getTestimonials, type Project } from "../lib/api";

export async function StudioClientStories({ projects }: { projects: Project[] }) {
  const testimonials = (await getTestimonials(undefined, false)).filter(item => item.quote?.trim() && item.client_name?.trim()).slice(0, 3);
  return (
    <section className="border-y border-limestone bg-ivory py-16 sm:py-24" aria-labelledby="studio-trust-heading">
      <div className="container">
        <p className="studio-eyebrow mb-5"><span /> {testimonials.length ? "In our clients’ words" : "Before we begin"}</p>
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h2 id="studio-trust-heading" className="max-w-xl text-4xl font-normal leading-tight sm:text-5xl">{testimonials.length ? "A home is personal. So is the experience." : "Good projects start with a clear conversation."}</h2>
          <Link href="/about" className="studio-text-link self-start sm:self-auto">Meet the studio <FiArrowUpRight aria-hidden="true" /></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.length ? testimonials.map(item => {
            const project = projects.find(project => String(project.id) === String(item.project_id));
            return <figure key={item.id} className="flex flex-col justify-between border-t border-limestone pt-6">
              <blockquote className="mb-7 text-lg leading-relaxed text-charcoal">“{item.quote}”</blockquote>
              <figcaption><p className="font-semibold">{item.client_name}</p>{item.client_location && <p className="mt-1 text-sm text-charcoal-muted">{item.client_location}</p>}
                {project && <Link href={`/portfolio/${project.slug}`} className="studio-text-link mt-3">View their project <FiArrowUpRight aria-hidden="true" /></Link>}
              </figcaption>
            </figure>;
          }) : [
            ["Your space and priorities", "Bring your floor plan, a few favourite images, or simply an idea of what you want to change."],
            ["Your scope and budget", "We’ll talk through what matters most and which parts of your project to focus on first."],
            ["Your next step", "Ask about the design process, material choices, and the work involved before deciding how to proceed."],
          ].map(([title, description], index) => <div key={title} className="border-t border-limestone pt-6"><span className="text-xs text-clay">0{index + 1}</span><h3 className="mb-3 mt-4 text-2xl font-normal">{title}</h3><p className="text-base leading-7 text-charcoal-muted">{description}</p></div>)}
        </div>
      </div>
    </section>
  );
}
