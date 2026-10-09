import { useLayoutEffect } from "react";
import { measureCaret } from "../trace/letterSession";

export function useGrowingPaper(editor, scrollport, text, active, replayIndex, scrollMode = 'sheet') {
  useLayoutEffect(() => {
    const input = editor.current;
    const sheet = scrollport.current;
    const scene = input?.closest('.journey-section');
    if (!input || !sheet) return undefined;
    if (!active && scrollMode !== 'document') {
      input.style.removeProperty("height");
      sheet.scrollTop = 0;
      return undefined;
    }

    function resize() {
      // Measure the complete text, including wrapping and unfinished IME input.
      const previousScroll = scrollMode === 'document' ? (scene?.scrollTop ?? window.scrollY) : sheet.scrollTop;
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
      input.scrollTop = 0;
      if (scrollMode === 'document') {
        window.dispatchEvent(new Event('before-sending-paper-resize'));
        if (scene) scene.scrollTop = previousScroll;
        if (!active || document.activeElement !== input) return;
        const point = measureCaret(input, text, input.selectionStart);
        const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 44;
        const top = input.getBoundingClientRect().top + point.y;
        const bottom = top + lineHeight;
        // The paper grows naturally inside its scene, not inside a fixed-height editor.
        const owner = scene || window;
        if (bottom > innerHeight - 100) owner.scrollBy({ top: bottom - innerHeight + 100, behavior: 'instant' });
        else if (top < 100) owner.scrollBy({ top: top - 100, behavior: 'instant' });
        return;
      }
      sheet.scrollTop = previousScroll;

      if (document.activeElement !== input && replayIndex == null) return;
      const point = measureCaret(input, text, replayIndex ?? input.selectionStart);
      const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 44;
      const top = input.getBoundingClientRect().top - sheet.getBoundingClientRect().top + point.y;
      const bottom = top + lineHeight;
      const margin = Math.min(100, sheet.clientHeight * .2);
      if (bottom > sheet.clientHeight - margin) sheet.scrollTop += bottom - sheet.clientHeight + margin;
      else if (top < 24) sheet.scrollTop += top - 24;
    }

    resize();
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width === input.clientWidth) return;
      width = input.clientWidth;
      resize();
    });
    observer.observe(input);
    window.addEventListener("resize", resize);
    window.addEventListener("before-sending-languagechange", resize);
    if (scrollMode === 'document') input.addEventListener('keyup', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("before-sending-languagechange", resize);
      input.removeEventListener('keyup', resize);
    };
  }, [editor, scrollport, text, active, replayIndex, scrollMode]);
}
