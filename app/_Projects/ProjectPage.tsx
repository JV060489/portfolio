"use client";

import { useGSAP } from "@gsap/react";
import { LivingCard } from "./LivingCard";

// ── Types ───────────────────────────────────────────────────────────────────
interface Position {
  x: string;
  y: string;
}

interface Size {
  width: string;
  height: string;
}

export interface ProjectPageProps {
  /** Main title text (gets parallax + repulse effect) */
  title: string;
  /** Position offset for the title (px) */
  titlePosition: Position;
  /** Parallax speed multiplier for the title (1 = no parallax, >1 = faster) */
  titleParallaxSpeed: number;
  /** Grey sub text below the title (no parallax) */
  subText: string;
  /** Position offset for the sub text (px) */
  subTextPosition: Position;
  /** Description text */
  description: string;
  /** Position offset for the description (px) */
  descriptionPosition: Position;
  /** Image source for the LivingCard */
  livingCardImgSrc: string;
  /** Overlay span text on the LivingCard */
  spanText: string;
  /** Position offset for the LivingCard (px) */
  spanPosition: Position;
  /** Size of the LivingCard */
  spanSize: Size;
  /** Whether to show the LivingCard */
  showLivingCard?: boolean;
  /** Whether the title should wrap to a new line (useful for longer titles) */
  titleNewLine?: boolean;
  /** Ref for the parallax title element (used by parent for GSAP animation) */
  parallaxRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ProjectPage({
  title,
  titlePosition,
  subText,
  subTextPosition,
  description,
  descriptionPosition,
  livingCardImgSrc,
  spanText,
  spanPosition,
  spanSize,
  showLivingCard = true,
  titleNewLine = false,
  parallaxRef,
}: ProjectPageProps) {
  return (
    <div className="relative h-full shrink-0 flex items-center bg-black overflow-visible" style={{ width: "150vw" }}>
      {/* Title with parallax + repulse */}
      <div
        ref={parallaxRef}
        className="absolute will-change-transform"
        style={{
          left: titlePosition.x,
          top: titlePosition.y,
        }}
      >
        <h2 className={`text-5xl font-aldrich font-bold text-white select-none tracking-widest uppercase ${titleNewLine ? "whitespace-pre-line" : "whitespace-nowrap"}`}>
          {title}
        </h2>
      </div>

      {/* Sub text — no parallax, grey */}
      <div
        className="absolute"
        style={{
          left: subTextPosition.x,
          top: subTextPosition.y,
        }}
      >
        <p className="text-lg font-aldrich text-neutral-500 select-none tracking-widest uppercase">
          {subText}
        </p>
      </div>

      {/* Description — second page, top, in quotes */}
      {description && (
        <div
          className="absolute max-w-2xl"
          style={{
            left: descriptionPosition.x,
            top: descriptionPosition.y,
          }}
        >
          <p className="text-3xl font-aldrich text-neutral-300 leading-relaxed select-none italic">
            &ldquo;{description}&rdquo;
          </p>
        </div>
      )}

      {/* Living card */}
      {showLivingCard && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: spanPosition.x,
            top: spanPosition.y,
            width: spanSize.width,
            height: spanSize.height,
          }}
        >
          <LivingCard
            imageSrc={livingCardImgSrc}
            alt={title.toLowerCase()}
            className="w-full h-full"
            overlay={
              <div className="flex flex-col gap-1">
                <span className="text-lg font-aldrich font-semibold text-white tracking-wide">
                  {spanText}
                </span>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
