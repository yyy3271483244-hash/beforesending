import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const browser = await chromium.connectOverCDP(process.env.QA_CDP || 'http://127.0.0.1:9347');
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.QA_URL || 'http://127.0.0.1:5173/';
const out = 'ui-preview/desk-archive';
fs.mkdirSync(out, { recursive: true });
const shot = name => page.screenshot({ path: `${out}/${name}.png` });
const pass = text => console.log(`PASS ${text}`);
async function progress(value) {
  await page.locator('.writing-desk').evaluate((el, p) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * p * .16, behavior: 'instant' }), value);
  await page.waitForTimeout(220);
}
const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('before-sending-letter-v3')));
try {
  await page.goto(`${base}#write`);
  await page.waitForSelector('.desk-scene');
  await page.waitForTimeout(600);
  const resting = await page.locator('.living-paper').evaluate(el => getComputedStyle(el).transform);
  assert(await page.locator('textarea').isDisabled());
  assert.equal(await page.locator('.caret-administrator').count(), 0);
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('.living-paper').evaluate(el => getComputedStyle(el).transform), resting);
  pass('desk stays still on load; writing and animal inactive');
  const rects = [];
  for (const p of [0, .25, .5, .75, 1]) {
    await progress(p);
    await shot(`desk-${p * 100}`);
    rects.push(await page.locator('.living-paper').boundingBox());
    const actual = Number(await page.locator('.writing-desk').getAttribute('data-intro-progress'));
    assert(Math.abs(actual - p) < .01, `scroll ${p}: ${actual}`);
    assert.equal(await page.locator('textarea').isEnabled(), p === 1);
  }
  assert(rects[4].height > rects[0].height * 2);
  assert(Math.abs(rects[4].x + rects[4].width / 2 - await page.evaluate(() => document.documentElement.clientWidth / 2)) < 1);
  assert(Math.abs(rects[4].y + rects[4].height / 2 - 450) < 1);
  pass('0/25/50/75/100% true scrub with centered final paper');
  const editor = page.locator('textarea');
  await editor.fill('有些话，慢慢写。');
  await page.waitForTimeout(1600);
  const transform = await page.locator('.caret-administrator').evaluate(el => getComputedStyle(el).transform);
  const moves = Number(await page.locator('.caret-administrator').getAttribute('data-moves') || 0);
  await editor.press('End');
  await editor.pressSequentially(' One quiet sentence.', { delay: 45 });
  await page.waitForTimeout(600);
  assert.equal(await page.locator('.caret-administrator').evaluate(el => getComputedStyle(el).transform), transform);
  assert.equal(Number(await page.locator('.caret-administrator').getAttribute('data-moves') || 0), moves);
  pass('same-line typing never restarts animal motion');
  await editor.press('Enter');
  await editor.pressSequentially('A new line.', { delay: 65 });
  await page.waitForTimeout(1300);
  assert.equal(Number(await page.locator('.caret-administrator').getAttribute('data-moves')), moves + 1);
  pass('newline moves once, after debounce');
  await page.waitForTimeout(1900);
  assert.equal(await page.locator('.caret-administrator').getAttribute('data-state'), 'weaving');
  assert.equal((await draft()).knots.length, 1);
  await page.waitForTimeout(5000);
  assert.equal((await draft()).knots.length, 1);
  assert.equal((await draft()).knots[0].complexity, 3);
  assert.equal(await page.locator('.working-thread path').evaluate(el => getComputedStyle(el).animationIterationCount), '1');
  await shot('quiet-knot');
  pass('one pause event; compact knot grows to three levels without looping animation');
  for (let i = 0; i < 3; i++) { await editor.pressSequentially(' Another thought.'); await page.waitForTimeout(3400); }
  assert((await draft()).knots.length >= 4);
  assert(await page.locator('.anchored-trace.is-knot').count() <= 2);
  pass('visual pauses capped at two per paragraph, full history retained');
  await editor.fill('Do not lose this draft.');
  const saved = (await draft()).finalText;
  await progress(.5);
  assert(await editor.isDisabled());
  assert.equal(await page.locator('.caret-administrator').count(), 0);
  await progress(0);
  assert.equal(await page.locator('.living-paper').evaluate(el => getComputedStyle(el).transform), resting);
  await progress(1);
  assert.equal(await editor.inputValue(), saved);
  pass('reverse scroll disables writing, rests paper, preserves draft');
  for (const size of [{width:2048,height:1078}, {width:390,height:844}, {width:820,height:1180}]) {
    await page.setViewportSize(size); await page.waitForTimeout(400); await progress(1);
    const bounds = await page.locator('.desk-scene').boundingBox();
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.equal(bounds.x, 0); assert.equal(bounds.width, clientWidth);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const paper = await page.locator('.living-paper').boundingBox();
    assert(Math.abs(paper.x + paper.width / 2 - clientWidth / 2) < 1);
    assert(Math.abs(paper.y + paper.height / 2 - size.height / 2) < 1);
    await shot(`desk-${size.width}`);
  }
  pass('full-bleed at 2048px, 820px and 390px; no overflow; final paper centered');
  await page.setViewportSize({width:1400,height:900});
  await page.goto(`${base}#bureau`); await page.waitForSelector('.drawer-front');
  await page.locator('.drawer-front').nth(17).click(); await page.waitForTimeout(1000);
  const envelopes = page.locator('.painted-drawer.is-open .file-envelope');
  assert.equal(await envelopes.count(), 3);
  assert.deepEqual(await envelopes.allTextContents(), ['', '', '']);
  assert.equal(new Set(await envelopes.evaluateAll(els => els.map(el => el.dataset.color))).size, 3);
  await page.mouse.move(40, 40); await page.waitForTimeout(400); await shot('drawer-blank');
  assert.equal(await page.locator('.archive-preview').count(), 0);
  for (let i=0; i<3; i++) {
    // Each envelope exposes an individually reachable, offset corner.
    await envelopes.nth(i).focus(); await page.waitForTimeout(500);
    assert.equal(await page.locator('.archive-preview').getAttribute('data-letter-id'), await envelopes.nth(i).getAttribute('data-letter-id'));
    assert((await page.locator('.archive-preview p').textContent()).length > 0);
    await shot(`drawer-preview-${i}`);
  }
  pass('three blank differently colored envelopes, data-bound focus previews');
  const selected = envelopes.nth(1);
  const id = await selected.getAttribute('data-letter-id');
  await selected.press('Enter');
  await page.waitForSelector('.archive-flight');
  assert(page.url().endsWith('#bureau'));
  await page.waitForTimeout(450); await shot('drawer-flight');
  await page.waitForTimeout(1300); await shot('drawer-unfold');
  await page.waitForSelector('.living-reading'); await page.waitForTimeout(850);
  assert.equal(await page.locator('.living-reading').getAttribute('data-letter-id'), id);
  assert((await page.locator('.living-letter-text').textContent()).length > 10);
  await shot('drawer-reading');
  pass('click extracts same letter then automatically unfolds into reading');
  for (const asset of ['writing-desk/paper.png','archive-envelopes/ivory.png','archive-envelopes/pink.png','archive-envelopes/blue.png']) {
    const {data,info} = await sharp(`public/assets/${asset}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const alpha = (x,y) => data[(y*info.width+x)*4+3];
    assert(alpha(0,0) === 0 && alpha(info.width-1,info.height-1) === 0, asset);
    assert(alpha(Math.floor(info.width/2),Math.floor(info.height/2)) > 245, asset);
  }
  pass('paper and three envelopes have genuinely transparent outer backgrounds, opaque interiors');
  assert.deepEqual(errors, []);
  pass('no browser runtime errors');
} finally { await context.close(); await browser.close(); }
