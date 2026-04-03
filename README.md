# Janarthanan Vasanth — 3D Portfolio

An immersive, interactive 3D portfolio built with React Three Fiber and Next.js. Every section of the site lives inside a WebGL canvas with scroll-driven animations, post-processing effects, and a fully responsive mobile experience.

## Preview

| Section | Highlights |
|---------|------------|
| **Intro** | Animated 3D text with typewriter subtitle, scroll-locked cinematic intro |
| **About Me** | Custom scene lighting and themed sections |
| **Stack** | Animated cube rain showcasing tech skills |
| **Projects** | Parallax layouts, living cards with video/image media |
| **Contact** | Magnetic hover effects, blur-fade transitions, avatar mosaic |

## Tech Stack

### Core

- **Next.js 16** — App Router, dynamic imports with SSR disabled for canvas components
- **React 19** — Client-side rendering with `useSyncExternalStore` for responsive breakpoints
- **TypeScript** — End-to-end type safety

### 3D & Graphics

- **Three.js** — Low-level WebGL rendering
- **React Three Fiber (R3F)** — Declarative Three.js in React
- **@react-three/drei** — Helpers, abstractions, and ready-made components
- **@react-three/postprocessing** — Bloom, vignette, and noise effects

### Animation

- **GSAP** — ScrollTrigger-driven animations, SplitText typewriter effects
- **Framer Motion** — Layout and component transitions
- **React Spring** — Physics-based animations for 3D objects
- **Lenis** — Buttery smooth scroll with GSAP ScrollTrigger sync

### Styling

- **Tailwind CSS 4** — Utility-first styling with `tailwind-merge` for class composition
- **Custom Google Fonts** — Aldrich, Bitcount Single Ink, Pixelify Sans

### Infrastructure

- **Vercel** — Hosting and deployment
- **Vercel Blob** — Media asset storage (project images and videos)

## Project Structure

```
app/
  _Intro/          # 3D intro text + "Hi I'm" animation
  _AboutMe/        # About section with custom 3D lights
  _Stack/          # Tech stack cube rain
  _Projects/       # Scroll-driven project showcase
  _Contact/        # Contact section with magnetic effects
  _ParentCanvas/   # Main R3F canvas, loading screen, cursor light
  _Mobile/         # Dedicated mobile layout
  content/         # Centralized site content (siteContent.ts)
  context/         # Theme context (dark/light)
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build && npm start
```

Open [https://janarthanan-vasanth.in/](https://janarthanan-vasanth.in/) to view the site.

## Responsive Design

The site detects touch-primary devices and narrow viewports (`<= 768px`) and serves a dedicated mobile experience. Desktop users get the full 3D canvas with post-processing, smooth scroll, and cursor-tracking light effects.

## License

This is a personal portfolio project. All rights reserved.
