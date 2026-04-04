"use client";

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
  /** Video source for the LivingCard (takes priority over image) */
  livingCardVideoSrc?: string;
  /** Aspect ratio for the LivingCard — "video" (default) or e.g. "9/16" */
  livingCardAspectRatio?: string;
  livingCardHref?: string;
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
  /** Push the description trigger point forward */
  descTriggerOffset?: string;
  /** How many screens wide this project is (default 1.5) */
  screens?: number;
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
  livingCardVideoSrc,
  livingCardAspectRatio,
  livingCardHref,
  spanText,
  spanPosition,
  spanSize,
  showLivingCard = true,
  titleNewLine = false,
  descTriggerOffset = "0%",
  screens = 1.5,
  parallaxRef,
}: ProjectPageProps) {

  return (
    <div className="relative h-full shrink-0 flex items-center bg-black overflow-visible" style={{ width: `${screens * 100}vw` }}>
      {/* Title with parallax + repulse */}
      <div
        ref={parallaxRef}
        className="absolute will-change-transform"
        style={{
          left: titlePosition.x,
          top: titlePosition.y,
        }}
      >
        {titleNewLine ? (
          <div>
            {title.split("\n").map((line, i) => (
              <h2 key={i} className="text-5xl font-aldrich font-bold text-white select-none tracking-widest uppercase whitespace-nowrap">
                {line}
              </h2>
            ))}
          </div>
        ) : (
          <h2 className="text-5xl font-aldrich font-bold text-white select-none tracking-widest uppercase whitespace-nowrap">
            {title}
          </h2>
        )}
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
          <p data-split-anim data-split-role="desc" data-trigger-offset={descTriggerOffset} className="text-3xl font-aldrich text-neutral-300 leading-relaxed select-none italic">
            {description}
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
            videoSrc={livingCardVideoSrc}
            aspectRatio={livingCardAspectRatio}
            href={livingCardHref}
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
