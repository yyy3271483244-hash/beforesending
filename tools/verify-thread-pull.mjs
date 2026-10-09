import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
const context=await browser.newContext({viewport:{width:1400,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('before-sending-letter-v3')));
try {
  await page.goto('http://127.0.0.1:5173/#write');
  await page.locator('.writing-desk').evaluate(el=>scrollTo({top:(el.offsetHeight-innerHeight)*.22,behavior:'instant'}));
  await page.waitForSelector('.is-writing-ready');
  const editor=page.locator('textarea');
  await editor.fill('第一行：其实我那天一直在等你。\n第二行：这句话暂时不能说。\n最后：秘密只留在这里。');
  for(const text of ['其实我那天一直在等你','这句话暂时不能说','秘密只留在这里']) {
    await editor.evaluate((el,text)=>{const start=el.value.indexOf(text);el.setSelectionRange(start,start+text.length);},text);
    await editor.press('Backspace');
  }
  const original=await draft();
  assert.equal(original.fragments.length,3);
  assert.equal(new Set(original.fragments.map(f=>f.threadId)).size,3);
  assert(original.fragments.every(f=>f.originalRange.length===2&&f.paragraphId&&f.anchorPosition&&f.timestamp));
  assert.equal(await page.locator('.thread-tail-anchor').count(),3);
  assert.equal(await page.locator('.thread-reveal-strip').count(),0);
  await page.locator('.corner-right').focus();await page.keyboard.press('Enter');await page.waitForTimeout(900);
  await page.locator('.backside-scrap').filter({hasText:'秘密只留在这里'}).getByRole('button').click();
  assert(!JSON.stringify(await draft()).includes('秘密只留在这里'));
  await page.goto('http://127.0.0.1:5173/#reading');
  await page.waitForSelector('.thread-tail-anchor');
  const stored=JSON.stringify(await draft());
  const first=page.locator(`[data-thread-id="${original.fragments[0].threadId}"]`);
  const second=page.locator(`[data-thread-id="${original.fragments[1].threadId}"]`);
  const hidden=page.locator(`[data-thread-id="${original.fragments[2].threadId}"]`);
  const firstStrip=page.locator(`.thread-reveal-strip[data-fragment-id="${original.fragments[0].id}"]`);
  const secondStrip=page.locator(`.thread-reveal-strip[data-fragment-id="${original.fragments[1].id}"]`);
  async function start(locator) {
    const bounds=await locator.locator('button').boundingBox();
    const x=bounds.x+23,y=bounds.y+20;
    await page.mouse.move(x,y);await page.mouse.down();return{x,y};
  }
  await first.hover();assert.equal(await page.locator('.thread-reveal-strip').count(),0);
  assert.equal(await first.locator('button').evaluate(el=>getComputedStyle(el).cursor),'grab');
  let origin=await start(first);
  await page.mouse.move(origin.x+30,origin.y,{steps:4});await page.mouse.up();await page.waitForTimeout(500);
  assert.equal(Number(await first.getAttribute('data-pull-progress')),0);
  origin=await start(first);
  for(const distance of [20,50,80,120,150]) {
    await page.mouse.move(origin.x+distance*.8,origin.y+distance*.6,{steps:4});
    const p=Number(await first.getAttribute('data-pull-progress'));
    assert(Math.abs(p-distance/150)<.015);
    assert.equal(Number(await second.getAttribute('data-pull-progress')),0);
    assert.equal(await firstStrip.textContent(),original.fragments[0].content);
  }
  await page.mouse.up();await page.waitForTimeout(500);
  assert.equal(await first.locator('button').getAttribute('aria-expanded'),'true');
  assert.equal(Number(await first.getAttribute('data-pull-progress')),1);
  assert.equal(await firstStrip.evaluate(el=>getComputedStyle(el).clipPath),'inset(0% 0px 0px)');
  origin=await start(second);
  await page.mouse.move(origin.x+120,origin.y,{steps:10});await page.mouse.up();await page.waitForTimeout(500);
  assert.equal(await second.locator('button').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('.thread-reveal-strip').count(),2);
  assert.equal(await secondStrip.textContent(),original.fragments[1].content);
  await page.screenshot({path:'ui-preview/desk-archive/two-pulled-fragments.png'});
  origin=await start(hidden);
  await page.mouse.move(origin.x+140,origin.y,{steps:10});
  assert(Number(await hidden.getAttribute('data-pull-progress'))<=.04);
  assert.equal(await hidden.locator('.thread-reveal-strip').count(),0);
  await page.mouse.up();await page.waitForTimeout(500);
  await first.locator('button').click();await page.waitForTimeout(500);
  assert.equal(Number(await first.getAttribute('data-pull-progress')),0);
  await first.locator('button').focus();await page.keyboard.down('Space');await page.waitForTimeout(1250);await page.keyboard.up('Space');await page.waitForTimeout(500);
  assert.equal(await first.locator('button').getAttribute('aria-expanded'),'true');
  assert.equal(JSON.stringify(await draft()),stored,'reader gestures must never be persisted');
  assert.deepEqual(errors,[]);
  console.log('PASS real deletion metadata, original anchors, distance-controlled reveal, partial return, full latch, independent threads, permanent hide, click retract, keyboard hold, reading privacy');
} finally {await context.close();await browser.close();}
