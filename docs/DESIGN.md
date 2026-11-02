# Design System & UX Specification — ReleaseLens

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Design Philosophy

ReleaseLens is an **operational developer and decision-support tool**. It avoids generic decorative AI cliches (e.g. gratuitous gradients, floating cards without structure, low-contrast text) in favor of:
- **High Information Density**: Clean tabular views, structured sidebars, and hierarchical inspection panels.
- **Immediate Clarity**: Color-coded risk signals (Emerald for Safe, Amber for Warning, Crimson for High Risk / Blocked).
- **Sub-100ms Interactions**: Instant tab switching between Engineering, Product, and Customer viewpoints.
- **Accessible & Purposeful**: High contrast ratios, full keyboard shortcut support, and standard typography scales.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `bg-primary` | `#0B0F17` (Dark Slate) | Main application background |
| `bg-surface` | `#151B28` | Cards, sidebars, panels |
| `border-subtle` | `#222F44` | Structural dividing borders |
| `text-primary` | `#F8FAFC` | Main headings and body text |
| `text-muted` | `#94A3B8` | Metadata, captions, secondary info |
| `accent-primary` | `#38BDF8` (Sky) | Primary action buttons and focal elements |
| `status-safe` | `#10B981` (Emerald) | High RQI score, passed verification |
| `status-warn` | `#F59E0B` (Amber) | Moderate risk, manual review advised |
| `status-danger` | `#EF4444` (Rose/Red) | Low RQI score, breaking change detected, release blocked |

---

## 3. Core Screen Layouts

1. **Release Overview & RQI Score Dial**:
   - Header with active release tag, comparison branches, and overall RQI gauge (0–100).
   - Metric pills: Blast Radius, Files Changed, Insertions/Deletions, Breaking Changes Count.
2. **Multi-Audience Synthesis Switcher**:
   - Segmented control to toggle views:
     - **Engineering**: Technical diffs, affected modules, database migrations, security alerts.
     - **Product Manager**: Functional features delivered, user-facing behavior changes, QA risks.
     - **Customer / Stakeholder**: Polished changelog entries, migration guidance, deprecation notices.
3. **Diff & Blast Radius Inspector**:
   - Interactive tree of modified files grouped by risk category (Data, Auth, API, Logic, Assets).
   - Code hunk viewer with syntax highlighting and risk annotations.
