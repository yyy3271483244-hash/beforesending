export function clearPaperMatte(source, width, height) {
  const pixels = new Uint8ClampedArray(source);
  const outside = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  function enqueue(index) {
    if (outside[index]) return;
    const p = index * 4;
    const low = Math.min(source[p], source[p + 1], source[p + 2]);
    const high = Math.max(source[p], source[p + 1], source[p + 2]);
    if (source[p + 3] !== 0 && (low < 236 || high - low > 28)) return;
    outside[index] = 1;
    queue[tail++] = index;
  }
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++], x = index % width;
    pixels[index * 4 + 3] = 0;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  // Unmatte only the light antialiased boundary; white paper inside stays opaque.
  for (let index = 0; index < width * height; index++) {
    if (outside[index]) continue;
    const p = index * 4, x = index % width, y = Math.floor(index / width);
    const light = Math.min(source[p], source[p + 1], source[p + 2]);
    if (light < 224 || !source[p + 3]) continue;
    const neighbours = [];
    if (x > 0) neighbours.push(index - 1);
    if (x < width - 1) neighbours.push(index + 1);
    if (y > 0) neighbours.push(index - width);
    if (y < height - 1) neighbours.push(index + width);
    if (!neighbours.some(next => outside[next])) continue;
    const ink = Math.min(...neighbours.filter(next => !outside[next]).map(next => Math.min(source[next * 4], source[next * 4 + 1], source[next * 4 + 2])));
    if (!Number.isFinite(ink) || ink >= light - 8) continue;
    const coverage = Math.min(1, (255 - light) / (255 - ink));
    pixels[p + 3] = source[p + 3] * coverage;
    for (let channel = 0; channel < 3; channel++) pixels[p + channel] = 255 - (255 - source[p + channel]) / Math.max(.01, coverage);
  }
  return pixels;
}
