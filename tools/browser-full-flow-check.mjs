const pages = await fetch("http://127.0.0.1:9333/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("No browser page found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const errors = [];
let id = 0;
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const job = pending.get(message.id);
    pending.delete(message.id);
    message.error ? job.reject(new Error(message.error.message)) : job.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id;
  pending.set(next, { resolve, reject });
  socket.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = async (selector, label) => {
  if (!(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`))) throw new Error(label);
  console.log(`PASS ${label}`);
};

await send("Runtime.enable");
await send("Log.enable");
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(1200);
await assert(".ob-site", "old-blog homepage renders");
await assert(".ob-entry--writing", "Writing entry exists");
await assert(".ob-entry--reading", "Reading entry exists");

await evaluate("document.querySelector('.ob-entry--reading').click()");
await wait(700);
await assert(".bs-archive-workspace", "Reading relation workspace opens");
await evaluate("document.querySelectorAll('.bs-archive-filters button')[3].click(); document.querySelector('.bs-draw-handle').click()");
await wait(900);
await assert(".bs-stranger-letter", "stranger letter unfolds");
await assert(".bs-letter-response", "attached response note appears");

await evaluate("document.querySelector('.bs-archive-write').click()");
await wait(700);
await assert(".bs-writing-room", "Writing room opens");
await assert(".bs-sticker-tray", "sticker tray exists");
await evaluate("document.querySelector('.bs-sticker-tray button').click()");
await wait(100);
await assert(".bs-paper-decoration", "paper decoration is added");

await evaluate(`(() => {
  const textarea = document.querySelector('.bs-writing-surface textarea');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setter.call(textarea, '我其实很生气');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await wait(150);
await evaluate(`(() => {
  const textarea = document.querySelector('.bs-writing-surface textarea');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setter.call(textarea, '我只是有一点难过');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await wait(1000);
await evaluate("document.querySelector('.bs-paper-footer button').click()");
await wait(700);
await assert(".bs-replay-room", "Replay opens with recorded writing");
await evaluate("document.querySelector('.bs-replay-controls button').click()");
await wait(500);
await evaluate("document.querySelector('.bs-replay-continue').click()");
await wait(700);
await assert(".bs-package-room", "packaging ritual starts");

await evaluate("document.querySelector('.bs-ritual-next').click()");
await wait(400);
await evaluate("document.querySelector('.bs-ritual-next').click()");
await wait(500);
const drag = await evaluate(`(() => {
  const a = document.querySelector('.bs-postmark-tool').getBoundingClientRect();
  const b = document.querySelector('.bs-postage-envelope').getBoundingClientRect();
  return { from: { x:a.left+a.width/2, y:a.top+a.height/2 }, to: { x:b.left+b.width/2, y:b.top+b.height/2 } };
})()`);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: drag.from.x, y: drag.from.y, button: "left", buttons: 1, clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: drag.to.x, y: drag.to.y, button: "left", buttons: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: drag.to.x, y: drag.to.y, button: "left", buttons: 0, clickCount: 1 });
await wait(350);
await assert(".bs-postmark-imprint", "postmark is applied by dragging");
await evaluate("document.querySelector('.bs-ritual-next').click()");
await wait(400);
await evaluate("document.querySelectorAll('input[name=\"destinationType\"]')[1].click(); document.querySelector('.bs-ritual-next').click()");
await wait(800);
await assert(".bs-resolution-room--public", "public archive destination resolves");

if (errors.length) throw new Error(`Console errors: ${errors.join(" | ")}`);
console.log("PASS no browser console errors");
socket.close();
