# Agents Guide

This document describes the project structure, conventions, and key areas of this codebase to help AI agents work effectively on it.

## Project Overview

A 3D web portfolio built with Next.js and React Three Fiber. The site features a heavily animated intro sequence using custom GLSL shaders, instanced rendering, and GSAP timelines, with an interactive Rubik's cube and a neon navigation cube.

**Owner:** Janarthanan Vasanth — 3D Web Developer

---

## Tech Stack

| Area | Library / Version |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| 3D Engine | Three.js 0.183 |
| React 3D | @react-three/fiber 9, @react-three/drei 10 |
| 3D Animation | @react-spring/three 10 |
| Gestures | @use-gesture/react 10 |
| Tweening | GSAP 3 |
| Styling | Tailwind CSS 4, clsx, tailwind-merge |
| Debug UI | leva |
| Language | TypeScript 5 |

---

## Project Structure

```
app/
  _r3fComponents/        # All Three.js / R3F components (prefixed _ = internal)
    ParentCanvas.tsx       # Root canvas; drives the animation timeline
    IntroText.tsx          # Dithered text reveal (25,600 instanced cubes)
    NavCube.tsx            # 6-face neon navigation cube with per-face shaders
    PixelBurst.tsx         # Reusable pixel-sweep reveal wrapper
    RubiksCube.tsx         # Scene wrapper for the Rubik's cube demo
    TestCube.tsx           # Interactive 3×3×3 Rubik's cube logic
  layout.tsx             # Root layout — fonts, metadata
  page.tsx               # Entry point — renders <ParentCanvas />
  globals.css            # Tailwind base styles
utils/
  utils.ts               # cn() — classname merger (clsx + tailwind-merge)
public/                  # Static assets
```

---

## Component Responsibilities

### ParentCanvas
- Creates the main `<Canvas>` and orchestrates the intro sequence.
- Fires PixelBurst reveal triggers at specific ms offsets (200ms, 2200ms, 4200ms).
- Renders `IntroText` and two `PixelBurstReveal` overlays ("Hi, I'm" + "3D Web Developer").
- **NavCube is commented out here** — re-enable when adding navigation.

### IntroText
- Renders an 80×320 grid of instanced mesh cubes (25,600 instances).
- Uses Bayer 4×4 ordered dithering + Simplex noise to animate a text reveal.
- Custom vertex + fragment shaders control per-instance dither threshold and Z-pop.
- GSAP timeline: 10s dither progress → 12s orthographic camera zoom (70→2.5).
- Hover: spring-physics bounce via `elastic.out` easing.
- **The text content (owner's name) is on line 311.**

### NavCube
- Six-faced cube with per-face GLSL shaders (carved text + neon glow).
- Faces: Intro, About, Skills, Contact (top/bottom blank).
- Face-specific neon palette defined in `COLORS` object.
- Spring-driven glow intensity based on face-to-camera alignment.
- Wrapped in `PixelBurstReveal` for entrance animation.

### PixelBurstReveal
- Generic reveal wrapper — place any React content inside and call `.trigger()`.
- Two modes: radial sweep (default) or text-only mask (reads glyph pixels via OffscreenCanvas).
- Props: `origin`, `duration` (default 2s), `color`, text-mask options.
- Exposed imperative handle: `ref.current.trigger()`.

### TestCube (Rubik's Cube)
- 27 `Cubie` instances arranged in a 3×3×3 grid.
- WCA standard sticker colors defined in `STICKER` object.
- Drag-to-rotate: detects affected layer via face normals + camera world-space vectors.
- Rotation animates over 600ms (ease-out-cubic); state mutations blocked during animation.

---

## Key Patterns & Conventions

### Animation
- **GSAP timelines** for sequenced, precisely timed animations.
- **useRef for mutable 3D state** — avoids re-renders during animations.
- **Direct Three.js mutations** inside `useFrame` and event handlers (not React state).
- Spring physics via GSAP `elastic.out` or `@react-spring/three`.

### Rendering
- **Instanced meshes** (`InstancedMesh` + `InstancedBufferAttribute`) for large grids.
- **Custom GLSL shaders** in `NavCube` and `IntroText` for advanced visual effects.
- **Canvas textures** rendered at runtime for text on cube faces.
- **Orthographic camera** in `IntroText` scene; perspective elsewhere.

### Code style
- `useImperativeHandle` exposes imperative APIs on components (e.g., PixelBurst trigger).
- Memoized sub-components with `memo()` where re-renders are expensive (e.g., `Cubie`).
- Path alias `@/` maps to the project root.
- `cn()` utility from `utils/utils.ts` for all conditional Tailwind class merging.

---

## Common Edit Locations

| Task | File | Notes |
|---|---|---|
| Change owner name / intro text | [IntroText.tsx](app/_r3fComponents/IntroText.tsx) | Line 311 |
| Add/rename nav cube faces | [NavCube.tsx](app/_r3fComponents/NavCube.tsx) | Face labels + `COLORS` object |
| Rubik's cube sticker colors | [TestCube.tsx](app/_r3fComponents/TestCube.tsx) | `STICKER` constant |
| Intro sequence timing | [ParentCanvas.tsx](app/_r3fComponents/ParentCanvas.tsx) | `useEffect` trigger offsets |
| Dither animation duration | [IntroText.tsx](app/_r3fComponents/IntroText.tsx) | GSAP timeline durations |
| Global fonts | [layout.tsx](app/layout.tsx) | Next.js font imports |
| Add new pages/routes | `app/` | Standard Next.js App Router |

---

## Dev Commands

```bash
npm run dev    # Start dev server with HMR
npm run build  # Production build
npm start      # Serve production build
npm run lint   # Run ESLint
```

---

## Branch Notes

- **main** — stable branch for PRs
- **r3f-test** — active development branch (current)

Recent work: Added NavCube, PixelBurst, custom Rubik's cube, and dithered text effect.
