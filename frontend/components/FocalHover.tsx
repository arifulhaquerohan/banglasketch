"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

/**
 * A focal hover reaction that only triggers on devices supporting hover.
 * On mobile/tablet, renders as a static, elegant card to avoid "stuck" interactions.
 */
export function FocalHover({ children, className }: { children: ReactNode; className?: string }) {
  const [isHoverEnabled, setIsHoverEnabled] = useState(false);

  useEffect(() => {
    // Check if the device supports hover interactions (mouse)
    const checkHoverAbility = () => {
      setIsHoverEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    };

    checkHoverAbility();
    window.addEventListener("resize", checkHoverAbility);
    return () => window.removeEventListener("resize", checkHoverAbility);
  }, []);

  // For touch devices (no hover support), render static card
  if (!isHoverEnabled) {
    return (
      <div className={`opacity-100 grayscale-0 ${className}`}>
        {children}
      </div>
    );
  }

  // For mouse devices, apply sophisticated focal reveal
  return (
    <motion.div
      initial={{ opacity: 0.6, filter: "grayscale(0.5) blur(0px)" }}
      whileHover={{ opacity: 1, filter: "grayscale(0) blur(0px)" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
