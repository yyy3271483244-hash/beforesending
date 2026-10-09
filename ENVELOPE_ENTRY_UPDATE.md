# Envelope Entrance Update

## Assets

- Write: `demo美术素材/信封入口/write-source.png`, user-supplied pink open envelope, 1232 x 928.
- Read: `demo美术素材/信封入口/read-source.png`, user-supplied ivory envelope and thread, 1232 x 928.
- Transparent exports: `public/assets/entrance-envelopes/`.
- Write layers: body, flap, paper, pen, thread, plus the complete cutout.
- Read layers: body, flap, thread, plus the complete cutout.
- Contour masks preserve pale paper. The white rectangular backgrounds are not rendered. The hidden portion of the writing sheet extends the source paper texture.
- Rebuild exports with `node tools/prepare-entrance-envelopes.mjs`.

## Integration

- Both entries appear below the four administrators in the existing homepage flow.
- The same reusable entries replace the old desk/cabinet image buttons in `#office`.
- Selecting an administrator still reveals the existing writing surface below. No entrance click is required to continue by scrolling.
- No-hash entry still starts at the homepage. The local embedded HTML and live app share the same source and images.
- Existing drafts, replay events, routes and drawer data remain in use.

## Motion

- Existing GSAP: 550ms object hover, 5px lift, separate flap/thread response, 13px writing-paper lift and slight pen rotation.
- Pickup: guarded timeline moves the object toward the viewport center before navigation.
- Native View Transitions carry the writing paper into the main sheet, or carry the received envelope into the archive.
- The archive arrival envelope opens an existing sample letter.
- Mouse leave reverses the hover timeline. Unmount cancels pending pickup navigation.
- Keyboard focus and Enter work; reduced-motion removes large displacement.
- No new runtime dependency, generated replacement illustration, white card or decorative panel.

## Verification

- `node tools/verify-envelope-entrances.mjs`: transparent-alpha checks, opaque pale paper, desktop/mobile/narrow layouts, hover displacement and reversal, delayed navigation, both destinations, successful native transition snapshots, navigation cancellation, keyboard and reduced-motion.
- `node tools/verify-selection-scroll.mjs`: chosen administrator, scroll-to-write, draft retention, undo, homepage and office flows on desktop/mobile/tablet.
- `node tools/verify-embedded-entry.mjs`: live and embedded homepage startup, bundled cutouts, both envelope entrances, writing, replay, packing and archive.
- `npm run embed`: successful production build and refreshed `Before-Sending-embedded.html`.
- `tools/verify-living-letter.mjs`: original pause knots, caret following, deletion, permanent hiding, replay, drawer opening, reading, stitch persistence and reduced-motion regression checks passed.
- Screenshots: `ui-preview/envelope-entrances/` and `ui-preview/selection-scroll/`.

## Limits

- This is layered 2D artwork, not simulated paper physics.
- Browsers without View Transitions retain the pickup animation and functional navigation, but cannot interpolate the object between route snapshots.
