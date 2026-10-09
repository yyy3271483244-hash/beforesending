import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';

const tokens = fs.readFileSync('src/design-system.css', 'utf8');
const layout = fs.readFileSync('src/interface-layout.css', 'utf8');
assert.match(tokens, /--grid-max: 1312px/);
assert.match(tokens, /--grid-gutter: 64px/);
assert.match(tokens, /--grid-gap: 24px/);
assert.match(tokens, /--grid-columns: 12/);
const roles = new Set([...tokens.matchAll(/--type-([a-z0-9]+):/g)].map(match => match[1]));
assert.deepEqual([...roles].sort(), ['body', 'caption', 'h1', 'h2', 'h3', 'nav']);
const spaces = [...tokens.matchAll(/--space-\d+: (\d+)px/g)].map(match => Number(match[1]));
assert.deepEqual(spaces, [8,16,24,32,48,64,96,128]);
for (const name of fs.readdirSync('src').filter(name => name.endsWith('.css'))) {
  const ast = postcss.parse(fs.readFileSync(`src/${name}`, 'utf8'));
  ast.walkDecls(declaration => {
    if (['font', 'font-size'].includes(declaration.prop)) {
      assert.doesNotMatch(declaration.value, /\b\d+(?:\.\d+)?(?:px|vw|rem)\b/, `${name}:${declaration.source.start.line}: use a semantic type token`);
    }
  });
}
for (const selector of ['postal-header','home-selection-heading','home-animal-lineup','journey-writing','journey-ritual','waiting-grid','restored-bureau-footer','bureau-reading-paper']) assert.ok(layout.includes(selector));
assert.doesNotMatch(layout, /font-size:\s*\d|letter-spacing:\s*-/);
assert.doesNotMatch(layout, /新版/);
console.log('Passed: six typography roles, eight spacing steps, shared 12-column grid, all CSS literal font declarations migrated.');
