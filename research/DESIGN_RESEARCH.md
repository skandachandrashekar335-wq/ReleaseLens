# ReleaseLens — Comprehensive Design Research & Synthesis

> **Status:** EXPERIMENTALLY_VERIFIED via Ego Browser & Cloned Design Skills  
> **Date:** 2026-11-09  
> **Target Product:** ReleaseLens (Cloud-Hosted Web Application Testing, Bug Intelligence & Release Readiness Platform)

---

## 1. GitHub Design Knowledge Base

We analyzed and installed the core design skill repositories in `~/.local/share/design-skills/` and symlinked them to `~/.gemini/config/skills/`. Below are the concrete, enforceable engineering rules gathered from each repository.

### 1.1 `pbakaus/impeccable` (Design Vocabulary & Anti-Slop Detector)
* **Core Rule Set (62 Rules)**:
  - *No Default Gradients*: Reject purple-to-blue or pastel diagonal linear gradients. Color transitions must have physical meaning (e.g. status changes, spectral dissipation).
  - *No Bento Box Monotony*: Do not automatically divide every feature section into 3 equal rounded cards. Use asymmetric composition based on content weight.
  - *No Decorative Headings*: Every heading must stand on its own without requiring an auxiliary eyebrow badge or floating pill tag above it.
  - *High Contrast Discipline*: Maintain minimum WCAG AA contrast (4.5:1 for body copy, 3:1 for large display titles). Subdued secondary text must never fall below 4:1.
  - *CLI Commands*: Run `npx -y impeccable detect src/` to flag contrast failures, missing focus states, and styling regressions.

### 1.2 `Leonxlnx/taste-skill` (Art Direction & Structural Rigor)
* **The 9 House Rules**:
  1. *No Image Captions*: Never put a descriptive caption under an image or graphic. Attribution belongs in a single footer line.
  2. *Every Visual Must Render*: Zero empty grounds or broken layout shells across 1440px, 1024px, 768px, and 390px.
  3. *One Section per Screen*: At 1440x900 viewport, the hero stands alone on screen one. Never let section 2 headings peek over the fold on first load.
  4. *Equal Left and Right Edges*: Content grid gutters and margin offsets must be mathematically symmetrical across viewport bounds.
  5. *Hover Micro-Animations*: Hovered cards lift exactly 2px (`transform: translateY(-2px)`), images zoom subtly (1.02x to 1.03x), buttons depress 1px on active click.
  6. *Real Photographs & UI Evidence*: Zero decorative placeholder graphics. Show real product telemetry and concrete screenshots.
  7. *Authentic Full-Color Icons*: Real recognizable logos and Lucide technical iconography; never hand-drawn emoji approximations.
  8. *Shader Effects Reserved for Tech/Dev*: Complex WebGL or canvas effects are strictly reserved for developer tools, engineering platforms, and deep technical subjects.
  9. *Privacy in Evidence*: Strip real user phone numbers, coordinates, and private credentials from screenshots and demo records.

### 1.3 `Nutlope/hallmark` (Anti-AI-Slop Gatekeeper)
* **The Floor (Non-Negotiable Invariants)**:
  1. *Token Strictness*: Every color and font family must resolve through `:root` CSS variables. Zero hardcoded hex colors or inline font family declarations past the token block.
  2. *Transition Restraint*: Never declare `transition: all`. Never animate layout properties (`width`, `height`, `top`, `left`). Animate only `opacity` and `transform`.
  3. *Typography Pureness*: Never mix italic words into a roman sans-serif heading.
  4. *Overflow Safety*: Declare `overflow-x: clip` on both `html` and `body` (never `hidden` which breaks sticky positioning, never `100vw`).
  5. *Grid Track Safety*: Image and canvas tracks must use `minmax(0, 1fr)` to prevent container blowout. Display headings must carry `overflow-wrap: break-word; min-width: 0`.
  6. *Instant Focus Rings*: Every interactive element must have `:focus-visible` appearing instantly (zero transition on focus rings).
  7. *Reduced Motion Handling*: Full `@media (prefers-reduced-motion: reduce)` override that zeroes animations and ensures all content is immediately readable.
  8. *Zero Invented Proof*: Never fabricate customer counts, fake testimonial quotes, or fake partner logos.
  9. *No Eyebrow Badges*: Abolish tracked-capital eyebrow pills above headings. Headings lead directly in sentence case.
  10. *Clean Meta Data*: Never use middle-dot (`·`) separated strings or glued arrow characters (`→`) in link labels.
  11. *Hero Viewport Constraint*: Headline, value sentence, and primary action must be 100% visible at 1280x800 without scrolling.
  12. *Text Density*: Limit body copy to approximately 80 words per screen.

### 1.4 `emilkowalski/skills` (Animation Craft from Linear & Vercel)
* **Physics & Timing Standards**:
  - *Micro-Interactions (Hovers, Toggles, Tooltips)*: 150ms–200ms duration with `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out quint). Fast in, gentle settle.
  - *Modal & Drawer Entrances*: 250ms–350ms duration with `cubic-bezier(0.32, 0.72, 0, 1)` (spring-like deceleration).
  - *Audit Execution Progress Timelines*: 400ms–600ms staged step reveals with 80ms stagger between list items.
  - *What NOT to Animate*: Layout grids, table cell widths, body font sizes, and full-page background color shifts.
  - *GPU Acceleration*: Force compositor layers using `will-change: transform` or `transform: translateZ(0)` exclusively during active animation, unbinding after settle.

### 1.5 `Motionsites-AI/claude-skill` (Cinematic Engineering & Web Builder Recipes)
* **Recipes for High-End Engineering Platforms**:
  - *Liquid Glass Telemetry Borders*: Subtly translucent borders (`rgba(255, 255, 255, 0.08)`) with subtle specular highlights on top borders (`border-t: rgba(255, 255, 255, 0.15)`).
  - *Spotlight Reveal Cards*: Mouse-tracking radial gradient overlay that illuminates card borders when hovered without overwhelming content contrast.
  - *Auditing Pulse Timelines*: Clean status nodes transitioning from pulsing amber (`RUNNING`) to solid emerald (`PASS`) or solid ruby (`FAIL`).

### 1.6 `anthropics/skills` (`frontend-design`)
* **Agency-Grade Aesthetics**:
  - Ground every UI element in the domain: for ReleaseLens, this means terminal monospace readouts, precision status badges, and forensic evidence tables.
  - Asymmetric, purposeful layouts that break away from cookie-cutter SaaS templates.

---

## 2. Live Site Observations (Ego Browser Research)

Ten live websites across distinct domains were inspected and screenshotted using **Ego Browser** (both 1440x900 desktop and 390x844 mobile viewports).

| Site | Domain / Field | Desktop Screenshot | Mobile Screenshot | Primary Craft Inspiration |
| :--- | :--- | :--- | :--- | :--- |
| **Optimus Delta** | Engineering/Fintech | [`01_optimus_delta_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/01_optimus_delta_desktop.png) | [`01_optimus_delta_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/01_optimus_delta_mobile.png) | Deep obsidian `#08090C`, high-density telemetry tables, emerald dial gauges |
| **Linear Method** | Product Engineering | [`02_linear_method_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/02_linear_method_desktop.png) | [`02_linear_method_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/02_linear_method_mobile.png) | `rgb(8, 9, 10)` ground, Tiempos Headline display serif, extreme margin consistency |
| **Resend** | Developer Platform | [`03_resend_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/03_resend_desktop.png) | [`03_resend_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/03_resend_mobile.png) | Pure black `rgb(0, 0, 0)`, sharp 6px corner radii, hairline borders |
| **Rauno Craft** | Design Engineering | [`04_rauno_craft_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/04_rauno_craft_desktop.png) | [`04_rauno_craft_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/04_rauno_craft_mobile.png) | Micro-interaction feedback, spring tab indicators, tactile keyboard feedback |
| **Raycast** | Developer CLI/Launcher | [`05_raycast_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/05_raycast_desktop.png) | [`05_raycast_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/05_raycast_mobile.png) | High-contrast command menus, keyboard shortcuts (KBD badges), dark mode hierarchy |
| **Family Wallet** | Web3 / Consumer Crypto | [`06_family_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/06_family_desktop.png) | [`06_family_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/06_family_mobile.png) | Organic spring physics, pill radii (32px), friendly yet technical micro-states |
| **Chronicle** | Editorial Presentation | [`07_chronicle_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/07_chronicle_desktop.png) | [`07_chronicle_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/07_chronicle_mobile.png) | Type-driven narrative pacing, Diatype serif headings, zero decorative clutter |
| **Linear Security** | Security Compliance | [`08_linear_security_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/08_linear_security_desktop.png) | [`08_linear_security_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/08_linear_security_mobile.png) | Interactive hardware key, forensic compliance checklist, reassuring verification state |
| **Supabase** | Cloud Developer Infra | [`09_supabase_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/09_supabase_desktop.png) | [`09_supabase_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/09_supabase_mobile.png) | High-contrast emerald accents (`#3ECF8E`), code tabs, developer dashboard layout |
| **Stripe** | Global Financial Infra | [`10_stripe_desktop.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/10_stripe_desktop.png) | [`10_stripe_mobile.png`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/screenshots/10_stripe_mobile.png) | Impeccable typography scales, subtle interactive mesh background, tabular alignment |

---

## 3. Universal Principles (20 Empirical Rules)

Cross-referencing the GitHub skill repos with live site measurements reveals 20 universal design engineering laws:

1. **8px Spatial Grid**: All padding, margins, gutters, and dimensional heights are multiples of 4px or 8px (`8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`).
2. **Maximum 2 Font Families**: One primary structural sans-serif (`Instrument Sans` / `Inter`) and one specialized technical or display face (`JetBrains Mono` for code/data, optional `Instrument Serif` for editorial titles).
3. **Contrast Floor**: Background `#08090C`, card `#10121A`, elevated `#181B26`. Text hierarchy: `#F4F6FB` (Primary 100%), `#8B949E` (Secondary 65%), `#484F58` (Muted/Disabled 35%).
4. **Hairline Precision Borders**: 1px borders using semi-transparent neutral colors (`rgba(255, 255, 255, 0.08)` or `#222634`). Never heavy 2px+ borders.
5. **No Eyebrow Pills Above Headings**: Let headlines lead with confident authority. Do not put an uppercase pill badge above every title.
6. **No Centered-Hero-Plus-3-Cards**: Build layout around user action: an instant audit command bar and live telemetry console.
7. **One Primary Action per Viewport**: Every screen must have strictly one dominant visual CTA (`Run Audit` or `Confirm Defect`); all other actions are secondary outline or ghost buttons.
8. **Subtle Elevation Shadows**: In dark mode, drop shadows do not create depth; surface lightness and specular top borders do (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1)`).
9. **Instant `:focus-visible`**: Always provide a crisp 2px emerald focus ring offset by 2px (`outline: 2px solid #10B981; outline-offset: 2px`) that appears immediately without transition lag.
10. **Micro-Transitions Under 250ms**: Hover and tap feedback must resolve between 120ms and 200ms using `ease-out`. Never make a user wait for an animation to click a button.
11. **Tabular Numerals for Metrics**: All numbers, timestamps, latencies, and RQI scores must use `font-variant-numeric: tabular-nums` or `JetBrains Mono` to prevent layout jitter on updates.
12. **Master-Detail Two-Pane Ergonomics**: For triage workflows (Findings Inbox), keep the list in view on the left and the deep evidence inspection card fixed on the right.
13. **Keyboard Accelerators**: Provide visible single-key badges (`J`, `K`, `C`, `R`, `D`) for high-frequency actions to empower power users.
14. **No Full-Page Spinners**: Use skeleton cards or staged step timelines during audit execution so the user perceives continuous progress.
15. **Status Dot Semantic Discipline**: A status dot must indicate real-time engine state (`emerald` = live passed, `amber` = running/warning, `ruby` = blocked/failing). Never use status dots as decorative bullets.
16. **Responsive Layouts Capped at 1440px**: Content containers grow up to a maximum width of 1280px or 1440px. On ultrawide displays (1920px+), gutters expand while content measure remains stable.
17. **Overflow Safety**: Both `html` and `body` carry `overflow-x: clip` to eradicate accidental horizontal scrolling on mobile.
18. **Mobile Target Ergonomics**: All interactive buttons and touch targets on screens $\le 768\text{px}$ must meet the 44px minimum height requirement.
19. **Strict Reduced-Motion Support**: Respect user preferences with `@media (prefers-reduced-motion: reduce)` by disabling non-essential transitions and pulsing effects.
20. **Zero Fabricated Evidence**: Every number, certificate date, link status, and screenshot must stem from real backend probes.

---

## 4. Creative Direction Concepts for ReleaseLens

We explored three distinct creative directions for ReleaseLens:

### Concept A: The Obsidian Telemetry Terminal (Recommended)
* **Mood**: Technical, precise, authoritative, luxury dark engineering.
* **Inspiration**: `v0-optimus-delta`, Linear Security, Bloomberg Terminal modern web interpretation.
* **Palette**: Deep Obsidian (`#08090C`), Carbon Slate (`#10121A`), Technical Emerald (`#10B981`), Warning Amber (`#F59E0B`), Critical Ruby (`#EF4444`), Muted Cyan (`#38BDF8`).
* **Typography**: Instrument Sans (primary UI), JetBrains Mono (metrics, logs, cURL, scores), occasional Instrument Serif (large editorial hero tagline).
* **The Signature "Wow" Feature**: **The Live Audit Telemetry HUD** — an animated, SVG-powered circular RQI dial that dynamically sweeps as the crawler verifies security, crawls routes, and scores Core Web Vitals, accompanied by live streaming log traces and instant dual-report generation.

### Concept B: Swiss Technical Precision (Alternative 1)
* **Mood**: Austere, high-contrast, typographic, monochrome with single cobalt accent.
* **Inspiration**: Resend, Braun design archive, Vignelli subway signage.
* **Palette**: Pitch Black (`#000000`), Pure White (`#FFFFFF`), Cobalt Blue (`#2563EB`), Neutral Gray (`#666666`).
* **Typography**: Akkurat / Inter only, heavy grid lines, dense tabular data.
* **Trade-off**: High legibility, but lacks the visual warmth and status differentiation needed for security & defect triage.

### Concept C: The Forensic QA Studio (Alternative 2)
* **Mood**: Editorial, dark studio, museum-grade documentation.
* **Inspiration**: Chronicle, Linear Method, Apple Developer Documentation.
* **Palette**: Warm Dark Charcoal (`#121316`), Cream Text (`#F5F5F0`), Muted Copper (`#C87D55`).
* **Typography**: Instrument Serif dominant with monospaced captions.
* **Trade-off**: Very elegant for long-form reading, but slower for rapid 10-second finding triage in dense QA environments.

> **Decision**: Proceed with **Concept A (Obsidian Telemetry Terminal)**. It perfectly honors the existing dark luxury aesthetic, aligns with developer tool expectations, and provides crystal-clear status communication for security and functional gating.

---

## 5. Formal Design System Tokens

```css
:root {
  /* Surface Tokens */
  --bg-canvas: #08090C;
  --bg-surface: #10121A;
  --bg-surface-raised: #181B26;
  --bg-surface-overlay: #1F2332;

  /* Border Tokens */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: #222634;
  --border-active: #32384C;
  --border-focus: #10B981;

  /* Typography Colors */
  --text-primary: #F4F6FB;
  --text-secondary: #8B949E;
  --text-muted: #586069;
  --text-inverse: #08090C;

  /* Semantic Status Colors */
  --status-pass: #10B981;
  --status-pass-bg: rgba(16, 185, 129, 0.1);
  --status-warning: #F59E0B;
  --status-warning-bg: rgba(245, 158, 11, 0.1);
  --status-fail: #EF4444;
  --status-fail-bg: rgba(239, 68, 68, 0.1);
  --status-info: #38BDF8;
  --status-info-bg: rgba(56, 189, 248, 0.1);

  /* Typography Scale */
  --font-sans: 'Instrument Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-serif: 'Instrument Serif', Georgia, serif;

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */
  --text-4xl: 2.5rem;    /* 40px */
  --text-5xl: 3.5rem;    /* 56px */

  /* Radius Tokens */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Motion Tokens */
  --ease-out-quint: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-instant: 100ms;
  --duration-micro: 180ms;
  --duration-base: 250ms;
  --duration-staged: 400ms;
}
```

---

## 6. Sitemap & Screen Architectures

1. **Public Marketing Landing (`/`)**:
   - Hero: Instant Target URL Audit Bar with real-time domain validation.
   - Live Demo Telemetry: Interactive preview showing RQI circular gauge, two Hard Gates (`GATE_SECURITY`, `GATE_FUNCTIONAL`), and crawled routes.
   - The Unified Pipeline: Step-by-step visual workflow (Automate First $\to$ Findings Inbox $\to$ Confirmed Defect Tracker $\to$ Retest $\to$ Release Gate).
   - Dual Report Comparison: Interactive toggle comparing Report A (Machine Telemetry) vs Report B (Human-Reviewed Defects).
   - Zero-Spend Architecture Transparency: Detailed technical specs on SSRF defense, Cheerio crawl engine, and Supabase RLS.
2. **Authenticated Dashboard (`/dashboard`)**:
   - Workspace summary, active projects grid, recent audit runs, and quick audit launcher.
3. **Project Audit Overview (`/projects/[id]`)**:
   - Live RQI Gauge, Hard Gates status cards, executed checks matrix with filterable tabs (`All`, `Security`, `Availability`, `Links`, `Performance`).
   - "Launch New Audit" trigger with real-time execution trace stream.
4. **Findings Inbox (`/projects/[id]/findings`)**:
   - Two-pane master-detail triage interface. Left: finding list with severity badges. Right: rich evidence viewer with console traces, failing HTTP headers, auto-drafted reproduction steps, and single-key keyboard actions (`C`, `R`, `D`).
5. **Verified Defect Tracker (`/projects/[id]/bugs`)**:
   - Kanban/table view of confirmed bugs, severity levels, assigned developers, reproduction steps, and Retest Verification modal.
6. **Release Delta Regression Tracker (`/projects/[id]/deltas`)**:
   - Side-by-side run comparison identifying new regressions, resolved defects, and recurring issues.
7. **Developer Handoff Permalink (`/reports/[token]`)**:
   - Zero-auth public permalink for engineering teams, containing complete sanitized evidence, copyable GitHub Issue Markdown, and cURL commands.

---

## 7. Do / Don't Checklist

### Do:
- ✅ Use real status colors (`#10B981` emerald, `#EF4444` ruby, `#F59E0B` amber) with 10% opacity surface fills.
- ✅ Display timestamps, latencies, and counts in tabular monospaced numbers (`JetBrains Mono`).
- ✅ Provide instant keyboard navigation (`J`/`K`/`C`/`R`) in the Findings Inbox.
- ✅ Keep the landing page hero completely visible at 1280x800 without requiring scrolling.
- ✅ Strip all secrets, authentication headers, and private tokens from developer handoff reports.
- ✅ Provide clear empty states with actionable primary buttons.

### Don't:
- ❌ Do NOT use an eyebrow label above every heading.
- ❌ Do NOT use purple-to-blue decorative gradients.
- ❌ Do NOT use `transition: all` or animate width/height.
- ❌ Do NOT treat unreviewed automated findings as release-blocking bugs.
- ❌ Do NOT invent fake customer metrics, fake testimonials, or fake partner logos.
- ❌ Do NOT allow horizontal scroll blowout on mobile devices (`overflow-x: clip`).
