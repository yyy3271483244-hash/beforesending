# Current Interaction QA - 2026-09-28

## Latest pass: full-frame scenes, long paper and copy cleanup

This pass supersedes the stacked-page and fixed-ratio writing descriptions below. Old artwork remains the visual source. The latest brief explicitly asks for full-bleed desktop scenes and scroll-driven transitions.

### Implementation and evidence

- `scene-system.css` removes the centered home-art container. Each scene is a fixed viewport layer; logical vertical sections supply scroll distance. Header/navigation are overlays. GSAP ScrollTrigger drives a restrained scale/opacity/Y/blur transition with .8 scrub and endpoint snapping. No horizontal scrolling or wheel interception was added.
- One keeper scene still contains four targets. Selection uses the same facade, fades the other keepers and lightens the facade from .42 to .25; envelopes appear afterwards. Entry stagger and 1.5px idle motion reuse the old illustrations.
- The same writing paper now grows with content. Original top/bottom caps surround a repeatable strip extracted only from the old `paper.png`. The editor has no independent scrollport. The keeper, draft note, marginal statistics and actions follow the actual end of the letter. A short scroll hold at the letter end keeps the actions visible before the next transition.
- Removed current-page comfort slogans, redundant visual explanations, repeated brand labels and poetic ritual subtitles. Kept necessary headings, animal names/roles, navigation, operation hints, trace controls, statistics, privacy/storage disclosures and local-only delivery information. Letter prose and personality data were not bulk-edited.
- Captures: `ui-preview/scene-system/home-1440.png`, `keeper-select-1440.png`, `keeper-confirmed-1440.png`, `long-letter-bottom-1440.png`, `home-mobile.png`, `keeper-mobile-en.png`.

### Checks performed

- At 1920x1080, DOM measurements confirmed full-frame art, zero horizontal scroll and all four animal targets inside the viewport. At 1440x900, the complete home and keeper screenshots were inspected. Scenes overlap in place during transitions, rather than showing two stacked half-pages. Short upward/downward scrolls settle on a complete scene.
- The IAB host currently caps screenshot pixels at about 1673x1072 even when its emulated viewport is 1920x1080. Therefore `home-1920.png` is a partial host capture, not a complete 1920 screenshot. The 1920 framing claim is based on DOM geometry plus that visible portion; the complete visual capture is at 1440.
- A 55-line test letter grew to about 2535px at 1440. Textarea clientHeight equaled scrollHeight and scrollTop stayed zero. Last-line clearance was 220px, keeper/footer followed the paper bottom, and document scroll advanced without losing input focus. Returning to the desk and reopening retained the draft.
- Deletion and rewriting retained erased passages, which could still be revealed through the loose thread. Finish, envelope, stamp, local delivery, waiting, archive and sent-letter replay entry were exercised.
- At 390x844, English keeper confirmation and both envelopes remained usable without horizontal overflow. A long Chinese draft was retained across language switching and could continue receiving English input; editor height and scrollHeight both measured 1873px, with scrollTop zero.
- Build and source checks pass. Core App, journey data, letterSession, AdministratorSystem, ThreadTail, SentLetterMemory and Language hashes match `Before-Sending-long-letter-backup-20260928`. Only presentation/scroll hooks, copy and relevant regression assertions changed.
- Reduced-motion branches were checked in source, not through an actual operating-system preference. Real touch hardware and non-Chromium browsers were not tested. No new WCAG contrast claim is made for the intentionally pale artwork.
- QA used isolated port 5201. The user's port-5173 draft was not edited or cleared.
- Final fresh-tab checks: navigation, short scroll snapping, long-letter footer, direct refresh back to DESK, and resizing in both directions between 390x844 and 1440x900. Resize keeps the same scene; a restored browser scroll position no longer triggers a paper lift or another chapter. Fixed a GSAP edge case where `getTween(true)` may be falsy rather than a tween, and a paper-cap stacking issue that hid the small footer illustration.
- Final clean-tab console has no warnings or errors. Development-only Fast Refresh warnings while changing hook structure were not treated as final-pass results; verification used a newly opened tab after the code stabilized.

## Previous structure pass (historical)

This earlier section records the previous structure pass and is retained for provenance. Its native stacked flow and fixed paper ratio are superseded by the latest pass above.

### Visual evidence

Saved in `ui-preview/vertical-structure/`:

- `home-final-1920.png`, `home-final-1600.png`, `home-final-1440.png`: 1920x1080, 1600x900, 1440x810. Hero height equals viewport height; artwork measures about 78% of viewport width/height. No centered duplicate title, subtitle, descriptive copy or Writing Desk label on home.
- `home-native-transition.png`: real vertical scroll, gradual illustration fade/scale and next section entering from below. Observed scrollX and track.scrollLeft remain zero.
- `keeper-select-final.png`: one old facade, four old portraits grounded near its foreground, no visible or keyboard-accessible read/write envelopes. Foot offsets are calibrated independently; contact shadows use opacity .06 and blur 8px.
- `keeper-confirmed-final.png`: same background; one selected keeper and two old envelopes. Other keepers fade instead of being abruptly removed.
- `keeper-select-mobile-final.png`, `keeper-confirmed-mobile-final.png`, `keeper-confirmed-mobile-en.png`: mobile Chinese/English states. The last English capture includes the repaired separate reselect footer.
- `desk-1440.png`, `paper-1440.png`, `paper-mobile-final.png`: same old paper object, uniform 1264:782 aspect ratio, small keeper inside its lower-right corner.
- `writing-traces-1440.png`, `sent-replay.png`: current deleted passages, pause knots and final sent-letter replay.

Historical keeper reference, final select capture and confirmed capture were inspected together. Changes to character position and delayed envelope display are explicitly requested; facade, cutouts, colors, opacity and thin type remain old. Mobile retains the existing two-column arrangement for usable selection targets rather than shrinking four portraits to tiny buttons.

### Interaction verification

- Exactly one Keeper Scene, four independent interactive targets, eight native vertical chapters. Legacy mouse/cat/rabbit/dog hashes all reach the same keeper scene.
- All four keepers selected and reset individually. Each confirmation kept the current keeper route, hid the other three, and enabled both envelopes only after animation. Provider selection and personality text matched the chosen animal.
- Confirmation keyboard focus moves to Read after controls become enabled; reselect returns focus to the previous keeper. Direct mobile clicks preserved scrollY=844 throughout selection after disabling scroll anchoring.
- Read opened the original 35-drawer archive; drawer 27 could be opened and its actual letter taken out. Selected rabbit was retained.
- Write entered DESK first. Clicking or further native scrolling lifted the same paper. Controls were disabled until the lift finished. Return/reopen retained the exact draft. Rabbit and mouse were each observed inside the writing paper after their respective selections.
- Mobile paper ratio measured 1.616397; no horizontal overflow. Language switching kept the Chinese letter and selected keeper unchanged.
- Input, pause longer than six seconds, two deletions and a rewrite were exercised earlier in this change. The loose thread revealed both erased passages. Finish froze writing time; fold/stamp/post/wait/archive/replay completed. Replay end matched the final letter.
- Home idle transforms changed by only 1-3px, with different timings; postbox scale stayed within 1-1.003. Original pixels are clipped into complementary layers, not redrawn. Keyboard focus also exposes the small hover annotation.
- Final clean browser console: zero errors. Tests ran on isolated port 5201; the user's port-5173 draft was not edited or cleared.

### Build and source checks

- `npm.cmd run check`, `verify-vertical-logic.mjs`, `verify-horizontal-logic.mjs`, `verify-visual-restoration.mjs`: passed.
- 25 required old assets present; source/build exclusion scan reports zero prohibited loading references.
- SHA-256 comparison with `Before-Sending-structure-backup-20260928-190920`: App, journey data, letterSession, AdministratorSystem, ThreadTail, JourneyRitual, SentLetterMemory and Language are unchanged.
- Source-only checks cover reduced-motion branches. Real touch hardware and non-Chromium browsers were not tested. Intentional pale artwork/annotations are not a claim of WCAG contrast compliance. Browser automation's locator click can scroll a target into view; direct coordinate clicks were used to distinguish that from animation-induced movement.

## Earlier restoration report (historical)

The following records the earlier visual-only pass. Its horizontal-flow and immediate-writing descriptions are no longer the current implementation.

## Target and evidence

Source: retained 2026-09-06 implementation files and four user-supplied historical screenshots. Current routing and interaction code remains authoritative for functionality. Earlier QA reports remain in the pre-change backup, not as the target for this restoration.

- `视觉参考/OLD_VERSION_REFERENCE/`: original attachments, copied without alteration.
- `ui-preview/visual-restoration/reference-comparison.png`: reference left, restored right. Rows: home, keeper, writing, archive.
- `ui-preview/visual-restoration/restored-overview.png`: four restored desktop views.
- Individual captures: `home-desktop.png`, `keeper-desktop.png`, `writing-desktop.png`, `archive-desktop.png`.
- Responsive evidence: `keeper-mobile.png`, `writing-mobile.png`, `archive-mobile.png`, `thread-pull-mobile.png`, `writing-1440-en.png`.

## Visual comparison

| Surface | Result |
| --- | --- |
| Home | Original four-keeper/red-postbox composite, connecting thread, centered italic Georgia title, cream negative space. Original vertical scroll crop is not reproduced because horizontal chapters remain. |
| Keeper | Original .42-opacity shared facade and four old cutouts. Restored bottom alignment through current AnimalMedia wrapper; large-screen character/envelope scale checked against reference. |
| Writing | Exact old paper.png and desk-empty.png. Double page occupies about 64% of desktop width with a small keeper at the right edge. Current statistics sit below the paper as marginal notes. |
| Archive | Exact old pastel cabinet and original 35 painted cell boundaries. Current 20 occupied drawer data IDs retained. Old loose envelope sits in front without intercepting pointer events. |
| Other flows | Existing packing, stamp, posting, waiting and replay use old paper/backgrounds, understated type and small old character poses. |

Comparison dimensions: 2048 x 1078. Additional checks: 1440 x 900 and 390 x 844. Fixed font sizes, no viewport-scaled typography. No generated replacement art, new cards, gradients or increased saturation. Low contrast in annotations and art is intentional per the target; this is not a claim of WCAG contrast compliance.

Known non-identical details: current header retains language/about controls; current content and sample recipients differ from historical screenshots; the snapshot's available plain blue envelope is used inside drawers rather than inventing the patterned blue material in the reference. Mobile uses a two-column keeper lineup and tall paper for reachable interactions. These are documented adaptations, not a new design direction.

## Browser regression pass

Tests used fresh origin port 5198, not the user's existing draft on 5173.

- Home entry, keeper selection/confirmation, paper lift/return/reopen: passed.
- Chinese direct character input, pause longer than 6 seconds, deletion, replacement and continuation: passed. Visible final test state showed one replacement, two erased passages and a pause knot.
- Pointer pull of the gathered thread revealed both retained previous sentences. Keyboard Enter opened/closed it. Tracking/data code and permanent-hide filtering were not changed.
- Writing time stayed at 03:05 after completion and language switching. English switching did not translate/clear the Chinese letter or selected keeper.
- Fold, select/apply stamp, post, wait, enter archive: passed. Local simulation only.
- Open drawer 27, take/read letter, put back, close drawer: passed on desktop/mobile.
- Apology filter and random selection: passed; selected within the two eligible drawers.
- Sent-letter memory: pause replay and seek to end passed; end text matched final letter.
- Final browser console: zero errors. No incomplete/broken image elements after chapters loaded.

## Repairs during QA

1. Centered-paper percentage transforms conflicted with GSAP. Used a one-cell visual grid; useDeskPaper remains unchanged.
2. Old 12-column constraints reduced the paper and misplaced footnotes. Reset only writing-page visual tracks and child placement.
3. Current nested image wrappers lost old bottom alignment. Restored object-position on the image.
4. Same-position deletion controls overlapped. Kept gathered-thread interaction and added independent pause marks; a tail moves down only if its hit area overlaps a knot.
5. The next-scene decoration made the home internally scrollable and could hide its title on return. overflow: clip prevents that while preserving the horizontal journey.
6. Cabinet fronts covered the decorative envelope. Repaired stacking without blocking drawers.

## Build and asset checks

- `npm.cmd run check`: passed.
- `node tools/verify-horizontal-logic.mjs`: passed, current aliases, keeper choice and delivery gates.
- `node tools/verify-visual-restoration.mjs`: passed; 24 old assets, 82 source/build files, zero excluded loading references/distribution directories.
- Nine core state/session/navigation/ritual files match the pre-change backup byte-for-byte. LivingLetter changes only visual pause-mark display and hit-area placement; its event/state source remains current.
- Old verify-session-safety.mjs harness could not connect to its expected CDP port 9347; not counted as passing. Relevant flows were exercised through browser tools instead.
- Reduced-motion branches and legacy routes were source/logic checked. Real touch hardware, every browser engine, and the deprecated embedded HTML exporter were not tested.

Final result: passed for requested restoration and tested main flow, with fidelity differences and test limitations above.
