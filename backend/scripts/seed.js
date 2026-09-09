const { Pool } = require("pg");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

const SEED_PROJECTS = [
  {
    title: "Modern Kitchen Renovation",
    slug: "modern-kitchen-renovation",
    category: "kitchen",
    description: "Contemporary kitchen with smart storage and premium finishes. Custom matte black cabinetry paired with warm LED accent lighting and Calacatta quartz countertops.",
    featured_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80"
    ],
    before_image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    after_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    client_name: "Rahman Family",
    client_testimonial: "Absolutely stunning work! The kitchen has become the heart of our home.",
    date_completed: "2026-08-15",
    featured: true,
    published: true,
  },
  {
    title: "Luxury Bedroom Sanctuary",
    slug: "luxury-bedroom-sanctuary",
    category: "bedroom",
    description: "Serene master bedroom with custom lighting and built-in wardrobes. Fluted acoustic wall panels create a calming retreat away from urban Dhaka noise.",
    featured_image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
    gallery: [],
    before_image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
    after_image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
    client_name: "Ahmed Family",
    client_testimonial: "We finally have the bedroom we dreamed of. Incredible attention to detail.",
    date_completed: "2026-07-20",
    featured: true,
    published: true,
  },
  {
    title: "Open Living Space",
    slug: "open-living-space",
    category: "living-room",
    description: "Spacious living area with minimalist design and warm ambiance. Features a custom travertine media console and panoramic glazing.",
    featured_image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Khan Residence",
    client_testimonial: "Our living room is now the talk of the neighborhood!",
    date_completed: "2026-06-10",
    featured: true,
    published: true,
  },
  {
    title: "Boutique Bathroom Design",
    slug: "boutique-bathroom-design",
    category: "bathroom",
    description: "Spa-like bathroom with marble finishes and brushed champagne gold fixtures.",
    featured_image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Hossain Residence",
    client_testimonial: "It feels like a five-star hotel every morning!",
    date_completed: "2026-05-25",
    featured: true,
    published: true,
  },
  {
    title: "L-Shaped Modular Kitchen",
    slug: "l-shaped-modular-kitchen",
    category: "kitchen",
    description: "An efficient L-shaped kitchen maximizing corner space with smart pull-out pantries.",
    featured_image: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Chowdhury Apartment",
    client_testimonial: null,
    date_completed: "2026-04-18",
    featured: false,
    published: true,
  },
  {
    title: "Kids Bedroom Paradise",
    slug: "kids-bedroom-paradise",
    category: "bedroom",
    description: "Playful yet practical children's bedroom with custom bunk beds and ergonomic study area.",
    featured_image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Mirza Family",
    client_testimonial: null,
    date_completed: "2026-03-12",
    featured: false,
    published: true,
  },
];

const SEED_BLOG_POSTS = [
  {
    title: "How to Choose the Perfect Color Palette for Your Home",
    slug: "choosing-perfect-color-palette",
    excerpt: "Color sets the mood for your entire space. Learn the secrets to choosing colors that work together seamlessly across different lighting conditions.",
    content: `# How to Choose the Perfect Color Palette for Your Home

Color is one of the most transformative elements in interior design. When selected with care, a cohesive color palette establishes rhythm, enhances spatial volume, and reflects your personality.

## 1. Understand the 60-30-10 Rule
A timeless rule in interior decorating:
- **60% Dominant Color:** Typically your walls, large area rugs, or substantial furniture pieces.
- **30% Secondary Color:** Curtains, accent furniture, bedding, or painted feature elements.
- **10% Accent Color:** Cushions, artwork, decorative ceramics, and metallic highlights (such as brushed gold or brass).

## 2. Factor in Natural Lighting
Dhaka apartments often receive differing qualities of light depending on their cardinal orientation:
- **North-facing rooms:** Light is cooler and bluer. Warm beige, creamy whites, and terracotta offset this beautifully.
- **South-facing rooms:** Bathed in intense golden light throughout the day. Soft neutrals, muted sage greens, and ocean blues balance warmth.

## 3. Test Samples in Real Life
Always paint large swatches on multiple walls and observe them at morning, noon, and evening under your home's artificial illumination before committing.`,
    featured_image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    category: "Design Tips",
    meta_description: "Learn how to choose the right colors for every room in your home with expert advice from Banglasketch.",
    tags: ["Color", "Design Tips", "Living Room", "Renovation"],
    author: "Banglasketch",
    reading_time: 7,
    featured: true,
    published: true,
  },
  {
    title: "Maximizing Small Spaces: 10 Design Solutions",
    slug: "maximizing-small-spaces",
    excerpt: "Living in a small space doesn't mean sacrificing style. Here are proven strategies to make every square foot count without visual clutter.",
    content: `# Maximizing Small Spaces: 10 Design Solutions

Urban living often requires balancing compact footprints with generous hospitality and comfort. Here are our top principles for small space design.

## 1. Floor-to-Ceiling Vertical Storage
When horizontal square footage is limited, think vertical. Custom full-height wardrobes and shelving draw the eye upward and provide hidden storage for clutter.

## 2. Multi-Functional Furniture
Choose coffee tables with lift-tops, daybeds with integrated drawers, and dining tables with drop-leaf extensions.

## 3. Light, Reflective Surfaces
Strategically placed mirrors opposite windows double the daylight entering a room, creating an illusion of boundless space.`,
    featured_image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    category: "Tutorial",
    meta_description: "Proven design tips to maximize compact apartment layouts and smaller rooms.",
    tags: ["Small Spaces", "Apartment Living", "Storage", "Minimalism"],
    author: "Banglasketch",
    reading_time: 6,
    featured: true,
    published: true,
  },
  {
    title: "Sustainable Interior Design: Luxury That's Good for the Planet",
    slug: "sustainable-interior-design",
    excerpt: "Create a beautiful home while being environmentally conscious. Discover eco-friendly materials and durable finishes.",
    content: `# Sustainable Interior Design: Luxury That's Good for the Planet

True luxury endures. Sustainable design emphasizes durable, non-toxic materials, local artisans, and energy-efficient architecture.

## Natural and Recycled Materials
We prioritize locally sourced reclaimed wood, terracotta, bamboo, and low-VOC paints that preserve indoor air quality.

## Invest in Timeless Craftsmanship
Fast furniture creates immense landfill waste. Bespoke furniture crafted from solid seasoned hardwoods lasts generations and ages with distinguished patina.`,
    featured_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    category: "Trends",
    meta_description: "Discover eco-friendly materials and sustainable design practices for modern luxury interiors.",
    tags: ["Sustainability", "Eco-Friendly", "Luxury", "Materials"],
    author: "Banglasketch",
    reading_time: 5,
    featured: true,
    published: true,
  },
];

const SEED_TESTIMONIALS = [
  {
    client_name: "Sarah Johnson",
    client_location: "Gulshan, Dhaka",
    quote: "Working with Banglasketch was incredible. They understood my vision immediately and created a space that's even better than I imagined. Our kitchen is now the heart of our home!",
    rating: 5,
    client_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    featured: true,
  },
  {
    client_name: "Michael Chen",
    client_location: "Banani, Dhaka",
    quote: "Professional, creative, and amazing to work with. The attention to detail is outstanding. I couldn't be happier with my bedroom transformation!",
    rating: 5,
    client_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    featured: true,
  },
  {
    client_name: "Jessica Martinez",
    client_location: "Dhanmondi, Dhaka",
    quote: "Best investment we made for our home. The designer made the entire process stress-free and the results are absolutely stunning. Highly recommended!",
    rating: 5,
    client_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    featured: true,
  },
];

const SEED_VIDEOS = [
  {
    title: "Kitchen Renovation Time-Lapse",
    youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Watch how we transformed this kitchen from start to finish with custom cabinetry and quartz finishes.",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    duration: "3:45",
    display_order: 1,
    featured: true,
    published: true,
  },
  {
    title: "5 Budget-Friendly Design Hacks",
    youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Get professional-looking results without breaking the bank.",
    thumbnail: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
    duration: "8:20",
    display_order: 2,
    featured: true,
    published: true,
  },
  {
    title: "Design Trends 2026: What's In & Out",
    youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Stay updated with the latest interior design trends and color palettes.",
    thumbnail: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    duration: "6:15",
    display_order: 3,
    featured: true,
    published: true,
  },
];

async function seed() {
  console.log("Seeding Banglasketch database...");
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set; skipping database seed.");
    return;
  }

  const client = await pool.connect();
  try {
    // Projects
    for (const p of SEED_PROJECTS) {
      await client.query(
        `INSERT INTO projects (title, slug, description, category, featured_image, gallery, before_image, after_image, client_name, client_testimonial, date_completed, featured, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           featured_image = EXCLUDED.featured_image,
           gallery = EXCLUDED.gallery,
           before_image = EXCLUDED.before_image,
           after_image = EXCLUDED.after_image,
           client_name = EXCLUDED.client_name,
           client_testimonial = EXCLUDED.client_testimonial,
           date_completed = EXCLUDED.date_completed,
           featured = EXCLUDED.featured,
           published = EXCLUDED.published`,
        [p.title, p.slug, p.description, p.category, p.featured_image, JSON.stringify(p.gallery), p.before_image, p.after_image, p.client_name, p.client_testimonial, p.date_completed, p.featured, p.published]
      );
    }
    console.log(`✓ Seeded ${SEED_PROJECTS.length} projects`);

    // Blog
    for (const b of SEED_BLOG_POSTS) {
      await client.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, category, meta_description, tags, author, reading_time, featured, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           excerpt = EXCLUDED.excerpt,
           content = EXCLUDED.content,
           featured_image = EXCLUDED.featured_image,
           category = EXCLUDED.category,
           meta_description = EXCLUDED.meta_description,
           tags = EXCLUDED.tags,
           author = EXCLUDED.author,
           reading_time = EXCLUDED.reading_time,
           featured = EXCLUDED.featured,
           published = EXCLUDED.published`,
        [b.title, b.slug, b.excerpt, b.content, b.featured_image, b.category, b.meta_description, JSON.stringify(b.tags), b.author, b.reading_time, b.featured, b.published]
      );
    }
    console.log(`✓ Seeded ${SEED_BLOG_POSTS.length} blog posts`);

    // Testimonials
    for (const t of SEED_TESTIMONIALS) {
      const existing = await client.query("SELECT id FROM testimonials WHERE client_name = $1", [t.client_name]);
      if (!existing.rows.length) {
        await client.query(
          `INSERT INTO testimonials (client_name, client_location, quote, rating, client_image, featured)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [t.client_name, t.client_location, t.quote, t.rating, t.client_image, t.featured]
        );
      }
    }
    console.log(`✓ Seeded testimonials`);

    // Videos
    for (const v of SEED_VIDEOS) {
      const existing = await client.query("SELECT id FROM videos WHERE title = $1", [v.title]);
      if (!existing.rows.length) {
        await client.query(
          `INSERT INTO videos (title, youtube_url, description, thumbnail, duration, display_order, featured, published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [v.title, v.youtube_url, v.description, v.thumbnail, v.duration, v.display_order, v.featured, v.published]
        );
      }
    }
    console.log(`✓ Seeded videos`);

    console.log("\n✓ Database seed completed successfully.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, SEED_PROJECTS, SEED_BLOG_POSTS, SEED_TESTIMONIALS, SEED_VIDEOS };
