import type { Metadata } from "next";
import Image from "next/image";
import { BlogCard } from "../../../components/BlogCard";
import { AnimateOnScroll } from "../../../components/AnimateOnScroll";
import { MarkdownContent } from "../../../components/MarkdownContent";
import { ShareButtons } from "../../../components/ShareButtons";
import { getBlogPostBySlug, getBlogPosts } from "../../../lib/api";
import { getOptimizedCloudinaryUrl } from "../../../lib/cloudinary";
import { notFound } from "next/navigation";

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
      publishedTime: post.published_date,
      authors: post.author ? [post.author] : [],
      images: image ? [{ url: image, alt: post.title }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getBlogPosts();
  const related = allPosts.filter((p) => String(p.id) !== String(post.id)).slice(0, 3);
  const rawFeaturedImage = post.featured_image || post.coverImage || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
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
    <div className="pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image src={featuredImage} alt={post.title} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540] via-[#0a2540]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-10">
          <AnimateOnScroll>
            <span className="badge badge-orange mb-3">{post.category}</span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 max-w-3xl">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span>{post.author || "Banglasketch"}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={publishedDate}>{new Date(publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
              {post.reading_time && <><span aria-hidden="true">•</span><span>{post.reading_time} min read</span></>}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container max-w-3xl">
          <AnimateOnScroll>
            <article className="text-gray-300">
              <p className="mb-8 border-l-4 border-[#c5a059] bg-[#0a2540]/50 p-5 text-xl italic leading-relaxed text-[#e8dcc5] rounded-r-xl">{post.excerpt}</p>
              {post.content ? <MarkdownContent content={post.content} /> : <p className="text-lg leading-relaxed">Full article coming soon. Please explore our other insights or contact us for personalized design guidance.</p>}
            </article>
          </AnimateOnScroll>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2" aria-label="Article tags">
              {post.tags.map((tag) => <span key={tag} className="rounded-full border border-[#c5a059]/25 bg-[#c5a059]/10 px-3 py-1 text-xs text-[#e8dcc5]">{tag}</span>)}
            </div>
          )}

          {/* Share */}
          <AnimateOnScroll delay={100}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-10 pt-8 border-t border-[#c5a059]/20">
              <span className="text-sm text-gray-400">Share this article:</span>
              <ShareButtons title={post.title} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="section bg-[#061a30]">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8 text-center">Related Articles</h2>
            <div className="grid-3">
              {related.map((p) => <AnimateOnScroll key={p.id}><BlogCard {...p} /></AnimateOnScroll>)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
