# Envelope Entrances

- `write-source.png`: user-provided pink open envelope, 1232 x 928.
- `read-source.png`: user-provided ivory envelope with a thread tail, 1232 x 928.

Run `node tools/prepare-entrance-envelopes.mjs` from the project root to export transparent PNGs to `public/assets/entrance-envelopes/`.

The script traces the original contours with antialiased masks instead of removing pale pixels by brightness. The envelope, flap, paper, thread and pen are separate layers. Original adjacent paper pixels fill the areas behind the extracted thread and pen. The concealed portion of the writing sheet extends its own texture, keeping the sheet continuous as it rises.

No replacement illustration or generated envelope is used. Both the live site and the embedded HTML consume the same exports. `npm run embed` refreshes the embedded version after changes.
