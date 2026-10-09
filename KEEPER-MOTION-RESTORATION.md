# Keeper Motion Restoration - 2026-10-10

## Recovery

There is no Git repository in this checkout. Recovery used the existing
`JourneyCompanion -> AdministratorCharacter -> AnimalMedia` references,
`animalAssets.js`, and `tools/process-animal-videos.py`.
All four supplied `选择.mp4` files match the previous `动物-expanded` processing
sources by SHA-256. The existing transparent selection WebMs were recovered;
no generated characters or replacement artwork were used.

## Scoped Changes

- Current selection layout, route structure, confirmation positioning and
  read/write envelope entrances are retained. No writing component or writing
  media player was changed.
- Selection playback is opt-in through `AdministratorCharacter.selectionPlayback`.
  The shared activity map and original `AnimalMedia` remain available downstream.
- Each role has its own video. Idle is a paused decoded video frame, not a PNG
  substitute. Hover/focus starts one action; clicking promotes the running action
  without restarting it. Completion holds the last frame.
- Finished clips can replay with a 240ms canvas-held frame transition. The canvas
  is only a transient bridge, not a replacement for video playback. Sources are
  not remounted or reloaded on hover.
- Only one selection video runs at once. Inactive scenes, hidden documents and
  reduced-motion preference stop playback. All four videos are muted, inline,
  contained, non-looping and have no native controls.
- Removed the duplicate selection preloader nodes, which were rendering a second
  row of animals when their hiding style was absent.
- Mouse/Rabbit use their existing WebMs unchanged. Cat's existing matte had
  background-connected paper residue; its derived WebM cleans that alpha. Dog's
  existing clip grew from 221px to 386px in height; its derived WebM stabilizes
  the subject at about 330px and its ground position without changing proportions.
  All 97 original frames remain in each clip. Original files are untouched.

## Checks

- `npm.cmd run check`: passed.
- `node tools/verify-keeper-motion.mjs`: passed; verifies original source hashes,
  four distinct videos, all-frame alpha, frame counts, stable dog size and scoped
  bindings. Source/cleaned alpha reports and light/dark contact sheets are in
  `qa-evidence/keeper-motion/`.
- Browser on isolated QA origin `127.0.0.1:5180`: all four videos initially paused
  at time zero; focus/hover handler plays only one role. Hover-to-select on Dog
  advanced from 0.028s to 0.097s instead of restarting. All four selections ended
  paused at their full duration. Reselect and existing envelope entrances worked.
  Entering Write returned to its resting paper; all four selection videos paused.
- Returning to the keeper scene did not replay completed clips. Console inspection
  returned no warnings/errors. At 1000 x 720 and 390 x 844 all four portrait boxes
  remained within the viewport; video dimensions did not resize them. The existing
  mobile global header still clips long English navigation, outside this motion-only scope.
- Reduced motion was code-reviewed, not OS-emulated. No claim of newly generated
  blink, sewing or tail frames; all motions come from the supplied footage.

## Existing Test Limitations

Unrelated legacy tests are not green: `verify-horizontal-logic.mjs:38` expects
chapter 7 but receives 6; `verify-vertical-logic.mjs` expects the old `single
pauseMarks` source comment; `verify-writing-replay.mjs:25` accesses a missing
deletion residue. The old `verify-letter-behaviors.mjs` also requires an unavailable
CDP endpoint at port 9347. Those tests and their writing/navigation modules were
not modified by this animation restoration. Browser checks used the supported
in-app browser on an isolated port instead.

## Reproduce Media Inspection

Set `FFMPEG` to a local FFmpeg executable and make the existing Sharp package
available on `NODE_PATH`, then run:

```text
node tools/inspect-keeper-media.mjs
node tools/restore-selection-video.mjs
node tools/inspect-keeper-media.mjs --restored
node tools/verify-keeper-motion.mjs
```
