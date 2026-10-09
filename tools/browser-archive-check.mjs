const pages = await fetch("http://127.0.0.1:9333/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page" && item.title.includes("Before Sending"));
if (!page) throw new Error("Before Sending page not found");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const errors = [];
let id = 0;
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { const job = pending.get(message.id); pending.delete(message.id); message.error ? job.reject(message.error) : job.resolve(message.result); }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send("Runtime.enable");
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(1300);
await evaluate("document.querySelector('.bs-invitation').scrollIntoView({block:'center'}); document.querySelector('.bs-archive-box').click()");
await wait(1000);
if (!(await evaluate("Boolean(document.querySelector('.bs-archive-scene'))"))) throw new Error("Archive did not open");
console.log("PASS entered physical archive room");
await evaluate("document.querySelector('.bs-draw-handle').click()");
await wait(950);
if (!(await evaluate("Boolean(document.querySelector('.bs-stranger-letter'))"))) throw new Error("Random letter did not open");
console.log("PASS random stranger letter unfolded");
await evaluate("document.querySelector('.bs-letter-return').click()");
await wait(1250);
if (await evaluate("Boolean(document.querySelector('.bs-stranger-letter'))")) throw new Error("Letter did not return to archive");
console.log("PASS stranger letter returned to drawer");
if (errors.length) throw new Error(errors.join(" | "));
console.log("PASS archive has no console errors");
socket.close();
