# Fahad Al-Shwihani — Interactive Developer Portfolio

An interactive, bilingual (English / Arabic) developer portfolio built with React and WebGL. It pairs a terminal-inspired interface with a physics-driven 3D ID card, scroll-triggered motion, ReactBits-inspired visual effects, and a purpose-built performance layer that keeps rendering smooth across phones, tablets, laptops, and desktops.

**Live site: [fyaa.io](https://fyaa.io)**

> This repository is public so the source can be read and reviewed. It is **not open-source** — see [License](#license) and [`LICENSE`](./LICENSE).

---

## Overview

This is not a static, template-style portfolio.

- The landing view is a simulated SSH/terminal session that types itself out.
- The hero carries a draggable 3D lanyard badge driven by real rigid-body physics.
- The projects section is an interactive folder that fans open into a set of long-form case studies, each opening in a container-transform modal.
- The closing section is a second, self-typing terminal that prints out contact details and links.
- Every section is available in English and Arabic, with full right-to-left layout support and a live language switch.

Everything runs in the browser. There is no backend, database, or API — the production output is a static bundle. Client-side storage (`localStorage`) is used only to remember the selected language and whether the projects onboarding hints have been seen.

---

## Key features

- **Bilingual English / Arabic interface** with dynamic switching and persisted preference.
- **Full RTL / LTR handling** — direction, document language, and typography swap on `<html>` / `<body>` when the language changes.
- **Terminal-based hero** — a scripted connection sequence followed by a looping command cycle, typed and erased character by character.
- **Interactive 3D lanyard badge** — grab and throw the card with the pointer; it swings, twists, and settles under simulated gravity.
- **Procedurally generated woven strap** — the lanyard is real swept geometry, rebuilt in place each frame from the physics curve, not a flat line.
- **Runtime-composited card texture** — the badge's name and role are drawn to a canvas and composited into the card's texture atlas, so they localize with the rest of the site.
- **Finder-style project explorer** — a folder that opens into a fan of "papers", each a keyboard-operable button that opens a project case study.
- **First-visit onboarding** — dismissible coach marks guide the folder interaction, then never appear again.
- **Animated skills marquees** — continuously scrolling technology rows, one per category, that ease to a stop on hover.
- **Terminal-style contact section** — a transcript that types out identity, status, and links, over an animated background shader.
- **Scroll-reveal motion** across sections, reversible in both scroll directions.
- **Device-aware performance tiers** — quality settles on one of four levels based on hardware and a short real-frame-timing sample.
- **Viewport-aware rendering** — animation loops and WebGL canvases pause or drop to zero cost when off-screen or when the tab is hidden.
- **`prefers-reduced-motion` support** — motion-heavy effects fall back to static states.
- **Responsive layouts and interactions** tuned per breakpoint and per input type (pointer vs touch).

---

## Technology stack

Only dependencies actually present in `package.json` and used in `src/` are listed.

### Frontend

| Package | Role |
| --- | --- |
| `react`, `react-dom` (19) | UI runtime |
| `react-router-dom` (7) | Router shell and hash-based in-page navigation (`useLocation`) |
| `simple-icons` | Brand icon path data for the contact links |

### 3D and physics

| Package | Role |
| --- | --- |
| `three` (0.184) | WebGL renderer, geometry, materials for the hero |
| `@react-three/fiber` (9) | React renderer for Three.js (the `Silk` background and the `Lanyard`) |
| `@react-three/drei` (10) | `useGLTF`, `useTexture`, `Environment`, `Lightformer` helpers |
| `@react-three/rapier` (2) | Rapier physics bindings — rigid bodies and joints for the lanyard |

### Shaders / visual effects

| Package | Role |
| --- | --- |
| `ogl` | Minimal WebGL library powering the `FaultyTerminal` background shader behind the closing sections |
| `three` `ShaderMaterial` | The `Silk` flowing-gradient background behind the hero |

### Animation

| Package | Role |
| --- | --- |
| `gsap` | Timelines for the navigation menu, the project modal's container-transform open/close, and terminal cursor blink |
| Native `requestAnimationFrame` | Shared scheduler for the skills marquees and pointer-magnet effects |
| CSS transitions / keyframes | Scroll reveals, coach marks, hover states |

### Internationalization

| Package | Role |
| --- | --- |
| `i18next` | Core translation engine, language detection, persistence |
| `react-i18next` | React bindings (`useTranslation`) |

### Tooling / build

| Package | Role |
| --- | --- |
| `react-scripts` (5, Create React App) | Build pipeline, dev server, test runner |
| `@craco/craco` | CRA config override — adds a `.glb` asset loader and silences one upstream source-map warning from a `drei` transitive dependency |
| `@testing-library/*`, Jest (via CRA) | Unit tests |

There is no TypeScript, CSS framework, state-management library, or HTTP client in this project.

---

## Architecture

The page is a single route (`/`) composed of stacked sections. In-section navigation is hash-based and smooth-scrolled.

| Area | Location | Notes |
| --- | --- | --- |
| App shell | `src/app/` | `App.jsx` wires the router, i18n direction, and the performance-tier provider; `Homepage.jsx` composes the sections |
| Header | `src/layout/Header/` | `StaggeredMenu` (animated slide-in nav), `LanguageSwitcher`, active-section tracking |
| Footer | `src/layout/Footer/` | Rendered inside the closing scene so it shares its background |
| Hero | `src/sections/hero/` | `Terminal` (typed shell session), `Lanyard` mount, `HeroSilkTransition` (the `Silk` canvas + dissolve) |
| About / Experience | `src/sections/about/`, `src/sections/experience/` | Editorial and timeline layouts, content from i18n |
| Projects | `src/sections/projects/` | `Folder` (fan-open explorer), `ProjectModal` (case study), coach marks, image manifest |
| Skills | `src/sections/skills/` | Category marquees via `LogoLoop` |
| Contact / closing scene | `src/sections/contact/` | `Contact` (typed transcript), `EndingScene` + `FaultyTerminal` (one shared background shader behind Skills, Contact, and the Footer) |
| Shared components | `src/components/ui/` | `Lanyard`, `Silk`, `TextType`, `Reveal`, `ResumeRender` |
| Hooks | `src/hooks/` | Performance and lifecycle utilities (see below) |

---

## 3D and physics

The hero badge is the most involved 3D piece.

**Rendering.** The card model (`src/assets/models/lanyard/card.glb`) is loaded with `useGLTF` and rendered by React Three Fiber inside a `<Canvas>`. A `meshPhysicalMaterial` gives it a clear-coat, glossy finish; a small `Environment` of `Lightformer` strips provides the reflections. The front face shows a photo; the back face shows the name and role, which are drawn to an offscreen `<canvas>` at runtime and composited into the model's texture atlas — so the badge text follows the site's language.

**Physics.** Each of the lanyard's two strands is a short chain of Rapier rigid bodies connected by rope joints, anchored at the top and meeting at a shared connector. The card hangs from that connector by a spherical joint, so it can yaw and pitch freely. Light idle torque keeps it gently alive after the initial drop.

**Interaction.** On pointer-down the card becomes kinematic and follows the cursor (unprojected into world space); on release it returns to dynamic simulation and swings out its momentum. Pointer interaction is only wired up for fine (mouse) pointers.

**The strap.** Rather than a flat camera-facing line, each strand is real extruded geometry with width and thickness. A cross-section is swept along the physics curve using parallel-transport frames, and torsion from the card's rotation winds down the strap and dissipates toward the anchor. The mesh topology is built once; every frame only rewrites vertex positions and normals in place — no per-frame allocation.

**Backgrounds.** The hero sits over `Silk`, a flowing-gradient fragment shader rendered through React Three Fiber. The Skills / Contact / Footer block sits over `FaultyTerminal`, a heavier "digital rain" shader rendered with `ogl`. Both are decorative (`aria-hidden`) and both stop rendering when scrolled away.

**Offscreen behavior.** The hero canvases keep their WebGL context and last frame but switch to on-demand rendering when off-screen — the animation loop stops, and a small in-canvas helper (`ResumeRender`) forces a single repaint the moment the canvas returns to view, on window resize, and on tab re-focus, so it never comes back blank. The closing-scene shader pauses entirely while its region is out of view.

---

## Animation and visual effects

| System | Used for |
| --- | --- |
| **GSAP** | `StaggeredMenu` open/close timelines (layered panels, item stagger, icon and label transitions); `ProjectModal` container-transform (FLIP from the clicked item to the centered panel, with a staggered content cascade, played in reverse to close); `TextType` cursor blink |
| **`requestAnimationFrame`** | A single shared loop (`useSharedRAF`) drives every Skills marquee and the projects pointer-magnet offsets; individual components no longer run their own loops |
| **WebGL / GLSL** | `Silk` (Three.js `ShaderMaterial`) and `FaultyTerminal` (`ogl`) background shaders; the Lanyard scene |
| **CSS** | Scroll reveals (`Reveal` — an `IntersectionObserver` toggling a class, reversible), coach-mark keyframes, hover and focus states, the progressive backdrop-blur dissolves between sections |
| **Custom timing** | The hero `Terminal` types and erases with elapsed-time polling (robust to a busy main thread), not a chain of dependent timeouts |

### ReactBits-inspired components

Several visual components began as concepts from [React Bits](https://reactbits.dev) and were adapted and customized for this portfolio:

- **`Lanyard`** — the physics rig, the woven-strap geometry, the runtime texture compositing, and the performance gating are bespoke; the flat-line rope of the original was replaced entirely.
- **`Folder`** — generalized from a fixed 3-item layout to any number of "papers" positioned by a polar fan formula, with a controlled open state and real interactive children.
- **`Silk`**, **`FaultyTerminal`** — shader backgrounds, extended with viewport gating, adaptive pixel budgets, and quality tiers.
- **`LogoLoop`** — the scrolling technology marquee, rewired onto the shared RAF loop and per-instance viewport gating.
- **`TextType`** — the typing effect, with lifecycle fixes so its cursor animation stops when off-screen.
- **`StaggeredMenu`** — the slide-in navigation, with the active-section highlight and bilingual behavior added.

`Reveal`, the hero `Terminal`, and the contact transcript are original to this project.

---

## Performance architecture

The site renders multiple WebGL canvases, several animation loops, and long scrollable sections. A small shared layer keeps that affordable.

**Device quality tiers.** `usePerformanceTier` resolves one of four levels (`very-low`, `low`, `medium`, `high`) from CPU core count, device memory, GPU renderer string, and screen pixel load. It then samples real frame timing for roughly 1.2 seconds after load and drops exactly one tier, once, if the device is visibly struggling. The resolved tier is written to `data-perf-tier` on `<html>` so CSS effects (backdrop-blur radii, etc.) scale with it, and it feeds canvas DPR and shader detail.

**One animation loop.** `useSharedRAF` is a single page-wide `requestAnimationFrame` loop. Components register a per-frame callback; the loop runs only while at least one callback is registered and the tab is visible, and stops itself otherwise.

**Pooled observers.** `useInViewport` and `useRevealObserver` keep one `IntersectionObserver` per distinct root margin / threshold and share it via a target-to-callback map, instead of creating one observer per component.

**Viewport-aware canvases.**
- Hero canvases switch to React Three Fiber `frameloop="demand"` when off-screen — the RAF loop stops, but the canvas can still be repainted on demand (see `ResumeRender`). They load eagerly so first paint is never blocked.
- The closing-scene shader canvas is pinned to roughly one viewport with CSS `position: sticky` rather than spanning the full height of three stacked sections, and its fragment count is bounded by a per-tier pixel budget and adaptive DPR. It pauses when its region is off-screen.

**Code splitting.** The `FaultyTerminal` shader (`ogl`) and the `ProjectModal` are lazy-loaded; the hero's Three.js / Rapier stack is deliberately eager.

**React render cost.** Frequently updating trees are memoized (`Skills` marquee content, `Projects` derived lists, `StaggeredMenu`, the contact transcript). Pointer-driven effects write CSS custom properties directly to the DOM on a rAF instead of routing through React state.

**Capability signals.** `usePointerCapabilities` (fine vs coarse pointer), `useDocumentVisible` (tab hidden), `useReducedMotion` (`prefers-reduced-motion`), and `useHasScrolled` (page still at the top) gate work so nothing runs where it has no value.

**GPU cleanup.** Three.js textures created at runtime (the composited card atlas, the back-face canvas texture) are disposed when replaced or on unmount; strap geometries are disposed on unmount; the shader canvas releases its WebGL context on teardown.

---

## Internationalization

- **Engine:** `i18next` + `react-i18next`. Suspense is disabled; translations are bundled, not fetched.
- **Languages:** English (`en`) and Arabic (`ar`). Initial language is the saved preference, then the browser language, then Arabic as the fallback. The choice is persisted to `localStorage`.
- **Direction:** on every language change, `App.jsx` sets `dir` and `lang` on `<html>`, and toggles `rtl` / `ltr` classes on `<body>`. Typography is driven by CSS custom properties keyed on those classes (the Thmanyah typeface family, plus JetBrains Mono for terminal and monospace UI).
- **Localized content:** navigation, hero copy, the About and Experience text, full project case studies (overview, architecture, challenges, solutions, tags, links), the skills copy, and the contact transcript all come from `src/i18n/locales/{en,ar}.json`.
- **Terminal commands stay English.** Shell strings such as `ssh`, `whoami`, `ls`, and prompt text are treated as system output, not UI copy, so they are constants and do not translate. Only the *printed results* of those commands are localized.

---

## Responsive design

The layout targets desktop, laptop, tablet, and mobile. Beyond CSS breakpoints:

- The hero 3D scene rescales the card and anchor points across width ranges, and reduces device pixel ratio and physics rate on smaller / mobile viewports.
- The Skills marquee sizing steps down at narrower widths.
- Pointer-reactive effects (the shader mouse ripple, the folder pointer-magnet) are only installed for fine pointers, so touch devices skip that work.
- Canvas pixel budgets and effect richness follow the resolved performance tier, which itself accounts for screen resolution and DPR.

---

## Accessibility

Implemented in the current code:

- Semantic landmarks: a single visually-hidden `<h1>`, `<section>` elements with `<h2>` headings nested beneath it, `<nav>` / `<header>` / `<footer>`.
- Decorative canvases are marked `aria-hidden`.
- The projects folder is keyboard-operable (`role="button"`, `tabIndex`, Enter / Space), and each project "paper" is a real `<button>` with an accessible label.
- The project modal traps focus, closes on `Escape`, and restores focus to the trigger on close.
- The navigation menu manages focus on open / close, closes on `Escape` and outside click, and exposes `aria-expanded` / `aria-hidden`.
- Icon-only controls carry `aria-label`s; the coach-mark tooltip uses `role="status"`.
- `prefers-reduced-motion` is respected in both JavaScript (motion-gated effects) and CSS (`@media (prefers-reduced-motion: reduce)` fallbacks).

---

## Project structure

```
src/
├── app/                App shell (router, i18n direction, perf provider) and page composition
├── layout/
│   ├── Header/          Slide-in navigation, language switcher, active-section tracking
│   └── Footer/          Site footer (rendered inside the closing scene)
├── sections/
│   ├── hero/            Typed terminal, 3D lanyard mount, Silk background + dissolve
│   ├── about/           Editorial profile section
│   ├── experience/      Career timeline
│   ├── projects/        Fan-open folder, project case-study modal, coach marks, image manifest
│   ├── skills/          Category technology marquees
│   └── contact/         Typed contact transcript, plus the shared EndingScene / FaultyTerminal shader
├── components/ui/       Reusable pieces: Lanyard, Silk, TextType, Reveal, ResumeRender
├── hooks/               Performance and lifecycle hooks (tiers, shared RAF, observer pooling, …)
├── i18n/                i18next setup and en / ar locale resources
├── styles/             Global reset, design tokens, shared section styles
└── assets/             Thmanyah fonts, card.glb model, images, résumé PDF
```

Configuration lives in `craco.config.js` (a `.glb` asset rule and one suppressed upstream warning). The `public/` folder holds the HTML template, favicons, PWA manifest, `sitemap.xml`, `robots.txt`, and an Apache `.htaccess`.

---

## Getting started

### Prerequisites

- **Node.js 18 or newer**
- **npm** (the repository uses `package-lock.json`)

### Install

```bash
git clone https://github.com/FahadAlshwihani/PORTFOLIO.git
cd PORTFOLIO
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required: `react-scripts` 5 (Create React App) declares outdated peer-dependency ranges that conflict with the modern dependency tree. Installing from the committed lockfile with `npm ci` also works.

### Run

```bash
npm start
```

Starts the development server at `http://localhost:3000` with hot reload.

### Build

```bash
npm run build
```

Produces an optimized, hashed static bundle in `build/`.

---

## Available scripts

| Script | Description |
| --- | --- |
| `npm start` | Development server with hot reload (via CRACO) |
| `npm run build` | Production build to `build/` |
| `npm test` | Jest / React Testing Library test runner (watch mode; `CI=true npm test` for a single run) |
| `npm run eject` | Ejects Create React App configuration. One-way, not needed for normal use |

---

## Deployment

The production output is a static site — the contents of `build/` can be served by any static host or web server.

The live deployment at [fyaa.io](https://fyaa.io) is served as static files from a standard web server. `public/.htaccess` is included for Apache-based hosts and provides:

- a single-page-app rewrite (unknown paths fall back to `index.html`, real files and directories are passed through), and
- baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`).

SEO and social metadata (canonical URL, Open Graph, Twitter card, PWA manifest, sitemap, robots) are defined in `public/index.html` and the `public/` assets. There are no secrets, environment variables, or server-side components in this repository.

---

## Credits and acknowledgements

This project is built on open-source work by others. Each remains the property of its authors and is used under its own license:

- **[React](https://react.dev)** and **[React DOM](https://react.dev)**
- **[Three.js](https://threejs.org)**, **[React Three Fiber](https://github.com/pmndrs/react-three-fiber)**, **[drei](https://github.com/pmndrs/drei)**
- **[Rapier](https://rapier.rs)** and **[@react-three/rapier](https://github.com/pmndrs/react-three-rapier)**
- **[OGL](https://github.com/oframe/ogl)**
- **[GSAP](https://gsap.com)**
- **[i18next](https://www.i18next.com)** and **[react-i18next](https://react.i18next.com)**
- **[React Router](https://reactrouter.com)**
- **[Simple Icons](https://simpleicons.org)**
- **[Create React App](https://create-react-app.dev)** / `react-scripts`, **[CRACO](https://craco.js.org)**
- The **Thmanyah** typeface family, included as a third-party font and used under its own terms.

Selected visual components — the lanyard, the folder explorer, the shader backgrounds, the logo marquee, the typing effect, and the staggered menu — began as concepts from **[React Bits](https://reactbits.dev)** and were adapted and customized for this portfolio, in some cases substantially rewritten. React Bits is credited as the origin of those concepts; its code remains under its own license.

---

## Copyright and usage rights

© 2026 Fahad Al-Shwihani. All rights reserved.

A distinction applies:

**1. Third-party open-source dependencies** (everything listed under *Credits and acknowledgements*) remain the property of their respective authors and are governed solely by their own licenses. Nothing in this section overrides those licenses.

**2. This portfolio's original material** — the design and visual identity, the custom source implementation, the personal branding, all written content and project descriptions, the photography and image assets, and the résumé — is not open source. Unless explicitly authorized in writing by the copyright holder:

- the portfolio design may not be redistributed or reused,
- the personal branding, content, and copy may not be reused,
- project-specific assets (screenshots, case-study text) may not be copied,
- the custom source code may not be republished, sold, sublicensed, or redistributed.

---

## License

**This repository is publicly viewable, but it is not open-source.**

It is covered by a proprietary, all-rights-reserved notice — see [`LICENSE`](./LICENSE). No open-source license (MIT, Apache, GPL, BSD, ISC, or otherwise) applies. Being publicly viewable on GitHub does not grant permission to fork for reuse, redistribute, re-host, or use the project as a template.

You may view and read the source, and clone it for local private inspection and learning. Any use beyond that requires prior written permission from the copyright holder. Third-party dependencies remain under their respective licenses, and the notice in `LICENSE` does not modify or override them.

The `package.json` `license` field is set to `UNLICENSED` to reflect this.

---

## Contact

- **Website:** [fyaa.io](https://fyaa.io)
- **LinkedIn:** [linkedin.com/in/fahad-alshwihani](https://www.linkedin.com/in/fahad-alshwihani/)
- **GitHub:** [github.com/FahadAlshwihani](https://github.com/FahadAlshwihani)
