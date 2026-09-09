const { Pool } = require("pg");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
const isRemote = connectionString && !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

const TWENTY_PROJECTS = [
  // Kitchens (5 projects)
  {
    title: "Gulshan Modern Minimalist Kitchen",
    slug: "gulshan-modern-minimalist-kitchen",
    category: "kitchen",
    description: "Sleek matte charcoal cabinetry with hidden push-to-open hardware, Calacatta gold quartz waterfall island, and built-in Bosch appliances.",
    featured_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1000&q=80"
    ],
    before_image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000&q=80",
    after_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=80",
    client_name: "Mahmudur Rahman",
    client_testimonial: "Banglasketch gave us a chef's dream kitchen. The quartz island and concealed pantry storage changed everything.",
    date_completed: "2026-08-20",
    featured: true,
    published: true,
  },
  {
    title: "Banani L-Shaped Scandinavian Kitchen",
    slug: "banani-l-shaped-scandinavian-kitchen",
    category: "kitchen",
    description: "Airy Nordic-inspired kitchen with blonde oak accents, fluted glass upper cabinets, warm under-cabinet LED tracks, and quartz worktops.",
    featured_image: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1000&q=80"
    ],
    before_image: null,
    after_image: null,
    client_name: "Tanzina Karim",
    client_testimonial: "The light wood textures make cooking relaxing every single day.",
    date_completed: "2026-07-15",
    featured: false,
    published: true,
  },
  {
    title: "Dhanmondi Emerald & Brass Classic Kitchen",
    slug: "dhanmondi-emerald-brass-classic-kitchen",
    category: "kitchen",
    description: "Deep emerald shaker-style cabinets with satin brass hardware, subway tile herringbone backsplash, and butcher block breakfast bar.",
    featured_image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80"
    ],
    before_image: null,
    after_image: null,
    client_name: "Kazi Asif",
    client_testimonial: "The contrast between the emerald cabinets and brass knobs is magnificent.",
    date_completed: "2026-06-05",
    featured: true,
    published: true,
  },
  {
    title: "Uttara Compact Modular Kitchen",
    slug: "uttara-compact-modular-kitchen",
    category: "kitchen",
    description: "High-efficiency kitchen designed for high-rise apartment living. Features pull-out spice racks, corner carousel units, and integrated hood.",
    featured_image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Farhan Hossain",
    client_testimonial: null,
    date_completed: "2026-05-18",
    featured: false,
    published: true,
  },
  {
    title: "Bashundhara Contemporary Open Kitchen",
    slug: "bashundhara-contemporary-open-kitchen",
    category: "kitchen",
    description: "Expansive open kitchen integrated with formal dining. Features smoked glass wine rack, dual ovens, and breakfast bar seating for four.",
    featured_image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Engr. Noman",
    client_testimonial: "Seamless blend with our dining room. Perfect for entertaining guests.",
    date_completed: "2026-04-12",
    featured: false,
    published: true,
  },

  // Bedrooms (5 projects)
  {
    title: "Gulshan Luxury Master Bedroom Suite",
    slug: "gulshan-luxury-master-bedroom-suite",
    category: "bedroom",
    description: "Ultra-plush master bedroom featuring custom acoustic fluted headboard, recessed cove ceiling lighting, walk-in dressing wardrobe, and plush rug.",
    featured_image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1000&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1000&q=80"
    ],
    before_image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1000&q=80",
    after_image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1000&q=80",
    client_name: "Dr. Tariqul Islam",
    client_testimonial: "We finally have our 5-star hotel sanctuary at home in Dhaka.",
    date_completed: "2026-08-01",
    featured: true,
    published: true,
  },
  {
    title: "Banani Japanese Wabi-Sabi Zen Bedroom",
    slug: "banani-japanese-wabi-sabi-zen-bedroom",
    category: "bedroom",
    description: "Low-profile oak platform bed, shoji-inspired wardrobe sliders, lime-wash microcement walls, and soft diffused ambient lighting.",
    featured_image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Nusrat Jahan",
    client_testimonial: "Calm, peaceful, and totally serene. The best sleep we have ever had.",
    date_completed: "2026-07-28",
    featured: true,
    published: true,
  },
  {
    title: "Dhanmondi Warm Terracotta & Oak Bedroom",
    slug: "dhanmondi-warm-terracotta-oak-bedroom",
    category: "bedroom",
    description: "Rich earth tones, custom linen drapery, integrated bedside charging niches, and floor-to-ceiling built-in wardrobe with bronze glass.",
    featured_image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Fahim Ahmed",
    client_testimonial: null,
    date_completed: "2026-06-22",
    featured: false,
    published: true,
  },
  {
    title: "Bashundhara Modern Kids Adventure Bedroom",
    slug: "bashundhara-modern-kids-adventure-bedroom",
    category: "bedroom",
    description: "Playful yet functional children's room with built-in loft bunk bed, reading nook with LED strips, and ergonomic study station.",
    featured_image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Mirza Shakhawat",
    client_testimonial: "Our kids are in love with their bedroom. Incredible craftsmanship.",
    date_completed: "2026-05-10",
    featured: false,
    published: true,
  },
  {
    title: "Mirpur Minimalist Guest Bedroom",
    slug: "mirpur-minimalist-guest-bedroom",
    category: "bedroom",
    description: "Clean lines, multi-functional luggage bench, neutral tone upholstery, and smart bedside task lighting designed for welcoming guests.",
    featured_image: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Rashedul Haque",
    client_testimonial: null,
    date_completed: "2026-04-20",
    featured: false,
    published: true,
  },

  // Living Rooms (5 projects)
  {
    title: "Gulshan Grand Panoramic Living Lounge",
    slug: "gulshan-grand-panoramic-living-lounge",
    category: "living-room",
    description: "Monumental living room with custom travertine marble TV feature wall, curved bouclé sectional sofa, and architectural lighting tracks.",
    featured_image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1000&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&q=80"
    ],
    before_image: null,
    after_image: null,
    client_name: "Syed Munir",
    client_testimonial: "The centerpiece of our home. Every guest is mesmerized by the stone finish.",
    date_completed: "2026-08-10",
    featured: true,
    published: true,
  },
  {
    title: "Banani Mid-Century Modern Living Space",
    slug: "banani-mid-century-modern-living-space",
    category: "living-room",
    description: "Warm walnut wall slats, cognac leather armchairs, custom bookshelf divider, and bespoke brass pendant chandelier.",
    featured_image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Arifur Rahman",
    client_testimonial: "Banglasketch balanced mid-century flair with everyday Dhaka comfort effortlessly.",
    date_completed: "2026-07-02",
    featured: true,
    published: true,
  },
  {
    title: "Baridhara Luxury Neutral Living Salon",
    slug: "baridhara-luxury-neutral-living-salon",
    category: "living-room",
    description: "Serene tones of ivory, oatmeal, and champagne gold. Features custom velvet drapery and layered geometric coffee tables.",
    featured_image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Mrs. Shahnaz Parveen",
    client_testimonial: "Subtle elegance at its peak. The color coordination is masterful.",
    date_completed: "2026-06-18",
    featured: false,
    published: true,
  },
  {
    title: "Dhanmondi Biophilic Living Room with Indoor Greenery",
    slug: "dhanmondi-biophilic-living-room",
    category: "living-room",
    description: "Nature-infused interior with integrated planter walls, light oak cabinetry, linen textiles, and ample natural sunlight.",
    featured_image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Imtiaz Hossain",
    client_testimonial: null,
    date_completed: "2026-05-30",
    featured: false,
    published: true,
  },
  {
    title: "Uttara Contemporary Family Entertainment Hall",
    slug: "uttara-contemporary-family-entertainment-hall",
    category: "living-room",
    description: "A welcoming, durable family lounge with acoustic media panelling, concealed cable tracks, and deep modular sofa.",
    featured_image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Kamrul Hasan",
    client_testimonial: null,
    date_completed: "2026-04-28",
    featured: false,
    published: true,
  },

  // Bathrooms (5 projects)
  {
    title: "Gulshan Master Spa Sanctuary Bathroom",
    slug: "gulshan-master-spa-sanctuary-bathroom",
    category: "bathroom",
    description: "Bookmatched Statuario marble slabs, freestanding soaking tub with floor-mounted brushed brass mixer, and frameless walk-in rainfall shower.",
    featured_image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1000&q=80"
    ],
    before_image: null,
    after_image: null,
    client_name: "Rezaul Karim",
    client_testimonial: "Walking into this bathroom feels like entering a 7-star resort every morning.",
    date_completed: "2026-08-12",
    featured: true,
    published: true,
  },
  {
    title: "Banani Matte Black & Terrazzo Powder Room",
    slug: "banani-matte-black-terrazzo-powder-room",
    category: "bathroom",
    description: "Boutique powder room featuring colorful Italian terrazzo walls, matte black wall-hung toilet, backlit arched mirror, and floating timber vanity.",
    featured_image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Shahidul Alam",
    client_testimonial: "Every visitor to our apartment compliments this powder room.",
    date_completed: "2026-07-10",
    featured: true,
    published: true,
  },
  {
    title: "Dhanmondi Zen Japanese Soaking Bathroom",
    slug: "dhanmondi-zen-japanese-soaking-bathroom",
    category: "bathroom",
    description: "Hinoki wood cedar accents, slate grey stone textured tiles, concealed niche storage, and ambient floor strip lights.",
    featured_image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Dr. Anisur Rahman",
    client_testimonial: null,
    date_completed: "2026-06-12",
    featured: false,
    published: true,
  },
  {
    title: "Bashundhara Modern Double-Vanity En-Suite",
    slug: "bashundhara-modern-double-vanity-en-suite",
    category: "bathroom",
    description: "Spacious his-and-hers quartz vanity, anti-fog smart LED mirrors, fluted wood drawer fronts, and thermostatic dual shower tower.",
    featured_image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Mohammad Saiful",
    client_testimonial: "Morning routines are smooth and stress-free now with dual vanities.",
    date_completed: "2026-05-15",
    featured: false,
    published: true,
  },
  {
    title: "Uttara Compact Scandinavian Bathroom",
    slug: "uttara-compact-scandinavian-bathroom",
    category: "bathroom",
    description: "Clever compact bathroom maximizing 45 sq ft with floating vanity, recessed medicine cabinet mirror, and sliding glass shower cubicle.",
    featured_image: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1000&q=80",
    gallery: [],
    before_image: null,
    after_image: null,
    client_name: "Moinul Islam",
    client_testimonial: null,
    date_completed: "2026-04-10",
    featured: false,
    published: true,
  },
];

async function seed20Projects() {
  console.log("Connecting to Supabase PostgreSQL database...");
  const client = await pool.connect();
  try {
    // Preserve existing projects, insert or update the 20 showcase projects
    for (const p of TWENTY_PROJECTS) {
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
        [
          p.title,
          p.slug,
          p.description,
          p.category,
          p.featured_image,
          JSON.stringify(p.gallery),
          p.before_image,
          p.after_image,
          p.client_name,
          p.client_testimonial,
          p.date_completed,
          p.featured,
          p.published,
        ]
      );
    }
    console.log(`✓ Successfully seeded ${TWENTY_PROJECTS.length} portfolio projects into PostgreSQL!`);

    const countRes = await client.query("SELECT category, COUNT(*) as count FROM projects GROUP BY category");
    console.log("Projects per category in database:");
    console.table(countRes.rows);
  } catch (err) {
    console.error("Error inserting projects:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed20Projects();
