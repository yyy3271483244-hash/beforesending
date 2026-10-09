# Before Sending: Carry-Forward Work

The global design system changes priority, not scope. Existing interactions, assets, tracking, drafts, routing and language switching must survive.

## Current Priority

- [x] Home background-video replacement (2026-10-09): imported the user-supplied `视频节点 2.mp4` as `/assets/home-stage/before-sending-home.mp4`. The static painting is now a pre-play poster only. Two persistent muted video tracks alternate with a short pre-decoded crossfade, with no native `loop`, re-creation, end-of-loop static fallback, pointer interception, crop or colour treatment. Home typography, postbox hotspot, header and other scenes remain independent foreground/UI layers.

- [x] Send-flow foreground rebuild (2026-10-09): replaced the old single illustrated postage state with a four-stage foreground workflow over the supplied fixed desk background: envelope selection and paper-insertion motion, individual click/drag postage, recipient name plus email entry, then delivery-slot send animation and local completion. The wax-seal gate is removed. Envelope, paper, stamps, inputs, delivery slot and controls are separate replaceable UI layers; the selected envelope, chosen stamp, recipient and email persist through all stages. Other retained tasks below are not cancelled.

- [x] Replay playback repair: activation starts the real rAF event clock once, even when draft events settle after Finish; replay/restart auto-plays from zero, pause/resume preserves position, and old multi-hour unrecorded gaps are normalized while explicit real pauses remain. Tiny CSS event markers replace the stray star-like controls. Isolated browser acceptance used real `Hello` keystrokes, a pause, two backspaces and `p`: the playhead advanced without seeking, text changed automatically from `Hello` to `Help`, playback stopped at its end, and restart/pause/resume worked. Other tasks remain as recorded below.

- [x] Latest flow correction: removed the standalone `pack` chapter and `JourneyPack` screen. Replay confirmation now goes straight to `#stamp`; legacy `#pack`/`#seal` links resolve there. The existing paper-fold/insert motion is inside Stamp & Send and starts only after clicking its envelope. Packing gates seal, postage, recipient and Send. Earlier notes below describe historical implementations; their remaining tasks are not cancelled.

- [x] Replay repair / explicit Send This Letter / readable Home title (latest four-priority request). Supersedes the former watch-every-frame confirmation gate: Replay is still mandatory, but its visible Send This Letter action is the explicit confirmation. No wheel/seek unlocks delivery. Normalized legacy event times on load without deleting events/fragments; removed Finish wall-clock/stale-duration tail; version-2 snapshots use performance-based relative time with initial/resume/suspend boundaries. Playback starts paused at the initial snapshot, with working play/pause/restart/speed/scrub. Continue Editing appends history. Existing JourneyPack and StampSendScene remain unchanged.
  Final isolated browser E2E: Home -> mailbox -> dog keeper -> Write -> paper click -> `I wanted to tell you` -> real 61.4s pause -> eight deletions -> `say something` -> Finish -> Play/Pause/Resume, 0.5/1/2/4x, physical timeline drag, deletion/rewrite seeks, restart -> Continue Editing -> append period -> Finish -> Send This Letter -> confirmed shrink animation -> existing packing -> stamp. At 33.811s seek showed the original sentence; 63.100s showed the deleted state; 64.030s showed the rewritten sentence. Paused playhead remained at 285ms between checks. History/deletion count and dog keeper survived editing. Eight-page TABLE scrolling did not lift; twelve-page WRITING and ten-page REPLAY scrolling kept pack hidden. Header/art assets unchanged.
  Title checks: 1920x1080 uses 132px (word bounds 341..821 and 1084..1633); 1440x900 uses 108px (221..614 and 811..1260); 1366x768 uses 100px (250..613 and 738..1154). Baselines match, foreground layers retained, no horizontal overflow. Vite build, click-only regression and replay tests passed, including stale-month-long duration, real pauses, migration and append-only resumed history. All other unfinished work remains retained.

- [x] Latest correction: click-only desk lift supersedes every earlier scroll-to-lift requirement. Removed wheel, touch and PageDown lift handlers and scroll-entry landing animation. TABLE -> click -> LIFTING -> WRITING; background click reverses it without deleting text/history. Home title now shares the original clipped artwork coordinate plane, behind the five foreground objects, with unchanged font size and aligned split words. Other unfinished tasks remain retained.
  Verification: isolated browser at 1920x1080 and 1440x900; equal title baselines, original foreground occlusion, header z-index 1000. Settled desk transform unchanged after downward wheel + PageDown; up/down gestures remain TABLE. Click opens, background click returns, reopening preserves `A real letter!` and one deletion trace. Twelve-page wheel gesture during writing leaves pack/stamp/post hidden. Finish opens real replay with 16 input/delete nodes and a 14.8-second pause. Vite build, replay/workflow tests and click-only regression check passed.

- [x] Writing workflow gate (latest priority): desk / lifting / writing / real replay / explicit confirmation before Envelope. Locked scenes are hidden and unmounted. Browser verified native wheel lift, repeated 12/20-page downward wheel gestures, PageDown, rejected #pack access, and a 35-line growing paper (1071px textarea / 1381px content). Confirmed letters enter the retained folding/packing animation before postage. Reopening editing revokes old confirmation; revisiting packed content no longer auto-navigates forward. Other unfinished work is retained.

- [x] Global Header and continuous scrolling: one body-portalled viewport-fixed header, baseline/no-wrap navigation including language switch, relative auto-height document flow, one-time IntersectionObserver object reveals, and static 96px painted-edge continuity. Browser verified Home / Keepers / Desk at 1920x1080 and 1440x900 with slow/fast native scrolling and stops between scenes. Header remained at (0,0), one instance, scene wrappers opacity 1 / transform none / filter none. At 1920, a scroll crossed the 2160px desk boundary from 1728 to 2214; at 1440, a scroll crossed 1800 from 1485.33 to 1845.33 without snapping back. Chinese/English navigation stayed on one line. Build and tools/verify-global-scroll.mjs passed. Feature gates are retained; reaching the end of unlocked content is not treated as a scroll lock. All other unfinished tasks remain retained, not cancelled.

- [x] Stamp & Send reference-scene replacement: reference 4 framing, original wooden seal/eight stamp objects/pen, independent seal/postage state, pen-triggered recipient-name entry and gated local send. Browser-tested invalid/valid pointer drops, both operation orders, single-stamp hover, retained recipient, send gate and exactly one send event in an isolated QA scene with global CSS. Original user draft not edited. Full historical replay acceptance remains separate.

- [x] Home title scale: existing Comico BEFORE / SENDING enlarged with aligned baselines and balanced central postbox spacing. Browser checked 1920x1080 (140px), 1440x900 (110px), and 1024x768 (90px); no horizontal title overflow, desktop faces unobstructed. Navigation, art and animals unchanged. All previous unfinished tasks retained.

- [x] English-only typography replacement: local Comico Regular 400 loaded through WOFF2/WOFF; English family tokens and legacy literal font declarations consolidated; synthetic bold/italic disabled. Browser verified English headings, controls and local font loading. Chinese replacement and full typography calibration remain pending below.

- [ ] Typography replacement (2026-09-30): WAITING FOR FONT INPUT, not DONE. This adds to, and does not cancel, any existing unfinished work below.
- [x] Scan local typography assets and inspect font metadata: Comico Regular OTF / TTF / WOFF / WOFF2 all report weight 400, 411 mapped characters, no CJK unified ideographs, and no variable axes. The package also includes a legacy EOT. No local Chinese font or Medium/Semibold/Bold files were found.
- [ ] Obtain the user's final Chinese font files and confirm Comico 400-only usage versus supplying genuine additional English weights. The submitted Chinese/English names are placeholders; do not invent a replacement family or synthesize bold.
- [ ] Load approved local files via @font-face with correct per-file weights, font-synthesis: none, and no remote font dependency.
- [ ] Establish --font-cn / --font-en / --font-display / --font-body family tokens and language-aware switching. Migrate the existing numeric --font-body token safely rather than assigning a family to existing font-size consumers. Keep English brand headings on the English family in both locales.
- [ ] Calibrate existing grid typography: display 60-92px, H1 42-60px, H2 28-36px, body 17-19px, navigation 16-18px, captions 13-14px; use only available real weights. Preserve illustrations, structure, image proportions, animation, sequence and all writing/replay/archive/posting behavior.
- [ ] Audit old family declarations and font shorthands, including controls and language toggles; remove legacy families only after approved replacements exist. Check navigation baseline/width, wrapping, line-height, zero letter-spacing, and desktop/mobile layouts in both languages.
- [ ] Report final filenames/weights, Chinese and English families, changed variables, inspected pages and remaining legacy declarations. Mark typography DONE only after implementation and browser verification.

- [x] 2026-09-30: replace fixed scene crossfades/snap with real document flow. Remove wheel/touch cancellation and keeper boundary scroll clamping. Explicit navigation still checks prerequisites; native scroll never locks.
- [x] Browser check: one scroll crossed the 1440px desk boundary from 936px to 1872px; a further scroll reached 2880px without snapping back. All eight scene frames are relative, opacity 1, transform/filter none.
- [ ] Section continuity: remove isolated keeper confirmation headline and investigate edge continuity without changing typography or artwork.
- [ ] Writing Desk brief retained: resting paper perspective and actual writing-history playback controls, reuse existing session/replay code. Not completed by the scrolling change.
- [x] Archive: reference-video-based pull-out, seven-card stack, hover lift, side reading and reverse return. Browser checked full-screen coverage at 1920x1080 and 1440x900; see ARCHIVE-MOTION-QA.md.
- [ ] New read/write envelope cutouts and delayed tactile navigation: supplied clipboard images identified, replacement not yet implemented.
- [x] Writing replay 11-step real-input browser acceptance: restart from beginning, actual typed snapshots, retained pauses, visible deletion, rewriting, pause, resume, pointer-drag seek, speed selection, replay again, and confirmation-gated Envelope all verified on isolated local test origins. A 22-second sample retained its real 19.2-second hesitation; the earlier 84-second sample included three sentences, deletion, rewriting and a word replacement. Seeking to the end did not reveal Confirm. Speeds include 0.5 / 1 / 1.5 / 2 / 4. No production draft was modified.
- [ ] Connecting-thread click transition: retain request; not completed by archive work.

- [x] Latest priority: split homepage H1 around the postbox using the supplied marked reference; desktop/mobile screenshots checked without title/art overlap.

- [x] Inspect typography, spacing and shared interface components before changes.
- [x] Establish six semantic typography levels and eight major spacing steps.
- [x] Apply a 12-column / 1312px maximum / 64px desktop margin / 24px gutter system.
- [ ] Verify actual desktop/mobile layouts and Chinese/English typography.
- [x] Document the system and visual exceptions for artwork coordinates.

## Retained Requirements

- [x] Home: mail-slot hotspot, restrained hover, 1.2–1.8-second camera/mask entrance; browser verified arrival at the single keeper scene with four interactive targets.
- [ ] Keeper: four clickable animals, one scene, selection confirmation then two old envelopes; use “今天想做什么？” instead of the selected-name announcement.
- [ ] Keeper arrival: background first, staggered animals, preserve shared foot/name/role baselines.
- [x] Desk: initial desk on entry, explicit click/new-scroll lift, same paper, dim background, reverse return, retain draft/keeper.
- [ ] Recheck desk interaction after global typography/grid changes.
- [x] Archive latest brief supersedes all-35-clickable: 35 visual cells, only 20 numbered drawers interactive; 15 unnumbered cells remain inert background. Actual letters reuse existing sample records.
- [x] Run production build, design-system and vertical source regression checks; homepage entrance console clear. Full-site visual QA remains above.

## Writing Workflow Verification (2026-09-30)

- State reducer: `src/data/writingWorkflow.mjs`, owned by `HorizontalJourney` and driven by explicit writing/confirmation/packing events, not scene intersection.
- Confirmation requires `letterConfirmed`, nonempty final text, `writingFinishedAt`, `replayCompletedAt`, and `replayConfirmedAt`. Text/recipient edits invalidate confirmation and downstream delivery state.
- Replay keeps original event `timestamp`, `type`, `position`, `added`, `deleted`, `newText`, `duration`, token IDs, fragments and knots. `replayTime` and `recordedWritingDuration` add an active-session clock without overwriting original timestamps. Actual focused pauses remain; time away from editing is not added. Existing historical gaps without session metadata are not guessed away.
- Seek binary-searches recorded snapshots; only actual playback intervals count toward completion. Hidden-tab playback pauses. Returning from postage to editing retained the prior 22-second history; finishing again yielded 23 seconds rather than counting minutes spent elsewhere.
- `node tools/verify-writing-replay.mjs` and `npm run check` passed. The old CDP-based session-safety script requires its unavailable port 9347; browser verification used the connected browser instead. A development hot-refresh Hook-cache error was cleared by a full reload; subsequent normal entry/recording/replay checks used freshly loaded code.
- UI changes by concurrent tasks (paper landing/perspective, header, postage assets and folding animation) were retained. Their independent TODO statuses are not overwritten here.

## Boundaries

- [x] Replay playback repair: automatic RAF playback after preparation, restart/pause/resume, seek preserves playback intent, normalized time origin and hour formatting, small non-text event markers. Real browser typing produced H/He/Hel/Hell/Hello, pause, Hel, Help without seeking; build and replay unit regressions passed.

- [x] Writing Mode companion: selected keeper outside the paper at lower left, responsive 150-210px height, existing-pose idle gestures at randomized intervals. Four keepers and narrow-screen separation browser checked; original writing/replay logic unchanged.

- [x] Writing Desk latest: one-shot landing, perspective lift, background-click reverse return, same editor/history, and isolated browser regression through Finish/replay. See DESK-PAPER-QA.md. Other pending tasks remain unchanged.

- No assets from `demo美术素材/新版/`, including indirectly copied versions.
- No illustration redesign, artificial saturation/contrast increases or generated replacements.
- Keep pause/revision/deletion/thread/replay, writing, packing, stamping, sending, waiting, archive and language-switching logic.
- No dashboard, modern cards or visible grid lines.
