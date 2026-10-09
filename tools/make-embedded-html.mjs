import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");

const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const cssFile = indexHtml.match(/href="\/assets\/([^"]+\.css)"/)?.[1];
const jsFile = indexHtml.match(/src="\/assets\/([^"]+\.js)"/)?.[1];

if (!cssFile || !jsFile) {
  throw new Error("Could not find built CSS or JS references in dist/index.html.");
}

const mime = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".js": "text/javascript",
};

function dataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${type};base64,${data}`;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

let css = fs.readFileSync(path.join(assets, cssFile), "utf8");
let js = fs.readFileSync(path.join(assets, jsFile), "utf8");

const artDirectory = path.join(dist, "assets", "art");
if (fs.existsSync(artDirectory)) {
  for (const filePath of walk(artDirectory)) {
    if (!/\.(png|jpe?g|svg)$/i.test(filePath)) continue;
    const name = path.relative(artDirectory, filePath).replaceAll("\\", "/");
    const uri = dataUri(filePath);
    const escaped = uri.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
    js = js.replaceAll(`\`${"${eT}"}/${name}\``, `\`${escaped}\``);
    js = js.replaceAll(`\`${"${ART}"}/${name}\``, `\`${escaped}\``);
    js = js.replaceAll(`/assets/art/${name}`, uri);
    css = css.replaceAll(`/assets/art/${name}`, uri);
  }
}

for (const filePath of walk(assets)) {
  if (!/\.(png|jpe?g|svg)$/i.test(filePath)) continue;
  const name = path.relative(assets, filePath).replaceAll("\\", "/");
  const uri = dataUri(filePath);
  js = js.replaceAll(`/assets/${name}`, uri);
  css = css.replaceAll(`/assets/${name}`, uri);
}

for (const name of fs.readdirSync(assets)) {
  if (!/\.js$/i.test(name) || name === jsFile) continue;
  const uri = dataUri(path.join(assets, name));
  js = js.replaceAll(`./${name}`, uri);
  js = js.replaceAll(`/assets/${name}`, uri);
}

const embedded = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Before Sending - Embedded Demo</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>
`;

const outFile = path.join(root, "Before-Sending-embedded.html");
fs.writeFileSync(outFile, embedded, "utf8");
console.log(outFile);
