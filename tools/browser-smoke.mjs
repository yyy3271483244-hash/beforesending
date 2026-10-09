const endpoint = "http://127.0.0.1:9333";
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((item) => item.type === "page" && item.title.includes("Before Sending"));
if (!page) throw new Error("Before Sending page not found");

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
const send = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = async (selector, label) => { if (!(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`))) throw new Error(`${label} failed`); console.log(`PASS ${label}`); };

await send("Runtime.enable"); await send("Log.enable");
await assert(".bs-mailbox-room", "mailbox scene available");
const drag = await evaluate(`(() => { const a=document.querySelector('.bs-mail-envelope').getBoundingClientRect(); const b=document.querySelector('.bs-mail-slot').getBoundingClientRect(); return {from:{x:a.left+a.width/2,y:a.top+a.height/2},to:{x:b.left+b.width/2,y:b.top+b.height/2}}; })()`);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: drag.from.x, y: drag.from.y, button: "left", buttons: 1, clickCount: 1 });
await wait(120);
console.log("PRESSED", await evaluate(`({transform:document.querySelector('.bs-mail-envelope').style.transform, active:document.activeElement?.className})`));
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: drag.to.x, y: drag.to.y, button: "left", buttons: 1 });
await wait(180);
console.log("MOVED", await evaluate(`({transform:document.querySelector('.bs-mail-envelope').style.transform, rect:document.querySelector('.bs-mail-envelope').getBoundingClientRect().toJSON()})`));
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: drag.to.x, y: drag.to.y, button: "left", buttons: 0, clickCount: 1 });
await wait(1900);
await assert(".bs-journey-room", "envelope accepted by mailbox");
await wait(13000);
await assert(".bs-arrival-door", "distance journey completes");
await evaluate("document.querySelector('.bs-arrival-door').click()");
await wait(900);
await assert(".bs-arrival-room", "recipient receives envelope");
await evaluate("document.querySelector('.bs-arrived-envelope').click()");
await wait(300);
await assert(".bs-arrived-letter", "recipient unfolds letter");
const finalText = await evaluate("document.querySelector('.bs-arrived-letter p').textContent");
if (!finalText.includes("也许我只是想你")) throw new Error("final letter content was lost");
console.log("PASS final letter content survived");
if (errors.length) throw new Error(`Browser console errors: ${errors.join(" | ")}`);
console.log("PASS no browser console errors");
socket.close();
