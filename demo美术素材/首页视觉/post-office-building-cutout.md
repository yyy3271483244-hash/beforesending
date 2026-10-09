# Post Office Building Cutout

- Original reference: `post-office-building-source.png` (unaltered copy).
- Website asset: `../../public/assets/post-office/post-office-building-cutout.png`.
- Method: built-in image editing tool, background-extraction edit. No CLI/API fallback.
- Output: 1199 x 1312 RGBA PNG. Sampled fully transparent pixels: 40.2%.
- Alpha silhouette bounds (sampled): x 111..1092, y 12..1218.
- Original image is retained. This is an AI-assisted extraction, not a lossless pixel-mask operation.
- Retained the existing front postbox and facade-overlapping plants; removed the sky, neighboring houses, trees, fences, alley and street.
- Website rendering uses `object-fit: contain`, with no image filter, recoloring, distortion or rectangular backdrop.

## Edit Prompt

Use case: background-extraction. This is a faithful cutout EDIT, not a new illustration.
 Edit target: the provided watercolor image. Isolate ONLY the central two-storey POST & TEA post office building on a genuinely transparent alpha background, export transparent PNG.
 Keep the complete central building silhouette: both original chimneys including chimney pots, full slate roof and dormers, cream walls, sage bay windows, original central door, the attached POST & TEA sign, original lantern and wall-mounted details. Preserve its original proportions, drawing, colors, watercolor/pencil textures and window contents exactly. Keep any tiny plants overlapping the facade and existing red post box if needed to avoid altering the building, but no freestanding background trees or neighbors.
 Remove everything outside the building silhouette: all sky/clouds, distant trees, upper-right branches, both neighboring houses, fences, side alley, cobblestone street and pavement. Cut directly around the building base and front doorstep, leaving no rectangular ground plinth.
 The entire building must be visible from tallest chimney to base. Tight portrait framing with only a small transparent safety margin. True RGBA transparency, not a white background, not a fake checkerboard. Clean natural antialiased edges, no white fringe, no shadow rectangle.
 Do not repaint, reinterpret, improve, recolor, add ornaments, change architecture, stretch, crop the roof, or generate a different building. Change only the surrounding pixels to transparency.
