import contactDetails from "../../shared/contact.json";
import serviceCatalog from "../../shared/services.json";

export const SITE_NAME = "Banglasketch";
export const BRAND_NAME_BN = "বাংলা স্কেচ";
export const BRAND_NAME_EN = "Bangla Sketch";

export const SITE_DESCRIPTION =
  "Premium interior design that blends luxury, functionality, and your unique style. 10+ years, 200+ projects. Based in Dhaka, Bangladesh.";

export const CONTACT = contactDetails;

export const SOCIAL = {
  facebook: "https://www.facebook.com/banglasketch",
  instagram: "https://instagram.com/banglasketch",
  youtube: "https://youtube.com/@banglasketch",
  pinterest: "https://pinterest.com/banglasketch",
};

export type ServiceCategory = "kitchen" | "bedroom" | "living-room" | "bathroom";
export const SERVICES = serviceCatalog as (Omit<(typeof serviceCatalog)[number], "id"> & { id: ServiceCategory })[];

export const BLOG_CATEGORIES = ["All", "Design Tips", "Trends", "Tutorial", "Case Study"] as const;

export const STATS = [
  { label: "Years Experience", value: "10+" },
  { label: "Projects Completed", value: "200+" },
  { label: "Happy Clients", value: "180+" },
  { label: "Awards Won", value: "15" },
];

export const SAMPLE_PROJECTS = [
  {
    id: "1",
    title: "Modern Kitchen Renovation",
    slug: "modern-kitchen-renovation",
    category: "kitchen" as ServiceCategory,
    description: "Contemporary kitchen with smart storage and premium finishes",
    featuredImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
    ],
    dateCompleted: "2026-08-15",
    featured: true,
    clientName: "Rahman Family",
    clientTestimonial: "Absolutely stunning work! The kitchen has become the heart of our home.",
  },
  {
    id: "2",
    title: "Luxury Bedroom Sanctuary",
    slug: "luxury-bedroom-sanctuary",
    category: "bedroom" as ServiceCategory,
    description: "Serene master bedroom with custom lighting and built-in wardrobes",
    featuredImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
    gallery: [],
    dateCompleted: "2026-07-20",
    featured: true,
    clientName: "Ahmed Family",
    clientTestimonial: "We finally have the bedroom we dreamed of. Incredible attention to detail.",
  },
  {
    id: "3",
    title: "Open Living Space",
    slug: "open-living-space",
    category: "living-room" as ServiceCategory,
    description: "Spacious living area with minimalist design and warm ambiance",
    featuredImage: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    gallery: [],
    dateCompleted: "2026-06-10",
    featured: true,
    clientName: "Khan Residence",
    clientTestimonial: "Our living room is now the talk of the neighborhood!",
  },
  {
    id: "4",
    title: "Boutique Bathroom Design",
    slug: "boutique-bathroom-design",
    category: "bathroom" as ServiceCategory,
    description: "Spa-like bathroom with marble finishes and heated floors",
    featuredImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    gallery: [],
    dateCompleted: "2026-05-25",
    featured: true,
    clientName: "Hossain Residence",
    clientTestimonial: "It feels like a five-star hotel every morning!",
  },
  {
    id: "5",
    title: "L-Shaped Modular Kitchen",
    slug: "l-shaped-modular-kitchen",
    category: "kitchen" as ServiceCategory,
    description: "An efficient L-shaped kitchen maximizing corner space with smart storage.",
    featuredImage: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
    gallery: [],
    dateCompleted: "2026-04-18",
    featured: false,
  },
  {
    id: "6",
    title: "Kids Bedroom Paradise",
    slug: "kids-bedroom-paradise",
    category: "bedroom" as ServiceCategory,
    description: "Playful yet practical children's bedroom with custom bunk beds and study area.",
    featuredImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    gallery: [],
    dateCompleted: "2026-03-12",
    featured: false,
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
