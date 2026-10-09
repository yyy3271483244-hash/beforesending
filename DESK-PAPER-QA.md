# Writing Desk Paper QA

Scope: paper motion and background dismissal only. Original artwork, recording engine,
replay engine, navigation, typography and delivery logic are not replaced.

## Implementation

- `src/animation/useDeskPaper.js`: 1050ms landing, 880ms staged lift, 840ms return.
- Table transform uses perspective/rotateX; lifted transform returns to identity.
- Passive wheel/touch/key auto-lift listeners removed. Native scrolling does not pick up paper.
- `src/components/JourneyWriting.jsx`: background click calls the existing suspend and close
  operations; paper, controls, links, inputs, aside companions and story controls are excluded.
- `src/desk-paper-motion.css`: subtle material-edge shadow, pointer and small pickup hint.
- One paper container and textarea remain mounted throughout the interaction.

## Browser checks

Tested in `/tools/desk-paper-qa.html`, using real components and a separate in-memory
letter, without altering the user's saved draft. React StrictMode is enabled.

- Table paper settled at a 57-degree perspective, opacity 1, without repeating motion.
- At 1440x900 its bounding box was approximately x355/y283, 721x289.
- A lift intermediate frame reported rotationX 46.2 degrees and scale .75; final
  transform returned to perspective-only, enabled editing and shade opacity .24.
- Entered `I was angry`, paused, deleted `angry`, typed `sad`.
- Real insert/delete/pause events and the `angry` deletion fragment were recorded.
- Clicking outside the paper entered RETURNING, disabled the editor, then reached
  TABLE with shade opacity 0. Text and original event IDs remained intact.
- Picked up again and appended `. Still here.` to the same draft.
- Finish entered replay, not delivery. Playback showed the recorded earlier text.
- Pause, 2x speed, timeline Home (empty text at time 0), resume and replay worked.
- At the end replay text matched `I was sad. Still here.` and confirmation enabled.
- At 1920x1080 the raised paper was centered, approximately x519/y119, 867x842.

## Automated checks

- `npm run check`: passed.
- `node tools/verify-writing-replay.mjs`: passed real pauses, seek, deletions, rewrite,
  undo, legacy drafts, workflow gates and resumed recording clock checks.

This isolated test does not constitute a full-site or mobile regression pass.
