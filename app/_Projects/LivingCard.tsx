"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { cn } from "@/utils/utils";

interface LivingCardProps {
  /** Image source URL — rendered as <img> */
  imageSrc?: string;
  /** Video source URL — rendered as <video> (takes priority over imageSrc) */
  videoSrc?: string;
  /** Alt text for image */
  alt?: string;
  /** Optional content overlay at bottom of card */
  overlay?: React.ReactNode;
  className?: string;
/** Click handler */
  onClick?: () => void;
}

/**
 * Living Card — organic blob-shaped container that breathes, tilts in 3D,
 * and has parallax depth between media and content layers.
 */
export function LivingCard({
  imageSrc,
  videoSrc,
  alt = "",
  overlay,
  className,
  onClick,
}: LivingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isInView = useInView(cardRef, { once: false, amount: 0.3 });

  useEffect(() => {
    if (!videoRef.current) return;
    if (isInView) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isInView]);

  // 3D tilt springs
  const rotateX = useSpring(0, { stiffness: 200, damping: 25 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 25 });

  // Parallax springs for depth layers
  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  // Media: slight counter-movement (pushes away from cursor)
  const mediaX = useTransform(mouseX, (v) => v * -12);
  const mediaY = useTransform(mouseY, (v) => v * -12);

  // Content overlay: forward-movement (pulls toward cursor)
  const contentX = useTransform(mouseX, (v) => v * 6);
  const contentY = useTransform(mouseY, (v) => v * 6);

  // Scroll-linked entry: scale up + fade in
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "0.6 center"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotateX.set(y * -6);
      rotateY.set(x * 6);
      mouseX.set(x);
      mouseY.set(y);
    },
    [rotateX, rotateY, mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [rotateX, rotateY, mouseX, mouseY]);

  const isVideo = !!videoSrc;

  return (
    <motion.div
      ref={cardRef}
      style={{ scale, opacity, perspective: 1200 }}
      className={cn("relative", className)}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ rotateX, rotateY }}
        className={cn(
          "relative overflow-hidden rounded-2xl h-full",
          "bg-neutral-900",
        )}
      >
        {/* Rotating gradient border — visible on hover */}
        <div
          className={cn(
            "pointer-events-none absolute -inset-px z-30 transition-opacity duration-500",
            isHovered ? "opacity-100 glow-border-spin" : "opacity-0",
          )}
          style={{
            background:
              "conic-gradient(from var(--border-angle, 0deg), #222, #444, #666, #444, #222)",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
            borderRadius: "inherit",
          }}
        />

        {/* Media layer — counter-parallax, slightly oversized */}
        <motion.div
          style={{ x: mediaX, y: mediaY }}
          className="relative scale-[1.12] h-full grid place-items-center"
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={videoSrc}
              loop
              muted
              playsInline
              className="h-full w-full object-contain"
            />
          ) : imageSrc ? (
            <Image
              src={imageSrc}
              alt={alt}
              fill
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="aspect-video w-full bg-neutral-800" />
          )}
        </motion.div>

        Content overlay — forward-parallax, glass effect
        {overlay && (
          <motion.div
            style={{ x: contentX, y: contentY }}
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pb-6 pt-16"
          >
            {overlay}
          </motion.div>
        )}

        {/* Hover ambient glow */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 transition-opacity duration-500",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.06), transparent 70%)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
