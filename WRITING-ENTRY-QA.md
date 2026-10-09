# Writing Desk Entry Regression

Date: 2026-09-28

## Scope

Reuse the existing `useDeskPaper` state machine and existing desk/paper assets.
No changes to keeper selection, archive, routing or letter-session logic in this fix.

## Fix

- Each writing-scene entry starts in `desk`, including re-entry with a saved draft.
- Programmatic navigation, scene snapping and incoming scroll inertia cannot trigger lifting.
- After the scene settles, a new downward wheel/touch/keyboard gesture or a paper click starts the existing GSAP transition.
- Only the local lift/return transition consumes scroll input. Normal page scrolling resumes afterwards.
- The same paper lifts over 1.1 seconds; its editor stays disabled until completion.
- The existing desk remains behind a warm, 24%-opacity shade.
- The selected keeper appears on the resting desk and on the raised paper using the existing provider.
- Returning to the desk reverses paper movement and clears the shade without clearing the draft.

## Verified

Isolated local browser QA on port 5201; production-preview draft storage on port 5173 was not changed.

- Existing keeper selection: choose rabbit, then the original Write envelope.
- Arrival: `desk`, disabled editor, body focus, rabbit retained on desk and paper.
- Click-to-lift and downward-scroll-to-lift both enable writing only after the animation.
- Scroll-to-lift preserves document scroll position (1440px before and after).
- Return-to-desk restores the small paper and bright background.
- Enter text, leave via home, re-enter via navigation: draft retained, `desk`, editor disabled, no autofocus.
- Raised long draft remains readable using the existing growing-paper behavior.
- No console errors or warnings in the QA browser.
- `npm run check`: passed.
- `node tools/verify-vertical-logic.mjs`: passed.
- No forbidden asset references in the writing files changed by this fix.

## Not Run Successfully

The older `verify-letter-behaviors.mjs` and `verify-session-safety.mjs` scripts require a separate CDP browser at port 9347. That service was unavailable, so those scripts are not counted as passed. Browser checks above used the in-app browser instead.
