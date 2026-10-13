# Stamp artwork

`source/stamp-01` through `source/stamp-12` are the supplied originals. The writing flow uses the enlarged WebP versions in `processed/`.

To regenerate the display files after replacing a source image, keep its matching number and run `python tools/process_stamps.py`. Update the `stamps` data array in `src/components/StampSendScene.jsx` when adding or reordering stamps; each item owns its image, accessible label, and collage position.

The processed stamp PNGs use 4x Lanczos enlargement and an alpha mask that removes only near-white pixels connected to the image boundary. The perforated paper silhouette and pale stamp border remain intact. `tray-source.png` is the supplied hand-drawn tray reference; processing removes its exterior matte while preserving the enclosed tray surface and rotates it to landscape orientation.
