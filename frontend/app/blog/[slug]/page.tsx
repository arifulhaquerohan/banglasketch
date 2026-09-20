import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogCard } from "../../../components/BlogCard";
import { AnimateOnScroll } from "../../../components/AnimateOnScroll";
import { ShareButtons } from "../../../components/ShareButtons";
import { MarkdownContent } from "../../../components/MarkdownContent";
import { getBlogPostBySlug, getBlogPosts, getPublicPage } from "../../../lib/api";
import { getOptimizedCloudinaryUrl } from "../../../lib/cloudinary";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article Not Found | Banglasketch" };

  const image = post.featured_image || post.coverImage;
  return {
    title: `${post.title} | Banglasketch Journal`,
    description: post.meta_description || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      type: "article",
      images: image ? [{ url: image, alt: post.title }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const { data: allPosts } = await getPublicPage("blog", { limit: 4 });
  const related = allPosts.filter((p) => String(p.id) !== String(post.id)).slice(0, 3);
  const rawFeaturedImage =
    post.featured_image || post.coverImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
  const featuredImage = getOptimizedCloudinaryUrl(rawFeaturedImage, { width: 1920, quality: "auto:good" });
  const publishedDate = post.published_date || new Date().toISOString();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: featuredImage,
    datePublished: publishedDate,
    author: { "@type": "Organization", name: post.author || "Banglasketch" },
    publisher: { "@type": "Organization", name: "Banglasketch" },
  };

  return (
    <div className="pt-24 bg-[#F5F2EB]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }} />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[420px] max-h-[580px] overflow-hidden">
        <Image src={featuredImage} alt={post.title} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#242824] via-[#242824]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-10 z-10">
          <AnimateOnScroll>
            <span className="px-3 py-1 rounded-full bg-[#FCFAF7]/90 text-[#586348] text-xs font-semibold uppercase tracking-wider backdrop-blur-xs mb-3 inline-block">
              {post.category}
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-3 max-w-4xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#DED5C7]">
              <span>{post.author || "Bangla Sketch Studio"}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={publishedDate}>
                {new Date(publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </time>
              {post.reading_time && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{post.reading_time} min read</span>
                </>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="section bg-[#FCFAF7] border-b border-[#DED5C7]">
        <div className="container max-w-3xl">
          <AnimateOnScroll>
            <article className="text-[#242824]">
              {post.excerpt && (
                <div className="mb-8 border-l-4 border-[#586348] bg-[#EDE7DE] p-6 text-lg sm:text-xl italic leading-relaxed text-[#242824] rounded-r-2xl shadow-xs">
                  {post.excerpt}
                </div>
              )}
              {post.content ? (
                <div className="prose prose-lg max-w-none text-[#383E38] leading-relaxed">
                  <MarkdownContent content={post.content} />
                </div>
              ) : (
                <p className="text-base text-[#5A625A] leading-relaxed">
                  Full article is being finalized. Please explore our other insights or contact us for personalized architectural design guidance.
                </p>
              )}
            </article>
          </AnimateOnScroll>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t border-[#DED5C7]" aria-label="Article tags">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#DED5C7] bg-[#EDF1EA] px-3.5 py-1 text-xs font-medium text-[#586348]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <AnimateOnScroll delay={100}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-[#DED5C7]">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#586348]">Share this insight</span>
              <ShareButtons title={post.title} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="section bg-[#F5F2EB]">
          <div className="container">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#586348]">Further Reading</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242824] mt-1">Related Articles</h2>
            </div>
            <div className="grid-3">
              {related.map((p) => (
                <AnimateOnScroll key={p.id}>
                  <BlogCard {...p} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
