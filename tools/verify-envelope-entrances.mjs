import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const output = 'ui-preview/envelope-entrances';
fs.mkdirSync(output, { recursive: true });

for (const kind of ['write', 'read']) {
  const { data, info } = await sharp(`public/assets/entrance-envelopes/${kind}-complete.png`).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  let clear = 0, solid = 0;
  for (let p = 0; p < info.width * info.height; p++) {
    if (data[p * 4 + 3] === 0) clear++;
    if (data[p * 4 + 3] === 255) solid++;
  }
  assert.ok(clear > info.width * info.height * .3, `${kind} background is transparent`);
  assert.ok(solid > info.width * info.height * .4, `${kind} pale paper stays opaque`);
  assert.equal(data[3], 0);
  assert.equal(data[(info.width * info.height - 1) * 4 + 3], 0);
  console.log(`PASS ${kind} transparent contour and opaque paper`);
}

const browser = await chromium.connectOverCDP(process.env.QA_CDP || 'http://127.0.0.1:9347');
const base = 'http://127.0.0.1:5173/';
try {
  for (const [name, width, height, reducedMotion] of [
    ['desktop', 1400, 900, 'no-preference'],
    ['mobile', 390, 844, 'no-preference'],
    ['quiet', 820, 1180, 'reduce'],
    ['narrow', 320, 568, 'reduce'],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: width < 900 });
    try {
      await context.addInitScript(() => {
        window.transitionErrors = [];
        window.transitionSnapshots = [];
        const original = document.startViewTransition?.bind(document);
        if (original) document.startViewTransition = callback => {
          const transition = original(callback);
          transition.ready.then(() => window.transitionSnapshots.push(document.documentElement.dataset.entryTransition), error => window.transitionErrors.push(error.message));
          return transition;
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}#administrators`);
      await page.locator('.administrator-choice').nth(2).click();
      const entrances = page.getByRole('navigation', { name: '读信与写信入口' });
      await entrances.scrollIntoViewIfNeeded();
      await entrances.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert.equal(await page.locator('.office-destinations').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${output}/${name}-idle.png` });
      const write = page.getByRole('button', { name: 'Write a Letter' });
      if (name === 'desktop') {
        await write.hover();
        await page.waitForTimeout(650);
        const paperLift = await write.locator('.entry-paper').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42);
        assert.ok(paperLift <= -12 && paperLift >= -14, 'blank paper lifts 13px on hover');
        const envelopeLift = await write.locator('.entry-object').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42);
        assert.ok(envelopeLift <= -4 && envelopeLift >= -6, 'envelope lifts 5px on hover');
        await page.screenshot({ path: `${output}/${name}-write-hover.png` });
        await page.mouse.move(0, 0);
        await page.waitForTimeout(650);
        assert.ok(Math.abs(await write.locator('.entry-paper').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)) < .1, 'paper settles on mouse leave');
      }
      if (name === 'quiet') await write.focus();
      if (name === 'quiet') await page.keyboard.press('Enter'); else await write.click();
      if (reducedMotion !== 'reduce') {
        await page.waitForTimeout(180);
        assert.equal(new URL(page.url()).hash, '#administrators', 'pickup precedes navigation');
        assert.equal(await page.locator('.envelope-entry.is-lifting').count(), 1);
        await page.screenshot({ path: `${output}/${name}-write-pickup.png` });
      }
      await page.waitForURL('**/#write');
      await page.locator('.living-writing').waitFor();
      await page.waitForFunction(() => !document.documentElement.dataset.entryTransition);
      if (reducedMotion !== 'reduce') assert.ok((await page.evaluate(() => window.transitionSnapshots)).includes('write'), 'paper continuity snapshot succeeds');
      assert(await page.locator('textarea').isDisabled(), 'writing waits for user scroll');
      await page.locator('.writing-desk').evaluate(el => window.scrollTo({top: el.offsetHeight - innerHeight, behavior:'instant'}));
      await page.waitForSelector('.is-writing-ready');
      assert.equal(await page.locator('.caret-administrator .administrator').getAttribute('data-administrator'), 'rabbit');
      await page.getByRole('textbox', { name: '信件正文' }).fill('新的入口，仍然是同一封信。');

      await page.goto(`${base}#office`);
      const read = page.getByRole('button', { name: 'Read a Letter' });
      await read.scrollIntoViewIfNeeded();
      await read.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      if (name === 'desktop') {
        await read.hover();
        await page.waitForTimeout(650);
        assert.notEqual(await read.locator('.entry-thread').evaluate(element => getComputedStyle(element).transform), 'none');
        await page.screenshot({ path: `${output}/${name}-read-hover.png` });
      }
      await read.click();
      await page.waitForURL('**/#bureau');
      await page.waitForFunction(() => !document.documentElement.dataset.entryTransition);
      assert.equal(await page.locator('.drawer-front').count(), 35);
      if (reducedMotion !== 'reduce') assert.ok((await page.evaluate(() => window.transitionSnapshots)).includes('read'), 'received envelope continuity snapshot succeeds');
      await page.screenshot({ path: `${output}/${name}-read-arrival.png` });
      assert.equal(await page.locator('.archive-arrival').count(), 0, 'entrance envelope does not remain in archive');
      assert.deepEqual(await page.evaluate(() => window.transitionErrors), []);
      assert.deepEqual(errors, []);

      await page.goto(`${base}#administrators`);
      await page.getByRole('button', { name: 'Write a Letter' }).scrollIntoViewIfNeeded();
      if (reducedMotion !== 'reduce') {
        await page.getByRole('button', { name: 'Write a Letter' }).click();
        await page.evaluate(() => { location.hash = 'opening'; });
        await page.waitForTimeout(1200);
        assert.equal(new URL(page.url()).hash, '#opening', 'leaving during pickup cancels its pending navigation');
      }
      console.log(`PASS ${name}: entry layout, pickup, write, read, native continuity, cleanup and accessibility`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
