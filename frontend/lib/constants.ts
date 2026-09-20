import contactDetails from "../../shared/contact.json";
import serviceCatalog from "../../shared/services.json";

export const SITE_NAME = "Banglasketch";
export const BRAND_NAME_BN = "বাংলা স্কেচ";
export const BRAND_NAME_EN = "Bangla Sketch";
export const BRAND_TAGLINE_BN = "ইন্টেরিয়র ডিজাইন যার হাতেখড়ি";
export const BRAND_TAGLINE_EN = "Where Interior Design Begins";

export const SITE_DESCRIPTION =
  "Premium interior design that blends luxury, functionality, and your unique style. 10+ years, 200+ projects. Based in Dhaka, Bangladesh.";

export const CONTACT = contactDetails;

export const SOCIAL = {
  facebook: "https://www.facebook.com/banglasketch",
  instagram: "https://instagram.com/banglasketch",
  youtube: "https://youtube.com/@banglasketch",
  pinterest: "https://pinterest.com/banglasketch",
};

export type ServiceCategory = "kitchen" | "bedroom" | "living-room" | "bathroom" | "commercial";
export const SERVICES = serviceCatalog as (Omit<(typeof serviceCatalog)[number], "id"> & { id: ServiceCategory })[];

export const BLOG_CATEGORIES = ["All", "Design Tips", "Trends", "Tutorial", "Case Study"] as const;

export const STATS = [
  { label: "Years Experience", value: "10+" },
  { label: "Projects Completed", value: "200+" },
  { label: "Happy Clients", value: "180+" },
  { label: "Awards Won", value: "15" },
];

export interface SampleProjectItem {
  id: string | number;
  title: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  location?: string;
  area?: string;
  style?: string;
  year?: string;
  featuredImage: string;
  gallery?: string[];
  dateCompleted: string;
  featured: boolean;
  clientName?: string;
  clientTestimonial?: string;
}

export const SAMPLE_PROJECTS: SampleProjectItem[] = [
  {
    id: "1",
    title: "The Courtyard Pavilion & Living Lounge",
    slug: "open-living-space",
    category: "living-room",
    description: "Expansive conversation pavilion framed in warm Roman travertine, tactile fluted teak, and natural daylight.",
    location: "Gulshan II, Dhaka",
    area: "4,400 sq.ft",
    style: "Quiet Editorial Luxury",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=85",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85",
    ],
    dateCompleted: "2026-08-15",
    featured: true,
    clientName: "Khan Residence",
    clientTestimonial: "Our living room is now the talk of the neighborhood! The tactile craftsmanship is second to none.",
  },
  {
    id: "2",
    title: "Sculpted Culinary Studio & Quartzite Island",
    slug: "modern-kitchen-renovation",
    category: "kitchen",
    description: "A dual-zone kitchen balancing Bengali culinary traditions with an open quartzite waterfall social centerpiece.",
    location: "Banani, Dhaka",
    area: "650 sq.ft",
    style: "Warm Tactile Minimalist",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=85",
    ],
    dateCompleted: "2026-07-28",
    featured: true,
    clientName: "Rahman Family",
    clientTestimonial: "Absolutely stunning work! The kitchen has become the true heart of our family life.",
  },
  {
    id: "3",
    title: "The Riverine Master Suite & Sanctuary",
    slug: "luxury-bedroom-sanctuary",
    category: "bedroom",
    description: "Penthouse master suite with custom acoustic linen wall paneling, smoked oak pocket screens, and serene 2700K lighting.",
    location: "Baridhara DOHS, Dhaka",
    area: "3,200 sq.ft",
    style: "Serene Contemporary",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=85",
    ],
    dateCompleted: "2026-07-10",
    featured: true,
    clientName: "Ahmed Family",
    clientTestimonial: "We finally have the restful sanctuary we dreamed of. Incredible attention to detail.",
  },
  {
    id: "4",
    title: "Tejgaon Creative Headquarters & Executive Suite",
    slug: "tejgaon-creative-headquarters",
    category: "commercial",
    description: "Architectural workspace blending natural concrete, acoustic timber slats, curated art lighting, and executive breakout lounges.",
    location: "Tejgaon Commercial District, Dhaka",
    area: "5,800 sq.ft",
    style: "Architectural Studio Modern",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=85",
    ],
    dateCompleted: "2026-06-20",
    featured: true,
    clientName: "Apex Design Partners",
    clientTestimonial: "Our clients are mesmerized the moment they walk into our new headquarters.",
  },
  {
    id: "5",
    title: "Boutique Stone Spa Bathroom Retreat",
    slug: "boutique-bathroom-design",
    category: "bathroom",
    description: "Spa-like bathroom finished in honed Arabescato marble, concealed rain showers, and bespoke brushed brass fittings.",
    location: "Dhanmondi, Dhaka",
    area: "420 sq.ft",
    style: "Italian Marble & Brass",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85",
    ],
    dateCompleted: "2026-05-25",
    featured: true,
    clientName: "Hossain Residence",
    clientTestimonial: "It feels like a five-star private resort every single morning.",
  },
  {
    id: "6",
    title: "L-Shaped Modular Minimalist Kitchen",
    slug: "l-shaped-modular-kitchen",
    category: "kitchen",
    description: "An efficient ergonomic L-shaped kitchen maximizing natural light and smart concealed pull-out storage.",
    location: "Uttara Sector 4, Dhaka",
    area: "480 sq.ft",
    style: "Warm Scandinavian & Teak",
    year: "2025",
    featuredImage: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=85",
    gallery: [],
    dateCompleted: "2025-11-18",
    featured: false,
  },
  {
    id: "7",
    title: "Children's Creative Studio Bedroom",
    slug: "kids-bedroom-paradise",
    category: "bedroom",
    description: "Custom bunk joinery, integrated reading alcove, and non-toxic natural oak finishes for growing children.",
    location: "Bashundhara R/A, Dhaka",
    area: "750 sq.ft",
    style: "Natural Oak & Pastel",
    year: "2025",
    featuredImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85",
    gallery: [],
    dateCompleted: "2025-10-12",
    featured: false,
  },
  {
    id: "8",
    title: "Banani Executive Flagship Lounge",
    slug: "banani-executive-flagship-lounge",
    category: "commercial",
    description: "High-end private client lounge featuring bookmatched walnut paneling, acoustic felt ceilings, and custom hospitality bar.",
    location: "Banani 11, Dhaka",
    area: "2,600 sq.ft",
    style: "Quiet Commercial Luxury",
    year: "2026",
    featuredImage: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=85",
    gallery: [],
    dateCompleted: "2026-04-14",
    featured: true,
  },
];

export const SAMPLE_BLOG_POSTS = [
  {
    id: "1",
    title: "How to Choose the Perfect Color Palette for Your Home",
    slug: "choosing-perfect-color-palette",
    excerpt: "Color sets the mood for your entire space. Learn the secrets to choosing colors that work together...",
    content: "",
    featuredImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    category: "Design Tips",
    publishedDate: "2026-09-03",
    author: "Banglasketch Team",
    readingTime: 7,
    featured: true,
  },
  {
    id: "2",
    title: "Maximizing Small Spaces: 10 Design Solutions",
    slug: "maximizing-small-spaces",
    excerpt: "Living in a small space doesn't mean sacrificing style. Here are proven strategies to make every square foot count...",
    content: "",
    featuredImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    category: "Tutorial",
    publishedDate: "2026-08-28",
    author: "Banglasketch Team",
    readingTime: 6,
    featured: true,
  },
  {
    id: "3",
    title: "Sustainable Interior Design: Luxury That's Good for the Planet",
    slug: "sustainable-interior-design",
    excerpt: "Create a beautiful home while being environmentally conscious. Discover eco-friendly materials and practices...",
    content: "",
    featuredImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    category: "Trends",
    publishedDate: "2026-08-20",
    author: "Banglasketch Team",
    readingTime: 5,
    featured: true,
  },
];

export const SAMPLE_TESTIMONIALS = [
  {
    id: "1",
    clientName: "Sarah Johnson",
    clientLocation: "Gulshan, Dhaka",
    quote: "Working with Banglasketch was incredible. They understood my vision immediately and created a space that's even better than I imagined. Our kitchen is now the heart of our home!",
    rating: 5,
    clientImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    featured: true,
  },
  {
    id: "2",
    clientName: "Michael Chen",
    clientLocation: "Banani, Dhaka",
    quote: "Professional, creative, and amazing to work with. The attention to detail is outstanding. I couldn't be happier with my bedroom transformation!",
    rating: 5,
    clientImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    featured: true,
  },
  {
    id: "3",
    clientName: "Jessica Martinez",
    clientLocation: "Dhanmondi, Dhaka",
    quote: "Best investment we made for our home. The designer made the entire process stress-free and the results are absolutely stunning. Highly recommended!",
    rating: 5,
    clientImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    featured: true,
  },
];

export const SAMPLE_VIDEOS = [
  {
    id: "1",
    title: "Kitchen Renovation Time-Lapse",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Watch how we transformed this kitchen from start to finish",
    duration: "3:45",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    featured: true,
  },
  {
    id: "2",
    title: "5 Budget-Friendly Design Hacks",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Get professional-looking results without breaking the bank",
    duration: "8:20",
    thumbnail: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
    featured: true,
  },
  {
    id: "3",
    title: "Design Trends 2026: What's In & Out",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Stay updated with the latest interior design trends",
    duration: "6:15",
    thumbnail: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    featured: true,
  },
];

export const BEFORE_AFTER_SLIDES = [
  {
    id: "kitchen",
    title: "Modern Kitchen Renovation",
    category: "Kitchen",
    before: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=85",
    after: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85",
    beforeCaption: "Outdated kitchen with poor lighting & cramped storage",
    afterCaption: "Open-concept modern kitchen with custom cabinetry",
  },
  {
    id: "bedroom",
    title: "Luxury Bedroom Sanctuary",
    category: "Bedroom",
    before: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=85",
    after: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85",
    beforeCaption: "Dark, uninspired bedroom layout",
    afterCaption: "Bright, serene sanctuary with warm architectural lighting",
  },
  {
    id: "bathroom",
    title: "Spa-Inspired Bathroom Retreat",
    category: "Bathroom",
    before: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1600&q=85",
    after: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85",
    beforeCaption: "Dull, basic bathroom with outdated fixtures",
    afterCaption: "Five-star spa retreat with marble and rain shower",
  },
];
