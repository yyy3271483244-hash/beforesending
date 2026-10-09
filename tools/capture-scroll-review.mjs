import fs from "node:fs";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connect() {
  const tabs = await fetch("http://127.0.0.1:9235/json").then((response) => response.json());
  const tab = tabs.find((entry) => entry.type === "page" && entry.url.startsWith("http://127.0.0.1:5173"));
  if (!tab) throw new Error("No browser page is available for review.");

  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (!resolve) return;
    pending.delete(message.id);
    resolve(message);
  });

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Page.reload", { ignoreCache: true });
  await wait(1800);
  return { socket, send };
}

async function capture(send, progress, filename) {
  const state = await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${progress})`,
  });
  await wait(1400);
  const inspection = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      progress: ${progress},
      scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      canvas: document.querySelector('.opening-canvas')?.getBoundingClientRect().toJSON(),
      portfolio: getComputedStyle(document.querySelector('.portfolio-gate')).opacity,
      relationship: getComputedStyle(document.querySelector('.relationship-scene')).opacity,
      windowScene: getComputedStyle(document.querySelector('.window-writing-scene')).opacity,
      entries: getComputedStyle(document.querySelector('.entry-objects')).opacity
    })`,
    returnByValue: true,
  });
  console.log(state.result?.result?.value, inspection.result?.result?.value);
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(filename, Buffer.from(screenshot.result.data, "base64"));
}

const { socket, send } = await connect();
await capture(send, 0.46, "scroll-relation-review.png");
await capture(send, 0.995, "scroll-window-review.png");
socket.close();
