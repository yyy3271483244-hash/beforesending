import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
fs.mkdirSync('ui-preview/home-stage',{recursive:true});
try {
  for(const [width,height,quiet] of [[1920,1080,false],[1440,900,false],[390,844,false],[320,568,true]]) {
    const context=await browser.newContext({viewport:{width,height},reducedMotion:quiet?'reduce':'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/');
    await page.locator('.home-scroll-stage img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    const state=()=>page.locator('.home-scroll-stage').evaluate(el=>({
      p:Number(el.dataset.progress),y:el.getBoundingClientRect().top,h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width,
      cast:[...el.querySelectorAll('.home-cast-object')].map(node=>getComputedStyle(node).transform),
      opening:getComputedStyle(el.querySelector('.home-opening-layer')).opacity,
      post:getComputedStyle(el.querySelector('.home-post-layer')).opacity,
    }));
    const initial=await state();
    await page.waitForTimeout(650);
    assert.deepEqual(await state(),initial,'no autoplay');
    for(const p of [0,.25,.4,.5,.65,.75,1,.75,.5,.25,0,1,0,1]) {
      await page.evaluate(p=>scrollTo({top:innerHeight*3*p,behavior:'instant'}),p);
      await page.waitForTimeout(160);
      const actual=await state();
      assert(Math.abs(actual.p-p)<.01,`${width}: ${actual.p} at ${p}`);
      assert(Math.abs(actual.y)<1,'stage stays pinned');
      assert.equal(actual.w,await page.evaluate(()=>document.documentElement.clientWidth));
      assert.equal(actual.h,height);
      assert.equal(await page.locator('.home-scroll-page section').count(),0,'no stacked scene sections');
      assert.equal(new URL(page.url()).hash,'','scroll never changes route');
      if(p===0)assert.deepEqual(actual,initial,'reverse restores every layer');
      if([0,.4,.65,1].includes(p))await page.screenshot({path:`ui-preview/home-stage/${width}-${p}.png`});
    }
    const animals=page.locator('.home-animal-choice .administrator-choice');
    assert.equal(await animals.count(),4);
    assert(await animals.evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})));
    await animals.nth(2).click();
    assert.equal(new URL(page.url()).hash,'');
    assert.equal(await animals.nth(2).getAttribute('aria-pressed'),'true');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
    await page.getByRole('button',{name:'走进信件处'}).click();
    await page.waitForFunction(()=>Number(document.querySelector('.home-scroll-stage').dataset.progress)>.99);
    await page.getByRole('button',{name:'Read a Letter'}).click();
    await page.waitForURL('**/#bureau');
    assert.equal(await page.locator('.archive-arrival').count(),0);
    assert.equal(await page.locator('.home-scroll-stage').count(),0);
    assert.equal(await page.locator('.pin-spacer').count(),0,'pin is cleaned on navigation');
    assert.deepEqual(errors,[]);
    // Every viewport corner is rendered from the same paper field, not empty container gutters.
    const {data,info}=await sharp(`ui-preview/home-stage/${width}-0.png`).removeAlpha().raw().toBuffer({resolveWithObject:true});
    for(const x of [5,info.width-22]) {
      const p=(Math.floor(info.height/2)*info.width+x)*3;
      assert(data[p]>200 && data[p+1]>190 && data[p+2]>180);
      assert(data[p]<255 || data[p+1]<255 || data[p+2]<255);
    }
    console.log(`PASS ${width}x${height}: full stage, 14 progress/reversal checks, one route, choice, entry, pin cleanup, no runtime errors`);
    await context.close();
  }
}finally{await browser.close();}
