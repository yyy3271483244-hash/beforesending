const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

export function splitGraphemes(value = '') {
  const text = String(value);
  if (!segmenter) {
    let index = 0;
    return Array.from(text, part => {
      const start = index;
      index += part.length;
      return { text: part, start, end: index };
    });
  }
  return Array.from(segmenter.segment(text), item => ({
    text: item.segment,
    start: item.index,
    end: item.index + item.segment.length,
  }));
}

export const graphemeCount = value => splitGraphemes(value).length;
