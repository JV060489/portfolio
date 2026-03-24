"use client";

/**
 * ThemeTransitionOverlay
 * ──────────────────────
 * Full-screen fixed canvas for the theme-toggle peel effect.
 *
 * Design
 * ──────
 * 1. `onToggle()` fires synchronously → React re-renders to new mode.
 *    (React commits before the next RAF, so the new theme is ready
 *     underneath by the time the first GSAP frame is drawn.)
 *
 * 2. A single ring expands outward from the bulb's screen position.
 *    There is NO initial full-screen fill — `drawFrame` itself draws
 *    `coverColor` for every cell the ring hasn't reached yet.
 *    This means at t=0 you see: old-mode bg (covered) everywhere
 *    except a tiny transparent dot at the origin (new mode showing).
 *    Both modes are visible simultaneously throughout the animation.
 *
 * 3. The ring is thin — width is set by two constants:
 *    - DITHER_BAND : Bayer-4×4 ordered dither spreads reveal across 4 cells
 *    - FLASH_DUR   : brief per-cell pixelColor flash as the ring passes
 *    Together these produce a ~3-5 pixel-cell wide crisp leading edge.
 *
 * 4. GSAP's `onUpdate` callback drives every draw — no separate RAF loop,
 *    so there is no race condition between GSAP progress and rendering.
 */

import { useRef, useImperativeHandle, forwardRef } from "react";
import gsap from "gsap";

// ── Constants ────────────────────────────────────────────────────────────────
const PIXEL_SIZE = 8;
const PIXEL_GAP = 1;

/**
 * The ring front reaches the farthest corner at MAX_STAGGER progress.
 * All cells have arriveAt ≤ MAX_STAGGER + DITHER_BAND, so by progress=1
 * the canvas is fully transparent.
 */
const MAX_STAGGER = 0.75;

/**
 * Width of the Bayer-dithered ring in normalised progress units.
 * DITHER_BAND / MAX_STAGGER ≈ fraction of maxDist that is "in the ring".
 * At 1920×1080 with origin at top-center (maxDist ≈ 2000px):
 *   0.012 / 0.75 * 2000 ≈ 32px ≈ 4 PIXEL_SIZE cells  ← target width
 */
const DITHER_BAND = 0.012;

/**
 * Each cell briefly flashes `pixelColor` for this many progress units
 * just before it reveals.  Keeps the ring visually "alive" without scatter.
 */
const FLASH_DUR = 0.008;

// Bayer 4×4 ordered-dither map — values 0–15, same as PixelBurstReveal
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ── Types ────────────────────────────────────────────────────────────────────
interface PixelDesc {
  homeX: number;
  homeY: number;
  /** Progress value at which this cell becomes transparent. */
  arriveAt: number;
}

export interface ThemeTransitionHandle {
  /**
   * Start the peel transition.
   * `onToggle` is called synchronously before any drawing begins —
   * switch the theme there so the new mode is ready underneath.
   * Ignored while a transition is already running.
   */
  trigger(opts: {
    /** Normalised screen position of the peel origin (bulb location). */
    origin: { x: number; y: number };
    /**
     * Solid colour for cells the ring hasn't reached yet.
     * Pass the CURRENT (old) theme's background colour so the
     * unrevealed region looks like the old mode.
     */
    coverColor: string;
    /** Ring-edge flash colour — pass the contrasting colour. */
    pixelColor: string;
    /** Called synchronously before animation — switch the theme here. */
    onToggle: () => void;
    /** Total animation duration in seconds. @default 2.0 */
    duration?: number;
  }): void;
}

// ── Pixel grid ───────────────────────────────────────────────────────────────
function buildPixels(
  w: number,
  h: number,
  origin: { x: number; y: number },
): PixelDesc[] {
  const cols = Math.ceil(w / PIXEL_SIZE);
  const rows = Math.ceil(h / PIXEL_SIZE);
  const ox = origin.x * w;
  const oy = origin.y * h;

  // Farthest corner — ensures ring always covers the whole screen
  const maxDist = Math.max(
    Math.sqrt(ox * ox + oy * oy),
    Math.sqrt((w - ox) * (w - ox) + oy * oy),
    Math.sqrt(ox * ox + (h - oy) * (h - oy)),
    Math.sqrt((w - ox) * (w - ox) + (h - oy) * (h - oy)),
  );

  const pixels: PixelDesc[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const homeX = col * PIXEL_SIZE;
      const homeY = row * PIXEL_SIZE;

      const cx = homeX + PIXEL_SIZE * 0.5;
      const cy = homeY + PIXEL_SIZE * 0.5;
      const d = Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2) / maxDist; // 0→1

      // Bayer threshold staggers reveal within the ring band
      const bRow = row % 4,
        bCol = col % 4;
      const threshold = BAYER_4X4[bCol + bRow * 4] / 16; // 0→0.9375

      // Cell becomes transparent when progress reaches arriveAt
      const arriveAt = d * MAX_STAGGER + threshold * DITHER_BAND;

      pixels.push({ homeX, homeY, arriveAt });
    }
  }

  return pixels;
}

// ── Draw one frame ────────────────────────────────────────────────────────────
function drawFrame(
  progress: number,
  pixels: PixelDesc[],
  ctx: CanvasRenderingContext2D,
  coverColor: string,
  pixelColor: string,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const { homeX, homeY, arriveAt } of pixels) {
    // Ring has passed — transparent, new theme shows through
    if (progress >= arriveAt) continue;

    // Cell is still covered — draw old-theme bg
    ctx.globalAlpha = 1;
    ctx.fillStyle = coverColor;
    ctx.fillRect(homeX, homeY, PIXEL_SIZE, PIXEL_SIZE);

    // Brief in-place flash as the ring front approaches
    // (builds from 0→1 over FLASH_DUR progress units just before reveal)
    if (progress > arriveAt - FLASH_DUR) {
      const t = (progress - (arriveAt - FLASH_DUR)) / FLASH_DUR; // 0→1
      ctx.fillStyle = pixelColor;
      ctx.globalAlpha = t;
      ctx.fillRect(homeX, homeY, PIXEL_SIZE - PIXEL_GAP, PIXEL_SIZE - PIXEL_GAP);
      ctx.globalAlpha = 1;
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const ThemeTransitionOverlay = forwardRef<ThemeTransitionHandle>(
  function ThemeTransitionOverlay(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef({ value: 0 });
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const activeRef = useRef(false);

    const pixelsRef = useRef<PixelDesc[]>([]);
    const coverColorRef = useRef("#000000");
    const pixelColorRef = useRef("#ffffff");

    useImperativeHandle(ref, () => ({
      trigger({ origin, coverColor, pixelColor, onToggle, duration = 2.0 }) {
        if (activeRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Size the canvas to the full viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // ── Switch theme now (synchronous) ──────────────────────────────────
        // React will commit the new-mode re-render before the next RAF,
        // so by the time GSAP's first onUpdate fires the new theme is live
        // underneath the canvas. Cells inside the already-expanded ring
        // immediately show the correct new mode through the transparent canvas.
        onToggle();

        // Build pixel grid after sizing (needs canvas dimensions)
        coverColorRef.current = coverColor;
        pixelColorRef.current = pixelColor;
        pixelsRef.current = buildPixels(canvas.width, canvas.height, origin);
        progressRef.current.value = 0;

        tlRef.current?.kill();
        activeRef.current = true;

        // ── GSAP drives progress; onUpdate renders every frame ──────────────
        // Using onUpdate (not a separate RAF loop) guarantees the draw always
        // happens in the same tick that GSAP advances — no frozen-frame race.
        const tl = gsap.timeline({
          onUpdate() {
            drawFrame(
              progressRef.current.value,
              pixelsRef.current,
              ctx,
              coverColorRef.current,
              pixelColorRef.current,
            );
          },
          onComplete() {
            activeRef.current = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          },
        });

        tl.to(progressRef.current, {
          value: 1,
          duration,
          ease: "none",
        });

        tlRef.current = tl;
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    );
  },
);

export default ThemeTransitionOverlay;
