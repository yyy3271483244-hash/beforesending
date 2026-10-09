const EVENT_NAME = "before-sending:thread-event";

export const THREAD_ACTIONS = {
  typing: "onTyping",
  delete: "onDelete",
  pause: "onPause",
  replay: "onReplay",
  threadPull: "onThreadPull",
};

export function emitThreadEvent(action, detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { action, ...detail } }));
}

export function listenThreadEvents(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (event) => handler(event.detail || {});
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
