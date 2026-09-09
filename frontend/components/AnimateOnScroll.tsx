"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "fade";
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimateOnScroll({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 700,
  className = "",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Render visible on the server to avoid concealing content if JavaScript or
  // IntersectionObserver is unavailable. The observer enables the entrance
  // transition immediately after hydration for elements still below the fold.
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    if (!el.getBoundingClientRect || el.getBoundingClientRect().top > window.innerHeight) {
      setVisible(false);
      requestAnimationFrame(() => setReady(true));
      observer.observe(el);
    } else {
      setReady(true);
    }

    return () => observer.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    "fade-up": "translateY(40px)",
    "fade-down": "translateY(-40px)",
    "fade-left": "translateX(-40px)",
    "fade-right": "translateX(40px)",
    scale: "scale(0.85)",
    fade: "none",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[animation],
        transition: ready
          ? `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`
          : "none",
      }}
    >
      {children}
    </div>
  );
}
