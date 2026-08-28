# Holistic UX Review & Coherent Design Decisions

*Compiled 2026-08-28. Reviews the learner experience across all 13 stories, then defines the coherent, mobile-first design decisions that the PRDs, tech designs, and tasks are updated to embody. Method: systems thinking (Iceberg), Nielsen heuristics, Laws of UX, WCAG 2.2 AA, JTBD.*

---

## 1. Framing the problem (Iceberg)

| Level | This project |
|---|---|
| **Event** | "Make it UX-best-practice, coherent, and mobile-friendly." |
| **Pattern** | Every interaction assumes a mouse (drag-and-drop), a wide viewport (three panes side-by-side), and a hover affordance (card gloss, rail preload). |
| **Structure** | The shell is a fixed three-pane desktop layout; the reference/concept surface is a right-hand slide-over; core interactions (TrifectaBuilder, DefensePatternPicker) are drag-first; wide viz (token stream, gauntlet chart, corpus, architecture) assume horizontal room. |
| **Mental model** | We implicitly assumed a desktop learner in one sitting. Mobile, touch, one-handed, interrupted-and-resumed use were never modelled. |

**Consequence:** fixing this at the event level (media queries per component) would be incoherent and endless. The fix is structural and belongs in the **cross-cutting platform stories** that own layout, interaction, and references — the module stories then inherit it. This review drives changes concentrated in **Story 12 (any-device interface), Story 9 (shell & wayfinding), and Story 11 (references)**, with each module design gaining a short *Mobile UX* section and a mobile test.

### JTBD (the learner's real job)
> **When** I'm told to secure our company's new LLM features, **I want** to understand what is actually exploitable and which defenses genuinely hold, **so I can** make a defensible go/no-go decision without overclaiming.

- **Functional:** learn the threats, defenses, and limits hands-on.
- **Emotional:** feel competent and clear-headed, not overwhelmed or lectured.
- **Social:** be credible to security peers and leadership (the exportable memo is the social artifact).

Design must serve all three — which is why the course *ends* on a shareable competence artifact (Peak-End), not a quiz score.

---

## 2. Heuristic review (severity 4=blocks, 1=cosmetic)

| # | Heuristic | Finding | Sev | Fix (→ owner story) |
|---|-----------|---------|:--:|---------------------|
| H1 | Flexibility & efficiency | Core interactions are **drag-only**; unusable by touch and hard by keyboard | **4** | Tap-to-add/remove chips as the primary touch path; drag becomes an enhancement. The existing keyboard-equivalent list *is* the touch UI (unifies a11y + touch). → **S12** |
| H2 | Aesthetic/minimalist + responsive | **Three fixed panes** overflow small screens; page would scroll horizontally | **4** | Responsive shell: 1 column (mobile) → 2 (tablet) → 3 (desktop); right pane becomes a bottom sheet. → **S9** |
| H3 | Match system & real world | **Reference/concept slide-over** from the right is a desktop convention; wrong on mobile | 3 | Bottom sheet on mobile (Jakob's Law — the expected mobile pattern). → **S11** |
| H4 | Visibility of system status | No explicit **"progress saved" / resume** affordance despite localStorage persistence | 3 | Persistent save indicator + "Resume Module X" on return. → **S9** |
| H5 | Fitts's Law | Touch targets and primary-action size/placement unspecified | 3 | 44×44px min targets; primary action large and **bottom-anchored in the thumb zone**; destructive (Reset) smaller and separated. → **S12** |
| H6 | Error prevention & recovery | On mobile the **keyboard covers input fields** during injection authoring (classic step-3 failure) | 3 | Keyboard-safe composer: field scrolls above keyboard, sticky action bar, no fixed overlap. → **S3 (M2)** |
| H7 | Aesthetic/minimalist | **Wide viz** (token stream, gauntlet chart, 1000-doc corpus, architecture builder) assume horizontal room | 3 | Each in its own `overflow-x:auto` container; page body never scrolls horizontally; stack vertically where possible on mobile. → **S12 rule + per-module** |
| H8 | Consistency & standards | Feedback, empty/error/loading, and primary-action placement risk drifting per module | 2 | One feedback contract (S10), one state taxonomy (S12), one navigation pattern (S9) applied everywhere. → **coherence** |
| H9 | Recognition over recall + Hick's Law | DefensePatternPicker presents **6 patterns** at once | 2 | Show a **recommended default** first + progressive disclosure of the rest; 6 is the ceiling, not the opener. → **S7 (M4)** |
| H10 | Accessibility contrast | Contrast ratios unstated | 2 | WCAG 2.2 AA: **4.5:1 text, 3:1 UI/graphics**; risk never by colour alone (already in S12). → **S12** |

---

## 3. Coherent design system decisions (apply app-wide)

### 3.1 Responsive layout (single source of truth)
```
Breakpoints:  mobile <768   ·   tablet 768–1023   ·   desktop ≥1024
```
- **Desktop (≥1024):** three panes — left module rail (wayfinding + progress) · centre stage · right pane (concept inspector + reference).
- **Tablet (768–1023):** two panes — icon rail (expandable) + centre stage; right pane on-demand slide-over.
- **Mobile (<768):** single column — **top app bar** (module title + menu) · full-width **stage** · **bottom bar** (stage indicator + progress + Back/Next). Module rail → drawer/"course map" sheet from the top bar. Concept/reference → **bottom sheet**.

```
DESKTOP ≥1024                         MOBILE <768
┌──────┬───────────────┬─────────┐    ┌───────────────────────────┐
│ rail │    stage      │ concept │    │ ☰  Module 2 · Experience  │  top bar
│ ▸M0  │ [interaction] │ + refs  │    ├───────────────────────────┤
│ ▸M1  │               │ (slide- │    │                           │
│ ●M2  │  [primary ▸]  │  over)  │    │        stage              │
│ ▸M3  │               │         │    │   [interaction]           │
│ …    │               │         │    │                           │
└──────┴───────────────┴─────────┘    │   ┌─────────────────────┐ │
                                       │   │  [ Primary ▸ ]  44px │ │  thumb zone
Concept/ref = right pane               │   └─────────────────────┘ │
                                       ├───────────────────────────┤
                                       │  ◂ Back   ●●○○  Next ▸    │  bottom nav
                                       └───────────────────────────┘
                                       Concept/ref = bottom sheet ▲
```

### 3.2 Interaction: touch-first, drag-optional
- Every compose/select interaction (trifecta legs, defense patterns, tagging) is **tap-to-add/remove chips**; drag is a progressive enhancement on pointer devices. This makes the a11y keyboard path and the touch path the *same* code path — coherent and cheaper.
- **44×44px** minimum targets (Fitts); ≥8px spacing between adjacent targets.
- **Primary action** large, high-contrast, bottom-anchored on mobile (thumb reach). **Destructive/secondary** (Reset) smaller, visually separated, never adjacent to primary (misfire prevention).

### 3.3 Wide content rule
No page-level horizontal scroll, ever. Token stream, attention highlight, gauntlet chart, 1000-doc corpus, architecture builder, and all diagrams live inside an `overflow-x:auto` scroll container with a scroll affordance, and stack vertically on mobile where the content allows.

### 3.4 State taxonomy (one set, everywhere)
Every surface defines: **loading · empty · populated · consequence-playing · error/recovery · complete**. Empty and error states are first-class (Peak-End: errors are remembered), always actionable, never a blank void.

### 3.5 Navigation & save/resume
- **Linear-primary** (Back/Next in the bottom bar) with a **course-map** overview for non-linear jumps (the OWASP map in M1 doubles as a progress map).
- **Persistent "Progress saved"** micro-affordance; on return, a **"Resume Module X"** entry point. Progress is per-device (localStorage) — stated honestly to the learner, no false promise of cross-device sync.

### 3.6 Peak-End design (deliberate highs and endings)
- **Peaks:** (M2) *you* become the attacker and succeed; (M4) your own exploit re-run and **fails**; (M5) the success curve refusing to plateau. Render these as high-contrast, full-attention consequence moments — the emotional core.
- **Endings:** each module closes on a positive **"what you can now do"** summary and a completion mark, not a bare score. The **course** ends (M6) on the **exported memo** — a shareable competence artifact (serves the social JTBD) plus a completion celebration.
- **Error endings:** graceful, diagnostic recovery (discovery-safe failure in M0, why-inspector in M3) — never a dead end.

### 3.7 Cognitive load (Miller/Hick)
One primary interaction on the stage at a time (already specified); chunk lists into 3–5; recommended defaults reduce choice cost; progressive disclosure of advanced knobs (already in S10).

---

## 4. Where each change lands (coherent, non-duplicative)

| Concern | Owner story | Artifact changed |
|---|---|---|
| Responsive tokens/breakpoints, 44px touch targets, tap-alternative-to-drag, no-horizontal-scroll, contrast | **S12** (its title is literally "on any device") | PRD + design (new capability `x5d.responsive_touch`) + tasks/tests |
| Responsive shell layout, mobile top-bar/bottom-nav, course-map drawer, save/resume | **S9** (owns the shell) | PRD + design (new capability `x2d.responsive_nav`) + tasks/tests |
| Reference/concept surface → bottom sheet on mobile | **S11** | PRD + design (`x4.mobile_sheet` on `x4d.reference_ui`) + task |
| Recommended-default + progressive disclosure of the 6 patterns (Hick) | **S7 (M4)** | design *Mobile UX* section + note |
| Keyboard-safe injection composer (H6) | **S3 (M2)** | design *Mobile UX* section + mobile test |
| Per-module touch/layout adaptations, mobile tests | **S1–S7** | each design gains a *Mobile UX* section + a mobile test task |
| Feedback/state/verb coherence | **S10, S12** (already own these) | reinforced, no new ownership |

**Scoping decision (stated for honesty):** mobile behaviour is a *structural* property owned by S9/S11/S12; the module stories **inherit** it and only specify their component-specific adaptations (in a design *Mobile UX* section) plus a mobile test. I deliberately did **not** duplicate mobile requirements into all seven module PRDs — that would be incoherent and drift-prone. If you'd rather each module PRD also carry explicit mobile acceptance criteria, say so and I'll add them.

---

## 5. Accessibility acceptance (WCAG 2.2 AA, reinforced)
- Text contrast ≥ 4.5:1; UI/graphics/focus indicators ≥ 3:1.
- All interactions keyboard- and touch-operable; visible focus states; 44px targets.
- Simulation outcomes announced via ARIA live region (already S12); risk never by colour alone (already S12).
- Respects `prefers-reduced-motion` (already S12) and `prefers-color-scheme`; honours mobile safe-area insets.
