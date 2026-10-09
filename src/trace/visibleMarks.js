// Condense only the visible marks. The event history and original pause durations stay intact.
export function compactPauseMarks(knots, text) {
  const paragraphs = new Map();
  for (const knot of knots) {
    let position = Math.max(0, Math.min(knot.position || 0, text.length));
    while (position > 0 && /\s/.test(text[position - 1])) position--;
    if (!text.slice(0, position).trim()) continue;
    const paragraph = text.slice(0, position).split("\n").length;
    const group = paragraphs.get(paragraph) || [];
    const near = group.find((item) => Math.abs(item.position - position) < 24);
    const existing = near || (group.length >= 2 ? group.reduce((a, b) => Math.abs(a.position - position) < Math.abs(b.position - position) ? a : b) : null);
    if (existing) {
      existing.duration = Math.max(existing.duration, knot.duration);
      existing.complexity = existing.duration >= 8000 ? 3 : existing.duration >= 5000 ? 2 : 1;
    } else group.push({ ...knot, position });
    paragraphs.set(paragraph, group);
  }
  return [...paragraphs.values()].flat();
}

// Keep every deletion in the letter history, but collapse nearby anchors into
// one visible thread. Without this, repeated edits at the same caret produce a
// stack of nearly identical marks even though the text itself renders once.
export function compactDeletionMarks(fragments, text) {
  const visible = [];
  for (const fragment of fragments) {
    if (fragment.cut || fragment.isPermanentHidden || !fragment.content) continue;
    const position = Math.max(0, Math.min(fragment.position || 0, text.length));
    const paragraph = fragment.paragraphId || text.slice(0, position).split("\n").length;
    const existing = visible.find((item) => item.paragraphId === paragraph && Math.abs(item.position - position) <= 3);
    if (!existing) {
      visible.push({ ...fragment, position, paragraphId: paragraph });
      continue;
    }

    existing.content = [existing.content, fragment.content].filter(Boolean).join("\n");
    existing.eventIds = [...new Set([...(existing.eventIds || []), ...(fragment.eventIds || [])])];
    existing.tokenIds = [...(existing.tokenIds || []), ...(fragment.tokenIds || [])];
    existing.timestamp = Math.max(existing.timestamp || 0, fragment.timestamp || 0);
    existing.resetKey = `${existing.id}:${existing.eventIds.join('.')}:${existing.content}`;
  }
  return visible;
}
