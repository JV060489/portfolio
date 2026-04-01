"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  inView?: boolean;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  inView = false,
  duration = 0.6,
  yOffset = 12,
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldAnimate = inView ? isInView : true;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={
        shouldAnimate
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: yOffset, filter: `blur(${blur})` }
      }
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}
