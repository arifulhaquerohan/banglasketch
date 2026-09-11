/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "From Space to Sanctuary" - Warm Architectural Studio Palette
        ivory: {
          DEFAULT: "#F4F0E8",
          light: "#FAF7F2",
          dark: "#EAE3D5",
          muted: "#DDD5C8",
        },
        limestone: {
          DEFAULT: "#DDD5C8",
          light: "#E8E2D7",
          dark: "#C8BDB0",
        },
        charcoal: {
          DEFAULT: "#242622",
          light: "#363A34",
          dark: "#171815",
          muted: "#5A6057",
          soft: "#767E73",
        },
        olive: {
          DEFAULT: "#727A61",
          dark: "#575E4A",
          light: "#8C9678",
          tint: "#EEF1EA",
          border: "#D0D6C7",
        },
        clay: {
          DEFAULT: "#A45138",
          light: "#B8654D",
          dark: "#893E28",
          tint: "#F8ECE9",
        },
        gold: {
          DEFAULT: "#C5A059",
          darker: "#936D28",
          light: "#E8CE8A",
        },
        emerald: {
          DEFAULT: "#0F241B",
          darker: "#07130E",
          light: "#1B382B",
        },
      },
      fontFamily: {
        serif: ["var(--font-instrument)", "var(--font-serif-bn)", "Playfair Display", "Georgia", "serif"],
        heading: ["var(--font-instrument)", "var(--font-serif-bn)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "var(--font-sans-bn)", "system-ui", "-apple-system", "sans-serif"],
        body: ["var(--font-manrope)", "var(--font-sans-bn)", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "slide-up": "slideUp 0.8s ease-out",
        "slide-down": "slideDown 0.8s ease-out",
        "scale-in": "scaleIn 0.6s ease-out",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
