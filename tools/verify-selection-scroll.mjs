import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.connectOverCDP(process.env.QA_CDP || 'http://127.0.0.1:9347');
const base = 'http://127.0.0.1:5173/';
const output = 'ui-preview/selection-scroll';
const failures = [];
mkdirSync(output, { recursive: true });

async function inspectBackground(page) {
  const image = page.locator('.post-office-backdrop');
  await image.evaluate(element => element.decode());
  assert.equal(await image.getAttribute('src'), '/assets/administrators/post-office-facade.png');
  assert.equal(await image.evaluate(element => element.naturalWidth), 1376);
  assert.equal(await page.locator('img[src="/assets/demo-cutouts/reader-room-bg.jpg"]').count(), 0);
}

async function inspectLayout(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
  assert.equal(await page.locator('main main').count(), 0, 'no nested main landmarks');
  assert.ok(await page.locator('.administrator-choice').evaluateAll(elements => elements.every(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth;
  })), 'all choices fit the screen');
}

try {
  for (const [name, width, height, reducedMotion] of [
    ['desktop', 1400, 900, 'no-preference'],
    ['mobile', 390, 844, 'reduce'],
    ['tablet', 820, 1180, 'no-preference'],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: width < 900 });
    try {
      const page = await context.newPage();
      page.on('pageerror', error => failures.push(error.message));
      await page.goto(`${base}#administrators`);
      await inspectBackground(page);
      assert.equal(await page.locator('.living-writing').count(), 0, 'choose an administrator before writing');
      await page.screenshot({ path: `${output}/${name}-before.png`, fullPage: true });
      await page.locator('.administrator-choice').nth(2).click();
      await page.waitForSelector('.living-writing');
      assert.equal(await page.getByRole('button', { name: /一起进去/ }).count(), 0);
      assert.equal(new URL(page.url()).hash, '#administrators', 'selection does not send the user to a new page');
      assert.ok(await page.evaluate(() => document.activeElement.matches('.administrator-choice')), 'selection keeps focus; no forced keyboard or scroll');
      assert.ok(await page.evaluate(() => document.querySelector('.living-writing').getBoundingClientRect().top >= document.querySelector('.administrator-room-inner').getBoundingClientRect().bottom), 'writing immediately follows the selector');
      await inspectLayout(page);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${output}/${name}-selected.png`, fullPage: true });

      await page.locator('.living-writing').scrollIntoViewIfNeeded();
      const editor = page.getByRole('textbox', { name: '信件正文' });
      await editor.fill('今天，我想给你写一封信。');
      assert.equal(await page.locator('.caret-administrator .administrator').getAttribute('data-administrator'), 'rabbit');
      await page.getByRole('textbox', { name: '收信人' }).fill('远方的你');
      await page.screenshot({ path: `${output}/${name}-writing.png` });

      await page.locator('.administrator-choice').nth(1).click();
      assert.equal(await editor.inputValue(), '今天，我想给你写一封信。', 'changing administrator retains the draft');
      assert.equal(await page.locator('.caret-administrator .administrator').getAttribute('data-administrator'), 'cat');
      await page.locator('.living-writing').scrollIntoViewIfNeeded();
      await editor.fill('今天，我想给你写一封信。多写一句。');
      await page.getByRole('button', { name: '撤回一笔', exact: true }).click();
      assert.equal(await editor.inputValue(), '今天，我想给你写一封信。', 'embedded writer keeps its undo behavior');

      await page.goto(`${base}#office`);
      await inspectBackground(page);
      await page.screenshot({ path: `${output}/${name}-office.png`, fullPage: true });
      await page.getByRole('button', { name: 'Write a Letter' }).click();
      await page.waitForSelector('.living-writing');
      assert.equal(await page.getByRole('textbox', { name: '信件正文' }).inputValue(), '今天，我想给你写一封信。');
      assert.equal(await page.getByRole('textbox', { name: '收信人' }).inputValue(), '远方的你');

      await page.goto(`${base}#opening`);
      await page.getByRole('button', { name: '走进信件处' }).click();
      await page.waitForTimeout(1200);
      await page.locator('.administrator-choice').first().click();
      await page.waitForSelector('.living-writing');
      await page.locator('.living-writing').scrollIntoViewIfNeeded();
      assert.equal(await page.getByRole('textbox', { name: '信件正文' }).inputValue(), '今天，我想给你写一封信。');
      await inspectLayout(page);
      console.log(`PASS ${name}: original background, select + scroll, preserved draft, undo, office and homepage flows`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(failures, [], 'no browser runtime errors');
  console.log('PASS no browser runtime errors');
} finally {
  await browser.close();
}
