# Before Sending Interface System

## Source of Truth

- `src/design-system.css`: font families, six type roles, spacing and grid tokens.
- `src/interface-layout.css`: current scene layouts and functional alignment.
- `src/visual-restoration.css`: original pale colors, artwork and material treatments.
- `src/scene-system.css`: existing full-frame vertical narrative behavior.

The final interface layer is imported last. Add new interface rules there using the shared tokens; do not add per-page font sizes. Legacy type variable names are compatibility aliases, not additional levels.

## Grid

Desktop: 12 columns, 24px gaps, 64px minimum outer margins, maximum 1312px content width. At a 1440px layout width this produces a 1312px container. Browser scrollbars consume their native width.

Tablet margins: 32px. Mobile margins: 24px, gaps: 16px. The underlying 12 tracks remain; four keepers use 3 tracks each on desktop and 6 each on mobile. Art may extend outside the grid; image crop coordinates and hotspots stay tied to source images.

Header, language control, home title, section titles, keeper labels, writing paper, ritual controls and archive footer use the same outer axes. Writing paper spans columns 3–10 on desktop, 2–11 on tablet, all columns on mobile.

## Type

| Role | Desktop | Mobile |
| --- | --- | --- |
| Hero H1 | Chinese 52 / English 60 | Chinese 48 / English 56 |
| Section H2 | 32 | 30 |
| Functional H3 | 22 | 20 |
| Body | 18 | 16 |
| Caption | 13 | 12 |
| Navigation | 15 | 14 |

Sizes are fixed at breakpoints, never proportional to viewport width. Heading line height: 1.3; hero: 1.15; body: 1.8; captions/navigation: 1.5. Letter spacing: zero. Existing local font fallbacks remain, with no new network font dependency.

The homepage's latest marked-reference request overrides only its H1 token: 96px desktop, 108px at wide desktops (1800px+), 64px compact desktop (1100px and below), 56px mobile. It remains one H1, split into Before and Sending in columns 3–5 and 8–11. Mobile stacks those words above the unchanged painting. This is a scoped hero scale, not a seventh typography role.

## Spacing

Major interface relationships use 8, 16, 24, 32, 48, 64, 96, 128px (`--space-1` through `--space-8`). The pre-existing 4px micro token is retained only for legacy fine controls. Image geometry, texture overlap, thin strokes, physical-object shadows and animation distances are not layout spacing and are intentionally not rounded to this scale.

## Interaction Hierarchy

Invisible art hotspots remain real semantic buttons with keyboard focus. Default art, restrained hover/focus movement and active/selected feedback are separate states. Short contextual labels appear beside the mail slot and keeper targets; paper and drawer cues use the same caption role. No cards, visible grids or modern button containers are added.

## Audit and Regression

Before migration the CSS contained more than 40 literal type sizes and more than 70 pixel spacing values across historical and current stylesheets. The existing token file was overridden repeatedly. 399 literal font declarations were mechanically migrated to semantic roles; major active UI relationships were consolidated in the shared layout layer. Measured artwork geometry was retained.

Run `node tools/verify-design-system.mjs` and `npm run check`. See `IMPLEMENTATION-TODO.md` for interaction work retained while this system was established.
