import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.connectOverCDP('http://127.0.0.1:9347');
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? {width:390,height:844} : {width:1400,height:900}, hasTouch:mobile });
    await context.addInitScript(() => {
      window.transitionErrors = [];
      const start = document.startViewTransition?.bind(document);
      if (start) document.startViewTransition = action => {
        const transition = start(action);
        transition.ready.catch(error => window.transitionErrors.push(error.message));
        return transition;
      };
    });
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/#bureau');
    await page.locator('.drawer-front').nth(17).click();
    await page.waitForTimeout(900);
    const envelopes = page.locator('.is-open .file-envelope');
    for (let i=0; i<3; i++) {
      const bounds = await envelopes.nth(i).boundingBox();
      await page.mouse.move(bounds.x+9, bounds.y+12);
      await page.waitForTimeout(650);
      assert.equal(await page.locator('.archive-preview').getAttribute('data-letter-id'), await envelopes.nth(i).getAttribute('data-letter-id'));
      assert.equal(await page.locator('.archive-flight').count(), 0);
    }
    await page.mouse.move(30,30);
    assert.equal(await page.locator('.archive-preview').count(),0);
    const first = await envelopes.first().boundingBox();
    await page.mouse.click(first.x+9, first.y+12);
    await page.waitForSelector('.archive-flight');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(3300);
    assert(page.url().endsWith('#bureau'));
    assert.equal(await page.locator('.archive-flight').count(),0);
    assert.equal(await page.locator('.is-open .file-envelope:not(.is-taken)').count(),3);
    const third = envelopes.nth(2);
    const id = await third.getAttribute('data-letter-id');
    if (mobile) {
      const b = await third.boundingBox();
      await page.touchscreen.tap(b.x+b.width*.6, b.y+12);
    } else await third.click({position:{x:35,y:12}});
    await page.waitForSelector('.living-reading'); await page.waitForTimeout(1000);
    assert.equal(await page.locator('.living-reading').getAttribute('data-letter-id'),id);
    assert((await page.locator('.living-reading .letter-front').evaluate(el => getComputedStyle(el).backgroundImage)).includes('writing-desk/reading-paper.png'));
    assert.equal(await page.locator('.reading-cabinet-backdrop').evaluate(el => getComputedStyle(el).opacity),'0.24');
    await page.screenshot({path:`ui-preview/desk-archive/reading-${mobile?'mobile':'desktop'}.png`});
    assert.equal(await page.locator('.archive-arrival').count(),0);
    assert.deepEqual(await page.evaluate(()=>window.transitionErrors),[]);
    assert.deepEqual(errors,[]);
    console.log(`PASS ${mobile?'touch':'mouse'}: reachable hover previews, cancel pickup, identity continuity, new paper, pale cabinet, no transition errors`);
    await context.close();
  }
} finally { await browser.close(); }
