import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = join(process.cwd(), "ui-preview");
const baseUrl = process.argv[2] || "http://127.0.0.1:5175/";

const screens = [
  ["home", "01-home.png"],
  ["transition", "02-transition.png"],
  ["writing", "03-writing.png"],
  ["writing-deletion", "04-writing-deletion.png"],
  ["finished", "05-finished.png"],
  ["backside", "06-backside.png"],
  ["replay", "07-replay.png"],
  ["seal", "08-seal.png"],
  ["delivery", "09-delivery.png"],
  ["waiting", "10-waiting.png"],
  ["receiver", "11-receiver.png"],
  ["pull-thread", "12-pull-thread.png"],
  ["receiver-replay", "13-receiver-replay.png"],
  ["stitch-response", "14-stitch-response.png"],
  ["coauthored", "15-coauthored.png"],
  ["archive", "16-archive.png"],
];

mkdirSync(outDir, { recursive: true });

for (const [hash, filename] of screens) {
  const file = join(outDir, filename);
  const url = `${baseUrl.replace(/\/$/, "")}/#${hash}`;
  const result = spawnSync(edge, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1440,1100",
    `--screenshot=${file}`,
    url,
  ], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

for (const name of readdirSync(outDir).sort()) {
  const size = statSync(join(outDir, name)).size;
  console.log(`${name}\t${size}`);
}
