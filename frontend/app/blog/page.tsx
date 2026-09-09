import { PageLinks } from "../../components/PageLinks";
import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "../../components/BlogCard";
import { AnimateOnScroll } from "../../components/AnimateOnScroll";
import { getPublicPage } from "../../lib/api";
import { BLOG_CATEGORIES } from "../../lib/constants";

export const metadata: Metadata = {
  title: "Interior Design Ideas & Tips | Banglasketch Blog",
  description: "Expert interior design advice, renovation ideas, trends, and practical inspiration from Banglasketch in Dhaka.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || "All";
  const { data: posts, page, hasMore } = await getPublicPage("blog", { category: activeCategory, page: Number(resolvedParams.page) });

  return (
    <div className="pt-24 min-h-screen">
      <section className="section">
        <div className="container text-center max-w-4xl">
          <AnimateOnScroll>
            <span className="badge badge-orange mb-3 inline-block">Design Journal</span>
            <h1 className="section-title">Latest Design Tips & Ideas</h1>
          </AnimateOnScroll>
          <AnimateOnScroll delay={100}>
            <p className="section-subtitle">Expert advice and inspiration for your next interior design project.</p>
          </AnimateOnScroll>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {BLOG_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <Link
                  key={category}
                  href={category === "All" ? "/blog" : `/blog?category=${encodeURIComponent(category)}`}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#e07b2a] to-[#c5a059] text-[#0a2540] shadow-lg shadow-[#e07b2a]/20"
                      : "bg-[#0a2540] text-gray-300 border border-[#c5a059]/20 hover:border-[#c5a059] hover:text-[#c5a059]"
                  }`}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="container mt-12">
          {posts.length > 0 ? (
            <div className="grid-3">
              {posts.map((post, index) => (
                <AnimateOnScroll key={post.id} delay={index * 60}>
                  <BlogCard {...post} />
                </AnimateOnScroll>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#0a2540]/40 rounded-3xl border border-[#c5a059]/20 max-w-xl mx-auto p-8">
              <p className="text-lg font-bold text-white mb-2">No articles found in this category</p>
              <p className="text-sm text-gray-400 mb-6">New stories and practical design advice are on their way.</p>
              <Link href="/blog" className="btn btn-primary py-2.5 text-xs">View All Articles</Link>
            </div>
          )}
          <PageLinks path="/blog" page={page} hasMore={hasMore} category={activeCategory} />
        </div>
      </section>
    </div>
  );
}
