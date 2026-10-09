# Archive Motion Check, 2026-09-30

Scope: anonymous archive only. No illustration files, writing logic, keeper logic, typography tokens or scrolling architecture changed.

## Reference

Inspected the supplied 10.27-second video using one-second extracted frames. It shows outward drawer motion, orderly file cards, single-card lift and content beside the still-visible cabinet. The implementation uses existing watercolor cabinet crops and reading-paper.png, not the reference video's office UI.

## Motion

- Drawer: handle response, 780ms local pull, delayed interior; no replacement open-state image.
- Stack: seven distinct existing sample letters, stable order, 50ms stagger, 380ms rise from 16px below.
- Hover: fixed hit strips; paper face lifts 24px and scales 1.015 over 280ms. Raising the artwork does not move its hit strip.
- Reading: capture the selected face's rectangle, lift 28px, expand to the opposite side of the cabinet. Cabinet opacity reaches 0.6; no blur, route or scroll changes.
- Return: recompute the original face rectangle, animate back for 680ms, restore the face only after return. Drawer remains open. Drawer closing reverses stack/front motion over about 680ms.
- Opening/closing/reading operations are guarded; other drawer requests are sequenced after the current drawer closes.

## Browser Evidence

Test origin: independent localhost:5202, without editing the user's stored draft on 5173.

- Default closed: 20 numbered enabled fronts, 15 disabled unnumbered fronts. No exposed letters.
- Enabled hover observed matrix translation 4px; disabled front cursor remained default.
- Opening observed in progress at 0.784153, then settled; double-click did not reverse or duplicate the animation.
- Seven cards reached opacity 1. Pointer moved from card 07 to A, then A to B; only B retained matrix scale 1.015 / y -24, A returned to none.
- B opened actual existing letter content. Closing preserved the paper node during `returning`, with an intermediate transform, before removing it on completion.
- B original and returned bounds exactly matched: x 549.113464, y 284.270844, width 157.335617, height 98.328125 (default viewport).
- Read another letter, then clicked outside: letter returned, drawer stayed open.
- Close drawer observed `closing` with progress 0.909635 before closed.
- ScrollY stayed 5156 throughout default-viewport opening, letter changes, reading and closing; URL stayed #bureau.
- 1920x1080 cabinet bounds: x -40.10, y -16.47, width 1984.86, height 1112.40. Covers viewport.
- 1440x900 cabinet bounds: x -114.69, y -18.17, width 1654.05, height 927. Covers viewport with side cropping. Interaction scrollY remained 6376.67.

`node tools/verify-archive-stack.mjs`: passed.
`npm.cmd run check`: passed.

These checks do not certify unrelated outstanding website tasks or pixel-perfect equivalence to the video.
