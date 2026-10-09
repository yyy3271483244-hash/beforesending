const pages = await fetch("http://127.0.0.1:9333/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("No browser page found");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const job = pending.get(message.id);
    pending.delete(message.id);
    message.error ? job.reject(message.error) : job.resolve(message.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id;
  pending.set(next, { resolve, reject });
  socket.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(900);
const home = await evaluate(`({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, nav: document.querySelectorAll('.ob-nav button').length })`);
if (home.scrollWidth > home.width + 2 || home.nav !== 4) throw new Error(`mobile homepage overflow ${JSON.stringify(home)}`);
console.log("PASS mobile homepage fits viewport");
await evaluate("document.querySelector('.ob-entry--writing').click()");
await wait(800);
const writing = await evaluate(`(() => { const paper=document.querySelector('.bs-letter-paper').getBoundingClientRect(); return { width:innerWidth, scrollWidth:document.documentElement.scrollWidth, left:paper.left, right:paper.right }; })()`);
if (writing.scrollWidth > writing.width + 2 || writing.left < -1 || writing.right > writing.width + 1) throw new Error(`mobile writing overflow ${JSON.stringify(writing)}`);
console.log("PASS mobile writing fits viewport");
const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
await import("node:fs").then(({ writeFileSync }) => writeFileSync("test-mobile-writing.png", Buffer.from(shot.data, "base64")));
await send("Emulation.clearDeviceMetricsOverride");
socket.close();
