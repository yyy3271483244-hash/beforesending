// Measured seams in the original 1456 x 816 drawer-bg.jpg, not equal viewport cells.
// Column seams drift slightly between painted rows.
const seams = [
  [18, 210, 412, 618, 827, 1035, 1237, 1437],
  [18, 210, 412, 618, 827, 1035, 1237, 1437],
  [18, 211, 413, 619, 827, 1035, 1236, 1437],
  [18, 211, 413, 619, 827, 1034, 1235, 1436],
  [18, 211, 413, 619, 827, 1034, 1235, 1435],
];
const rows = [16, 171, 329, 488, 644, 802];
const occupiedSlots = [9, 16, 17, 18, 25, 26, 1, 3, 5, 7, 10, 12, 14, 20, 21, 22, 24, 28, 30, 33];

export function makeArchiveDrawers(entries) {
  return Array.from({ length: 35 }, (_, cell) => {
    const index = occupiedSlots.indexOf(cell), entry = entries[index];
    const column = cell % 7, row = Math.floor(cell / 7);
    const letters = entry?.letters || [];
    return {
      ...(entry || { id: `empty-${cell}`, letters: [], letterCount: 0 }), cell,
      kind: letters.length === 0 ? 'empty' : entry.category === 'future' && letters[0]?.slot === 0 ? 'special' : 'letters',
      number: index < 0 ? '' : String(index + 1).padStart(2, '0'),
      bounds: {
        x: seams[row][column] / 1456 * 100, y: rows[row] / 816 * 100,
        width: (seams[row][column + 1] - seams[row][column]) / 1456 * 100,
        height: (rows[row + 1] - rows[row]) / 816 * 100,
      },
    };
  });
}
