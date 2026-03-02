"use client";

/**
 * PixelBurstReveal — configurable radial pixel-sweep reveal overlay
 * ──────────────────────────────────────────────────────────────────
 * Wraps any children and hides them behind a solid canvas mask.
 * On `.trigger()`, a wave of pixel squares sweeps radially from a
 * configurable origin corner. Each pixel flashes white then fades to
 * transparent — progressively revealing the content below.
 * Content is NEVER visible before trigger() is called.
 *
 * ── Quick start ───────────────────────────────────────────────────────────────
 *
 *   const burst = useRef<PixelBurstHandle>(null);
 *
 *   // Reveal a widget, sweep from top-right (default):
 *   <PixelBurstReveal ref={burst} origin="top-right">
 *     <YourContent />
 *   </PixelBurstReveal>
 *
 *   // Full-screen reveal from bottom-left:
 *   <PixelBurstReveal ref={burst} origin="bottom-left"
 *     style={{ position:"fixed", inset:0, zIndex:50 }}>
 *     <YourPage />
 *   </PixelBurstReveal>
 *
 *   burst.current?.trigger();
 *
 * ── Origin presets ────────────────────────────────────────────────────────────
 *   "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center"
 *   Or pass { x: 0..1, y: 0..1 } for arbitrary normalised coordinates.
 *
 * ── Per-cell lifecycle (total ~2 s, each cell visible for ~0.3 s) ─────────────
 *   1. Covered  — filled with coverColor (masks content)
 *   2. Flying   — white pixel flies in from scatter (ease-out-back)
 *   3. Fading   — pixel dissolves individually → cell goes transparent
 *   4. Revealed — nothing drawn; content shows through permanently
 */

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
  type CSSProperties,
} from "react";
import gsap from "gsap";

// ── Constants ─────────────────────────────────────────────────────────────────
const PIXEL_SIZE = 8;
const PIXEL_GAP = 1;
/**
 * The furthest cell starts flying at this fraction of total progress.
 * Ensures: MAX_STAGGER + PIXEL_FLIGHT_FRAC + PIXEL_FADE_FRAC ≤ 1.0
 */
const MAX_STAGGER = 0.75;
/** Fly-in duration per pixel as a fraction of total progress. */
const PIXEL_FLIGHT_FRAC = 0.07;
/** Individual fade-out duration as a fraction of total progress. */
const PIXEL_FADE_FRAC = 0.12;

// Bayer 4×4 ordered-dither map — values 0–15 normalised to [0,1] by ÷16.
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ── Types ──────────────────────────────────────────────────────────────────

/** Preset origin name. Maps to a normalised {x,y} coordinate. */
export type OriginPreset =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "center";

/** Arbitrary normalised origin — x and y each in [0, 1]. */
export type OriginCoords = { x: number; y: number };

const ORIGIN_MAP: Record<OriginPreset, OriginCoords> = {
  "top-right": { x: 1, y: 0 },
  "top-left": { x: 0, y: 0 },
  "bottom-right": { x: 1, y: 1 },
  "bottom-left": { x: 0, y: 1 },
  center: { x: 0.5, y: 0.5 },
};

function resolveOrigin(o: OriginPreset | OriginCoords): OriginCoords {
  return typeof o === "string" ? ORIGIN_MAP[o] : o;
}

// ── Internal pixel descriptor ──────────────────────────────────────────────────
interface PixelDesc {
  homeX: number; // final resting X (canvas px)
  homeY: number; // final resting Y (canvas px)
  startX: number; // scatter-origin X
  startY: number; // scatter-origin Y
  arriveAt: number; // progress [0,1] when this pixel's flight begins
  flightDur: number; // progress span for the fly-in
  fadeAt: number; // progress when individual fade-out begins
  fadeDur: number; // progress span for the fade-out
  threshold: number; // Bayer value — cell stays covered until tFlight > threshold
}

// ── Public API types ───────────────────────────────────────────────────────────────
export interface PixelBurstHandle {
  /**
   * Start the reveal animation.
   * Content transitions from fully masked → fully visible over `duration` seconds.
   * Safe to call again while animating — restarts cleanly.
   */
  trigger(): void;
}

export interface PixelBurstRevealProps {
  children?: ReactNode;
  /**
   * Point from which the radial sweep begins.
   * Preset name or normalised {x,y} coordinates (0–1 each).
   * @default "top-right"
   */
  origin?: OriginPreset | OriginCoords;
  /**
   * Solid fill color used to mask children before the reveal.
   * Should match your page/container background.
   * @default "#000000"
   */
  coverColor?: string;
  /**
   * Flash color of the flying pixels.
   * @default "#ffffff"
   */
  pixelColor?: string;
  /**
   * Total animation duration in seconds.
   * @default 2.0
   */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

// ── Ease ──────────────────────────────────────────────────────────────────────
function easeOutBack(t: number): number {
  const c1 = 1.5,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ── Grid builder ──────────────────────────────────────────────────────────────
/**
 * Builds a PixelDesc for every grid cell with a radial stagger delay
 * measured from the given normalised origin point.
 *
 * Scatter directions:
 *  65 % fall from above · 18 % fly in from left · 17 % fly in from right
 */
function buildPixels(w: number, h: number, origin: OriginCoords): PixelDesc[] {
  const cols = Math.ceil(w / PIXEL_SIZE);
  const rows = Math.ceil(h / PIXEL_SIZE);
  const pixels: PixelDesc[] = [];

  const ox = origin.x * w;
  const oy = origin.y * h;
  const maxDist = Math.sqrt(w * w + h * h);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const homeX = col * PIXEL_SIZE;
      const homeY = row * PIXEL_SIZE;

      let startX: number, startY: number;
      const r = Math.random();
      if (r < 0.65) {
        startX = homeX + (Math.random() - 0.5) * w * 1.8;
        startY = -(PIXEL_SIZE * 3 + Math.random() * PIXEL_SIZE * 12);
      } else if (r < 0.83) {
        startX = -(PIXEL_SIZE * 3 + Math.random() * PIXEL_SIZE * 8);
        startY = homeY + (Math.random() - 0.5) * h * 0.5;
      } else {
        startX = w + PIXEL_SIZE * 3 + Math.random() * PIXEL_SIZE * 8;
        startY = homeY + (Math.random() - 0.5) * h * 0.5;
      }

      const cx = homeX + PIXEL_SIZE * 0.5;
      const cy = homeY + PIXEL_SIZE * 0.5;
      const dist = Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2) / maxDist;

      const jitter = Math.random() * 0.06;
      const arriveAt = Math.min(dist * MAX_STAGGER + jitter, MAX_STAGGER);
      const flightDur = PIXEL_FLIGHT_FRAC * (0.8 + Math.random() * 0.4);
      const fadeAt = arriveAt + flightDur;
      const fadeDur = PIXEL_FADE_FRAC * (0.8 + Math.random() * 0.4);

      const bRow = row % 4,
        bCol = col % 4;
      const threshold = BAYER_4X4[bCol + bRow * 4] / 16;

      pixels.push({
        homeX,
        homeY,
        startX,
        startY,
        arriveAt,
        flightDur,
        fadeAt,
        fadeDur,
        threshold,
      });
    }
  }
  return pixels;
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * PixelBurstReveal
 *
 * Wrap any content you want revealed with the pixel-sweep effect.
 * The canvas starts filled solid (children invisible).
 * On `trigger()` the pixel wave sweeps from `origin`; each cell transitions
 * from solid cover → flying white pixel → transparent (content revealed).
 *
 * @example Reveal a widget from the top-right (default):
 *   <PixelBurstReveal ref={ref} origin="top-right">
 *     <NavCube3D />
 *   </PixelBurstReveal>
 *
 * @example Full-screen reveal from bottom-left:
 *   <PixelBurstReveal ref={ref} origin="bottom-left"
 *     style={{ position:"fixed", inset:0, zIndex:50 }}>
 *     <PageContent />
 *   </PixelBurstReveal>
 */
const PixelBurstReveal = forwardRef<PixelBurstHandle, PixelBurstRevealProps>(
  function PixelBurstReveal(
    {
      children,
      origin = "top-right",
      coverColor = "#000000",
      pixelColor = "#ffffff",
      duration = 2.0,
      className,
      style,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pixelsRef = useRef<PixelDesc[]>([]);
    const progressRef = useRef({ value: 0 });
    const rafRef = useRef<number>(0);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const activeRef = useRef(false);

    // Props stashed in refs so trigger/drawFrame always see the latest values
    const coverRef = useRef(coverColor);
    const pixelRef = useRef(pixelColor);
    const durRef = useRef(duration);
    const originRef = useRef(origin);
    useEffect(() => {
      coverRef.current = coverColor;
    }, [coverColor]);
    useEffect(() => {
      pixelRef.current = pixelColor;
    }, [pixelColor]);
    useEffect(() => {
      durRef.current = duration;
    }, [duration]);
    useEffect(() => {
      originRef.current = origin;
    }, [origin]);

    // ── Fill canvas solid on mount — hides children immediately ────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const fill = () => {
        canvas.width = canvas.offsetWidth || 1;
        canvas.height = canvas.offsetHeight || 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = coverRef.current;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      const id = requestAnimationFrame(fill);
      return () => {
        cancelAnimationFrame(id);
        tlRef.current?.kill();
        cancelAnimationFrame(rafRef.current);
      };
    }, []);

    // ── Draw one frame ───────────────────────────────────────────────────────
    //
    // Per-cell model:
    //   tFade ≥ 1              → skip (transparent; content shows through)
    //   tFlight ≤ threshold    → draw coverColor square (cell still masked)
    //   tFlight > threshold    → draw pixelColor at animated position,
    //                            alpha = 1 − tFade (fades individually)
    function drawFrame(progress: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const px of pixelsRef.current) {
        const tFlight = Math.max(
          0,
          Math.min(1, (progress - px.arriveAt) / (px.flightDur + 0.001)),
        );
        const tFade = Math.max(
          0,
          Math.min(1, (progress - px.fadeAt) / (px.fadeDur + 0.001)),
        );

        if (tFade >= 1) continue; // fully revealed — draw nothing

        // ── Always keep the home cell masked until the pixel fully fades ────
        // Without this, the home cell becomes transparent while the pixel is
        // still mid-air, letting the glowing content bleed through.
        // Use full PIXEL_SIZE (no gap) so the cover is seamless solid black.
        ctx.globalAlpha = 1;
        ctx.fillStyle = coverRef.current;
        ctx.fillRect(px.homeX, px.homeY, PIXEL_SIZE, PIXEL_SIZE);

        // ── Once the pixel starts flying, draw it on top of the cover ───────
        if (tFlight > px.threshold) {
          const tEase = easeOutBack(tFlight);
          const x = Math.round(px.startX + (px.homeX - px.startX) * tEase);
          const y = Math.round(px.startY + (px.homeY - px.startY) * tEase);
          ctx.fillStyle = pixelRef.current;
          ctx.globalAlpha = 1 - tFade;
          ctx.fillRect(x, y, PIXEL_SIZE - PIXEL_GAP, PIXEL_SIZE - PIXEL_GAP);
        }
      }

      ctx.globalAlpha = 1;
    }

    // ── Imperative handle ─────────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        trigger() {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const rect = canvas.getBoundingClientRect();
          canvas.width = Math.round(rect.width) || canvas.offsetWidth || 190;
          canvas.height = Math.round(rect.height) || canvas.offsetHeight || 190;

          // Re-fill solid so no content is visible at t=0
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = coverRef.current;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          const originCoords = resolveOrigin(originRef.current);
          pixelsRef.current = buildPixels(
            canvas.width,
            canvas.height,
            originCoords,
          );
          progressRef.current.value = 0;

          tlRef.current?.kill();
          cancelAnimationFrame(rafRef.current);
          activeRef.current = false;

          const tl = gsap.timeline();
          tl.to(progressRef.current, {
            value: 1,
            duration: durRef.current,
            ease: "none",
            onComplete() {
              activeRef.current = false;
              const c = canvas.getContext("2d");
              c?.clearRect(0, 0, canvas.width, canvas.height);
            },
          });
          tlRef.current = tl;

          activeRef.current = true;
          const loop = () => {
            drawFrame(progressRef.current.value);
            if (activeRef.current) rafRef.current = requestAnimationFrame(loop);
          };
          rafRef.current = requestAnimationFrame(loop);
        },
      }),
      [],
    );

    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {children}
        {/*
          Mask canvas — starts solid, cells become transparent as wave passes.
          pointerEvents:none keeps revealed content immediately interactive.
        */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      </div>
    );
  },
);

export default PixelBurstReveal;

// =============================================================================
// USAGE EXAMPLES
// =============================================================================
//
// ── 1. Reveal a widget, sweep from top-right ──────────────────────────────────
//   <PixelBurstReveal ref={burst} origin="top-right" coverColor="#000">
//     <MyWidget />
//   </PixelBurstReveal>
//   burst.current?.trigger();
//
// ── 2. Full-screen reveal from bottom-left ────────────────────────────────────
//   <PixelBurstReveal ref={burst} origin="bottom-left" coverColor="#0a0a0a"
//     duration={2.5} style={{ position:"fixed", inset:0, zIndex:50 }}>
//     <EntirePage />
//   </PixelBurstReveal>
//
// ── 3. Custom origin ──────────────────────────────────────────────────────────
//   <PixelBurstReveal ref={burst} origin={{ x: 0.3, y: 0.7 }}>
//     <Content />
//   </PixelBurstReveal>
