import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.connectOverCDP(process.env.QA_CDP || 'http://127.0.0.1:9347');
const output = 'ui-preview/selection-scroll';
mkdirSync(output, { recursive: true });

try {
  for (const [name, url] of [
    ['live', 'http://127.0.0.1:5173/'],
    ['embedded', pathToFileURL(resolve('Before-Sending-embedded.html')).href],
  ]) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    try {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.locator('.home-opening-art').evaluate(image => image.decode());
      assert.equal(await page.evaluate(() => scrollY), 0, 'default entry starts at the top of the homepage');
      assert.equal(await page.locator('.home-scroll-stage').count(), 1);
      await page.screenshot({ path: `${output}/${name}-default-home.png` });
      await page.getByRole('button', { name: '走进信件处' }).click();
      await page.waitForFunction(()=>Number(document.querySelector('.home-scroll-stage').dataset.progress)>.99);
      assert.equal(await page.locator('.home-post-background').evaluate(image => getComputedStyle(image).opacity), '0.42');
      assert.ok(await page.locator('.home-animal-lineup').evaluate(lineup => {
        const room = lineup.parentElement.getBoundingClientRect();
        return lineup.getBoundingClientRect().bottom > room.top + room.height * .7;
      }), 'administrators stand in the lower foreground');
      await page.locator('.administrator-choice').nth(2).click();
      await page.locator('.envelope-entrances img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      if (name === 'embedded') assert.ok(await page.locator('.entry-body').first().evaluate(image => image.src.startsWith('data:image/png;base64,')), 'embedded cutouts are bundled, not external file references');
      await page.getByRole('button', { name: 'Write a Letter' }).click();
      await page.waitForURL(url => url.hash === '#write');
      const progress=async p=>{await page.locator('.writing-flow').evaluate((el,p)=>scrollTo({top:(el.offsetHeight-innerHeight)*p,behavior:'instant'}),p);await page.waitForTimeout(180);};
      await progress(.22);
      await page.waitForSelector('.is-writing-ready');
      const editor = page.getByRole('textbox', { name: '信件正文' });
      await editor.fill('从首页走进来，写下这一封信。');
      await progress(.39);
      await page.locator('.writing-flow[data-phase="replay"]').waitFor();
      await progress(.22);
      await page.waitForSelector('.is-writing-ready');
      assert.equal(await editor.inputValue(), '从首页走进来，写下这一封信。');
      await progress(.65);
      await page.locator('.send-preparation').waitFor();
      assert.equal(await page.locator('.flow-mailbox').evaluate(el=>getComputedStyle(el).visibility),'hidden');
      if(name==='embedded')assert(await page.locator('.flow-postage').evaluate(image=>image.src.startsWith('data:image/')));
      await progress(.98);
      await page.locator('.flow-envelope-object').focus();await page.keyboard.press('Enter');
      await page.waitForURL(url=>url.hash==='#waiting');
      await page.goto(`${url}#office`);
      await page.getByRole('button', { name: 'Read a Letter' }).click();
      await page.locator('.cabinet-world').waitFor();
      assert.equal(await page.locator('.archive-arrival').count(), 0);
      assert.equal(await page.locator('.drawer-front').count(), 35);
      assert.deepEqual(errors, []);
      console.log(`PASS ${name}: default homepage, bundled cutouts, both envelope entrances, writing, replay, packing and archive in one app`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
