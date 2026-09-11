import {
  SAMPLE_PROJECTS,
  SAMPLE_BLOG_POSTS,
  SAMPLE_TESTIMONIALS,
  SAMPLE_VIDEOS,
  ServiceCategory,
} from "./constants";

export interface Project {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  category: ServiceCategory;
  featured_image?: string;
  coverImage?: string;
  gallery?: string[];
  before_image?: string;
  after_image?: string;
  beforeImage?: string;
  afterImage?: string;
  client_name?: string;
  client_testimonial?: string;
  date_completed?: string;
  featured?: boolean;
  published?: boolean;
  cloudinary_ids?: string[];
}

export interface BlogPost {
  id: string | number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image?: string;
  coverImage?: string;
  meta_description?: string;
  tags?: string[];
  author?: string;
  published_date?: string;
  scheduled_publish_date?: string;
  reading_time?: number;
  featured?: boolean;
  published?: boolean;
  views_count?: number;
  cloudinary_id?: string;
}

export interface Testimonial {
  id: string | number;
  client_name: string;
  name?: string;
  client_location?: string;
  role?: string;
  quote: string;
  content?: string;
  rating?: number;
  client_image?: string;
  avatar?: string;
  project_id?: number | null;
  featured?: boolean;
  cloudinary_id?: string;
}

export interface Video {
  id: string | number;
  title: string;
  youtube_url?: string;
  youtubeUrl?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  featured?: boolean;
  display_order?: number;
  published?: boolean;
}

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

// Normalizers
function normalizeProject(raw: any): Project {
  const img = raw.featured_image || raw.featuredImage || raw.coverImage || "";
  return {
    ...raw,
    featured_image: img,
    coverImage: img,
    beforeImage: raw.before_image || raw.beforeImage,
    afterImage: raw.after_image || raw.afterImage,
    gallery: Array.isArray(raw.gallery)
      ? raw.gallery
      : typeof raw.gallery === "string"
      ? JSON.parse(raw.gallery || "[]")
      : [],
  };
}

function normalizeBlogPost(raw: any): BlogPost {
  const img = raw.featured_image || raw.featuredImage || raw.coverImage || "";
  return {
    ...raw,
    featured_image: img,
    coverImage: img,
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === "string"
      ? JSON.parse(raw.tags || "[]")
      : [],
  };
}

function normalizeTestimonial(raw: any): Testimonial {
  return {
    ...raw,
    name: raw.client_name || raw.name || "Happy Client",
    role: raw.client_location || raw.role || "Homeowner, Dhaka",
    content: raw.quote || raw.content || "",
    avatar: raw.client_image || raw.avatar || "",
  };
}

function normalizeVideo(raw: any): Video {
  return {
    ...raw,
    youtubeUrl: raw.youtube_url || raw.youtubeUrl || "",
  };
}

function isLocalBuildTime(): boolean {
  if (typeof window !== "undefined") return false;
  // If building for production and targeting localhost, skip network calls and use static fallback immediately
  if (process.env.NEXT_PHASE === "phase-production-build" && getApiUrl().includes("localhost")) {
    return true;
  }
  return false;
}

async function safeFetch(url: string, init?: RequestInit, ms = 800): Promise<Response> {
  if (isLocalBuildTime()) {
    throw new Error("Skipping localhost fetch during production build phase");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCollection(path: string, query: URLSearchParams): Promise<any[]> {
  const rows: any[] = [];
  query.set("limit", "100");
  for (let page = 1; page <= 100000; page++) {
    query.set("page", String(page));
    const res = await safeFetch(`${getApiUrl()}/api/${path}?${query}`, { next: { revalidate: 60 } }, 5000);
    if (!res.ok) throw new Error("Unable to load collection");
    const json = await res.json();
    if (!Array.isArray(json.data)) throw new Error("Invalid collection");
    rows.push(...json.data);
    if (!json.pagination?.hasMore) return rows;
  }
  throw new Error("Collection exceeds supported page count");
}

type PublicPage<T> = { data: T[]; page: number; hasMore: boolean };
type PageOptions = { category?: string; search?: string; page?: number; limit?: number };
export function getPublicPage(kind: "projects", params?: PageOptions): Promise<PublicPage<Project>>;
export function getPublicPage(kind: "blog", params?: PageOptions): Promise<PublicPage<BlogPost>>;
export async function getPublicPage(kind: "projects" | "blog", params: { category?: string; search?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, Math.min(100000, Math.floor(params.page || 1)));
  const limit = params.limit || 24;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params.category && !["all", "All"].includes(params.category)) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  try {
    const response = await safeFetch(`${getApiUrl()}/api/${kind}?${query}`, { next: { revalidate: 60 } }, 5000);
    if (!response.ok) throw new Error("Unable to load content");
    const json = await response.json();
    return { data: json.data.map(kind === "projects" ? normalizeProject : normalizeBlogPost), page, hasMore: Boolean(json.pagination?.hasMore) };
  } catch {
    const samples = kind === "projects" ? SAMPLE_PROJECTS.map(normalizeProject) : SAMPLE_BLOG_POSTS.map(normalizeBlogPost);
    const filtered = samples.filter(item => (!query.has("category") || item.category === params.category) && (!params.search || item.title.toLowerCase().includes(params.search.toLowerCase())));
    return { data: filtered.slice((page - 1) * limit, page * limit), page, hasMore: filtered.length > page * limit };
  }
}

// Public Data Fetchers (with graceful static fallback)
export async function getProjects(params?: {
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<Project[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.featured) query.set("featured", "true");
  if (params?.search) query.set("search", params.search);

  try {
    return (await fetchCollection("projects", query)).map(normalizeProject);
  } catch {
    // Fallback to sample projects
  }

  // Development/offline fallback only
  let fallback = SAMPLE_PROJECTS.map(normalizeProject);
  if (params?.category && params.category !== "all") {
    fallback = fallback.filter((p) => p.category === params.category);
  }
  if (params?.featured) {
    fallback = fallback.filter((p) => p.featured);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    fallback = fallback.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }
  return fallback;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const res = await safeFetch(`${getApiUrl()}/api/projects/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (res.ok) {
      const json = await res.json();
      if (json.data) return normalizeProject(json.data);
    }
    throw new Error(`Unexpected response status ${res.status}`);
  } catch {
    // Fallback to sample projects
  }

  const match = SAMPLE_PROJECTS.find((p) => p.slug === slug);
  return match ? normalizeProject(match) : null;
}

export async function getBlogPosts(params?: {
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<BlogPost[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "All") query.set("category", params.category);
  if (params?.featured) query.set("featured", "true");
  if (params?.search) query.set("search", params.search);

  try {
    return (await fetchCollection("blog", query)).map(normalizeBlogPost);
  } catch {
    // Fallback to sample posts
  }

  // Development/offline fallback only
  let fallback = SAMPLE_BLOG_POSTS.map(normalizeBlogPost);
  if (params?.category && params.category !== "All") {
    fallback = fallback.filter((p) => p.category === params.category);
  }
  if (params?.featured) {
    fallback = fallback.filter((p) => p.featured);
  }
  return fallback;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await safeFetch(`${getApiUrl()}/api/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (res.ok) {
      const json = await res.json();
      if (json.data) return normalizeBlogPost(json.data);
    }
    throw new Error(`Unexpected response status ${res.status}`);
  } catch {
    // Fallback to sample post
  }

  const match = SAMPLE_BLOG_POSTS.find((p) => p.slug === slug);
  return match ? normalizeBlogPost(match) : null;
}

export async function getTestimonials(featured?: boolean): Promise<Testimonial[]> {
  try {
    return (await fetchCollection("testimonials", new URLSearchParams(featured ? { featured: "true" } : {}))).map(normalizeTestimonial);
  } catch {
    // Fallback
  }

  let fallback = SAMPLE_TESTIMONIALS.map(normalizeTestimonial);
  if (featured) fallback = fallback.filter((t) => t.featured);
  return fallback;
}

export async function getVideos(featured?: boolean): Promise<Video[]> {
  try {
    return (await fetchCollection("videos", new URLSearchParams(featured ? { featured: "true" } : {}))).map(normalizeVideo);
  } catch {
    // Fallback
  }

  let fallback = SAMPLE_VIDEOS.map(normalizeVideo);
  if (featured) fallback = fallback.filter((v) => v.featured);
  return fallback;
}

// Client-safe Admin API helper via the proxy layer
export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`/api/admin/proxy/${path.replace(/^\//, "")}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json.error || `Request failed with status ${res.status}` };
    }
    if (Array.isArray(json.data) && json.pagination?.hasMore && (!options.method || options.method === "GET")) {
      const allRows = [...json.data];
      let page = Number(json.pagination.page) || 1;
      let hasMore = true;
      let fetchedPages = 1;
      const MAX_PAGINATED_PAGES = 500;
      while (hasMore && fetchedPages < MAX_PAGINATED_PAGES) {
        const url = new URL(`/api/admin/proxy/${path.replace(/^\//, "")}`, window.location.origin);
        url.searchParams.set("page", String(++page));
        url.searchParams.set("limit", String(json.pagination.limit || 50));
        const nextResponse = await fetch(url, { ...options, headers, credentials: "same-origin" });
        if (!nextResponse.ok) throw new Error("Unable to load remaining records");
        const nextPage = await nextResponse.json();
        if (Array.isArray(nextPage.data)) {
          allRows.push(...nextPage.data);
        }
        hasMore = Boolean(nextPage.pagination?.hasMore);
        fetchedPages++;
      }
      return { success: true, data: allRows as T };
    }
    return { success: true, data: json.data !== undefined ? json.data : json };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
  }
}
