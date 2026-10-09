# Before Sending / Figma Handoff

## Current Figma Status

- Existing Figma file: `XJT6rmjuwymuUKsuYl3rBA`
- File URL: https://www.figma.com/design/XJT6rmjuwymuUKsuYl3rBA
- `01-16` are already created in Figma and must not be regenerated or overwritten.
- Figma MCP became unavailable during the `17-20` stage, returning `INVALID_ARGUMENT` for read/write/upload operations.

## Local Completion Status

The remaining flow has been completed locally as high-fidelity desktop HTML/CSS UI screens:

- `17 Anonymous Letter Detail`
- `18 Stitch Response`
- `19 Co-authored Letter`
- `20 Final Archive State`

Local source:

- `C:/Users/32714/Desktop/Before-Sending-Demo/ui-preview/remaining-flow.html`

Screenshots:

- `C:/Users/32714/Desktop/Before-Sending-Demo/ui-preview/17-anonymous-letter-detail.png`
- `C:/Users/32714/Desktop/Before-Sending-Demo/ui-preview/18-stitch-response.png`
- `C:/Users/32714/Desktop/Before-Sending-Demo/ui-preview/19-coauthored-letter.png`
- `C:/Users/32714/Desktop/Before-Sending-Demo/ui-preview/20-final-archive-state.png`

## Design Tokens

Colors:

- Warm ivory canvas: `#F4EFE6`
- Paper light: `#FBF8F1`
- Letter paper: `#F7F1E7`
- Linen beige: `#E7DED1`
- Aged paper: `#DDD1C1`
- Ink brown: `#423934`
- Soft ink: `#665B54`
- Muted text: `#8A7D73`
- Oxblood thread red: `#A33B3D`
- Dark thread red: `#762C2D`
- Faded thread red: `#C77C78`
- Dusty blue thread: `#536E9C`
- Soft blue thread: `#879DBB`
- Muted sage: `#A7AEA6`
- Faded mauve accent: `#B89A98`
- Aged gold accent: `#B09A66`

Typography:

- Display serif: `Cormorant Garamond`, fallback `Georgia`
- Body editorial serif: `EB Garamond`, fallback `Georgia`
- UI labels: `Inter`, fallback `Arial`
- Letter spacing remains `0` for editorial text. Only small UI labels use subtle positive tracking.

Spacing and surface language:

- Desktop frame: `1440px x 1040px`
- Main outer padding: `72px`
- Paper radius: `2-6px`
- Borders: low-opacity ink brown / oxblood / dusty blue
- Shadows: soft paper shadows only, no glassmorphism
- Collage density: restrained but richer than the earlier plain ivory-only direction

## Page Frame Names

Figma import target frame names:

- `17 Anonymous Letter Detail`
- `18 Stitch Response`
- `19 Co-authored Letter`
- `20 Final Archive State`

Do not rename or recreate these existing Figma frames:

- `01 Landing / Home`
- `02 Opening Transition`
- `03 Choose Path / Write or Read`
- `04 Writing`
- `05 Writing / Deleted Trace State`
- `06 Finished Letter`
- `07 Backside / Hidden Trace`
- `08 Replay`
- `09 Seal Letter`
- `10 Delivery Time`
- `11 Waiting`
- `12 Read Entry / Reading Choice`
- `13 Receiver Letter / Open Letter`
- `14 Receiver / Pull Thread`
- `15 Receiver Replay`
- `16 Anonymous Letter Bureau`

## Assets Used

Allowed SVG assets used only for thread/interaction paths:

- `C:/Users/32714/Desktop/Before-Sending-Demo/assets/thread-knot-trace.svg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/assets/blue-reader-thread.svg`

Raster material and collage assets used by `17-20`:

- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/linen.jpg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/paper-fibre.jpg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/lace.png`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/stamp.jpg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/needle.jpg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/embroidery-style.jpg`
- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/postbox-reference.jpg`

Current approved hero asset for earlier homepage use:

- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/home-hero-postbox-generated.png`

Current homepage first visual requested by user:

- `C:/Users/32714/Desktop/Before-Sending-Demo/public/current-reference/homepage-first-visual.png`

Important asset rule:

- Reference images are visual sampling only.
- Do not paste full reference images as UI objects.
- SVG is allowed only for thread paths, stitch paths, loose-thread interaction, replay timelines, utility icons, and mailbox contour lines.
- Do not use SVG for lace, flowers, paper scraps, envelopes, stamps, photographs, tape, fabric texture, vintage objects, collage decorations, or archive drawers.
- Decorative and material elements must be raster or cut-out assets: PNG, WebP, JPG, or transparent images.
- Color direction should not stay plain ivory-only. Use richer scanned artist-book tones: dusty blue washes, muted sage fabric shadows, aged gold stains, and deeper oxblood accents while preserving the slow editorial mood.

## Figma MCP Recovery Steps

When Figma MCP is available again:

1. Open existing Figma file `XJT6rmjuwymuUKsuYl3rBA`.
2. Read metadata and confirm the existing `01-16` frames are present.
3. Do not regenerate, delete, or overwrite `01-16`.
4. Read `ui-preview/remaining-flow.html` and the four screenshots in `/ui-preview/`.
5. Convert only `17-20` into editable Figma frames using the existing Before Sending design system.
6. Reuse only the allowed thread SVG assets as editable vector imports.
7. Import all lace, stamp, paper, fabric, needle, envelope and photo elements as raster/cut-out image layers.
8. Place `17-20` side-by-side after the existing flow or in the designated review area.
9. Verify the final file contains the full set from `01` through `20`.
