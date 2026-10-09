---
name: Bangla Sketch
description: Warm architectural studio and bespoke luxury interior craftsmanship in Dhaka
colors:
  primary: "#A45138"
  primary-dark: "#893E28"
  primary-light: "#B8654D"
  primary-tint: "#F8ECE9"
  secondary: "#727A61"
  secondary-dark: "#575E4A"
  secondary-light: "#8C9678"
  secondary-tint: "#EEF1EA"
  accent-gold: "#C5A059"
  accent-emerald: "#0F241B"
  neutral-canvas: "#FAF7F2"
  neutral-bg: "#F4F0E8"
  neutral-border: "#DDD5C8"
  neutral-border-light: "#E8E2D7"
  neutral-border-dark: "#C8BDB0"
  neutral-ink: "#242622"
  neutral-muted: "#5A6057"
  neutral-dark: "#20251F"
typography:
  display:
    fontFamily: "var(--font-instrument), var(--font-serif-bn), Georgia, serif"
    fontSize: "clamp(3rem, 6.2vw, 5.4rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "var(--font-instrument), var(--font-serif-bn), Georgia, serif"
    fontSize: "clamp(2rem, 3.8vw, 3.45rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-instrument), var(--font-serif-bn), Georgia, serif"
    fontSize: "clamp(1.25rem, 2vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "var(--font-manrope), var(--font-sans-bn), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
  label:
    fontFamily: "var(--font-manrope), var(--font-sans-bn), system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-charcoal:
    backgroundColor: "{colors.neutral-ink}"
    textColor: "{colors.neutral-canvas}"
    rounded: "{rounded.sm}"
    padding: "15px 22px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.neutral-canvas}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Bangla Sketch (বাংলা স্কেচ)

## Overview

**Creative North Star: "The Warm Architectural Sanctuary"**

Bangla Sketch's visual system evokes the quiet luxury of a master architect's atelier in Dhaka. It rejects sterile, clinical minimalism and synthetic neon palettes in favor of organic tactile warmth: hand-laid limestone, sunlit ivory plaster, natural earthen terracotta clay, and weathered studio olive. The atmosphere is calm, contemplative, and editorial—treating every home interior as a work of fine art and enduring physical craftsmanship.

Interfaces lead with generous breathing room, balanced typographic contrast between lyrical serif headlines and crisp structural sans, and physical materiality cues (hairline architectural borders, subtle material swatches, and ambient tonal elevation).

### Key Characteristics:
- **Warm Plaster Canvas:** Backgrounds rest on natural ivory (`#FAF7F2` and `#F4F0E8`), never harsh synthetic `#FFFFFF` or stark `#000000`.
- **Earthen Materiality:** Accents are inspired by traditional brick, terracotta (`#A45138`), studio olive (`#727A61`), and raw limestone (`#DDD5C8`).
- **Editorial Typographic Harmony:** Majestic, high-contrast serif headlines paired with precise geometric sans body copy, with native typographic parity for Bengali script (`Noto Serif Bengali` / `Noto Sans Bengali`).
- **Hairline Architectural Precision:** 1px architectural divider lines and subtle tonal borders substitute for heavy, noisy drop shadows.

---

## Colors

The color palette is derived directly from raw architectural building materials and warm Bengali heritage.

### Primary
- **Burnt Clay / Terracotta** (`#A45138`): Primary action color, consultation CTAs, active highlight indicators, and focal interactive accents. Used with measured restraint.
- **Deep Clay** (`#893E28`): Hover and pressed state for primary buttons and high-contrast links.
- **Clay Tint** (`#F8ECE9`): Subtle background tint for highlight badges and notice banners.

### Secondary
- **Studio Olive** (`#727A61`): Structural secondary accents, category badges, focus rings, and decorative architectural bullets.
- **Olive Dark** (`#575E4A`): Eyebrow typography, hover states, and emphasized architectural metadata.
- **Olive Tint** (`#EEF1EA`): Delicate background fills for architectural pill tags and chips.

### Tertiary
- **Architectural Gold** (`#C5A059`): Luxury accents, premium badges, and review rating stars.
- **Forest Emerald** (`#0F241B`): Rich dark accents for specialized architectural categories.

### Neutral
- **Warm Ivory Light / Canvas** (`#FAF7F2`): Primary public page canvas, card backgrounds, and navigation containers.
- **Warm Ivory Base** (`#F4F0E8`): Default root document background and textured section underlays.
- **Limestone / Sand Border** (`#DDD5C8`): Default 1px architectural hairline border for dividers and cards.
- **Deep Charcoal Ink** (`#242622`): Primary body copy and high-authority headlines.
- **Charcoal Muted** (`#5A6057`): Secondary descriptions, captions, and lead paragraph text.
- **Studio Night / Footer** (`#20251F`): High-contrast dark container for footer and immersive nocturnal sections.

### Named Rules
**The Rarity of Clay Rule.** Burnt Clay (`#A45138`) is reserved exclusively for primary calls to action, saved counts, and active focus points. It should occupy ≤5% of visual screen surface to maintain its urgent, premium pull.

**The Organic Paper Rule.** Never use pure digital white (`#FFFFFF`) for background expanses on the public website. Always use Warm Ivory (`#FAF7F2` / `#F4F0E8`) to preserve tactile organic warmth.

---

## Typography

**Display / Headline Font:** `Instrument Serif` (Latin) / `Noto Serif Bengali` (Bengali) / fallback `Georgia, serif`  
**Body / Label / Sans Font:** `Manrope` (Latin) / `Noto Sans Bengali` (Bengali) / fallback `system-ui, sans-serif`

**Character:** A dialogue between the poetic grace of literary serifs and the uncompromising precision of modern architectural blueprints.

### Hierarchy
- **Display** (Weight 400, `clamp(3rem, 6.2vw, 5.4rem)`, Line Height 1.02, Tracking -0.045em): Hero section headlines and statement openings.
- **Headline** (Weight 400, `clamp(2rem, 3.8vw, 3.45rem)`, Line Height 1.12, Tracking -0.025em): Section titles, major project headers.
- **Title** (Weight 400, `clamp(1.25rem, 2vw, 1.75rem)`, Line Height 1.3, Tracking -0.015em): Card headers, drawer titles, modal headings.
- **Body** (Weight 400, `1rem` / `1.0625rem`, Line Height 1.7, Tracking 0em): General editorial text, project narratives, service details (max line length: 65ch).
- **Lead** (Weight 400, `clamp(1.0625rem, 1.25vw, 1.25rem)`, Line Height 1.75): Intro paragraphs beneath section titles.
- **Label / Eyebrow** (Weight 700, `0.75rem`, Line Height 1.2, Tracking 0.16em, Uppercase): Category tags, kicker headers, step markers.

### Named Rules
**The Typographic Balance Rule.** All headlines must have `text-wrap: balance` and body paragraphs `text-wrap: pretty` to ensure zero orphaned words across responsive viewport widths.

**The Bilingual Parity Rule.** When rendering Bengali text, line heights expand automatically (`line-height: 1.8` for body, `1.45` for headings) to accommodate conjunct character ascenders and descenders without clipping.

---

## Layout

- **Container Max-Width:** 1280px (Standard Content) / 1440px (Wide Header & Full-Bleed Portfolio).
- **Grid Systems:**
  - 12-column flexible grid for responsive content structures.
  - Asymmetrical editorial splits: `1fr : 1.05fr` on hero sections; `1.35fr : 0.95fr : 0.95fr : 1.25fr` on footer.
  - Responsive cards: `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`.
- **Rhythm & Spacing Scale:** Multiples of 8px (8px, 16px, 24px, 32px, 48px, 64px, 96px, 128px).
- **Responsive Breakpoints:**
  - `sm`: 640px (Mobile landscape & large handsets)
  - `md`: 768px (Tablets)
  - `lg`: 1024px (Laptops & desktop nav threshold)
  - `xl`: 1280px (Standard desktop container)
  - `2xl`: 1440px (Wide desktop)

---

## Elevation & Depth

Bangla Sketch uses **tonal layering and hairline architectural framing** rather than heavy drop shadows. Surfaces feel like physical paper, card stock, and stone sheets resting gently on one another.

### Shadow Vocabulary
- **Ambient Card Rest** (`0 2px 12px rgba(36, 40, 36, 0.03)`): Minimal grounding under resting portfolio cards.
- **Card Hover Elevation** (`0 14px 32px rgba(36, 40, 36, 0.07)`): Subtle lift applied during cursor hover (`translateY(-3px)`).
- **Primary CTA Glow** (`0 4px 14px rgba(164, 81, 56, 0.2)`): Soft warm halo under Burnt Clay buttons.
- **Floating Panel Elevation** (`0 16px 48px rgba(36, 38, 34, 0.12)`): Depth for modal overlays, dropdown menus, and the Chat/Collection drawers.

### Named Rules
**The Hairline Framing Rule.** Every elevated container must pair its elevation with a subtle 1px border (`border: 1px solid var(--color-limestone)`), ensuring crisp edge definition even in high-glare lighting environments.

---

## Shapes

- **Base Corner Radius (`rounded-sm` / 4px):** Primary buttons, interactive inputs, navigation links.
- **Medium Corner Radius (`rounded-md` / 8px):** Dropdown panels, nested containers, pill-buttons.
- **Large Corner Radius (`rounded-lg` / 16px):** Portfolio cards, quote callouts, drawer panels.
- **Pill Radius (`rounded-full` / 9999px):** Category badges, notification counters, avatar containers.
- **Form Language:** Clean, rectilinear discipline with softened micro-radii that suggest precision cut limestone and joinery.

---

## Components

### Buttons
- **Primary Action (Burnt Clay):** Solid `#A45138` background, `#FFFFFF` bold text, 4px radius, 12px 24px padding. Hover: `#893E28` with `translateY(-2px)`.
- **Studio Charcoal Button:** Solid `#242622` background, `#FAF7F2` text, 4px radius, 15px 22px padding, bold tracking. Hover: `#575E4A`.
- **Secondary / Outline:** Transparent background, 1.5px `#242622` border, `#242622` text. Hover: `#242622` fill with `#FAF7F2` text.
- **Text Link with Arrow:** Minimal baseline underline in `#C8BDB0`, transitioning to `#A45138` with an accompanying animated arrow on hover.

### Cards (Portfolio & Editorial)
- **Background:** `#FAF7F2` with 1px `#DDD5C8` border.
- **Radius:** 16px (`rounded-2xl`).
- **Interactive State:** Smooth 200ms cubic-bezier transition scaling images by `1.035` and elevating card by `-3px` with olive border accent.

### Inputs & Form Fields
- **Background:** `#FAF7F2` resting, `#FFFFFF` on active focus.
- **Border:** 1.5px `#DDD5C8` resting; 1.5px `#727A61` on focus with `box-shadow: 0 0 0 3px rgba(88, 99, 72, 0.15)`.
- **Typography:** 16px font size on mobile to prevent iOS Safari auto-zoom.

### Navigation Header
- **Structure:** Fixed header with `rgba(250, 247, 242, 0.96)` translucent ivory background, 16px backdrop-filter blur, and 1px hairline bottom border.
- **States:** Adds ambient shadow (`site-header-raised`) dynamically on scroll.

### Signature Component: Space Collection Drawer
- **Purpose:** Allows clients to bookmark and curate spaces/rooms into a personal architectural moodboard.
- **Treatment:** Slide-over drawer with backdrop blur, count badge in Burnt Clay, and direct design brief compilation.

---

## Do's and Don'ts

### Do:
- **Do** use `var(--color-ivory-light)` (`#FAF7F2`) and `var(--color-ivory)` (`#F4F0E8`) for page and container backgrounds.
- **Do** pair `Instrument Serif` / `Noto Serif Bengali` for headlines with `Manrope` / `Noto Sans Bengali` for body copy.
- **Do** wrap headlines in `text-wrap: balance` and body copy in `text-wrap: pretty`.
- **Do** keep interactive hover transitions between 180ms and 220ms with custom cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Do** provide explicit touch targets of at least 44px height for all mobile interactive controls.

### Don't:
- **Don't** use pure black (`#000000`) or pure white (`#FFFFFF`) as large surface backgrounds.
- **Don't** use aggressive, saturated neon colors or generic cold grays (`#6B7280`).
- **Don't** use heavy, blurry drop shadows without a bounding 1px architectural hairline border.
- **Don't** crowd headlines—always ensure generous top and bottom breathing room (minimum 3rem padding).
- **Don't** disable focus indicators—always preserve the 2px Studio Olive outline with 3px offset for keyboard accessibility.
