// Reuse actual sample letters; each drawer has a stable, duplicate-free filing order.
export function archiveStack(drawer, drawers) {
  if (drawer.kind === 'empty') return [];
  const pool = [
    ...drawer.letters,
    ...drawers.filter(item => item.category === drawer.category).flatMap(item => item.letters),
    ...drawers.flatMap(item => item.letters),
  ];
  return [...new Map(pool.map(letter => [letter.id, letter])).values()].slice(0, 7);
}
