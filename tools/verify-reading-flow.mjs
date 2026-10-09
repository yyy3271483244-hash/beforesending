import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
const base=process.env.QA_URL||'http://127.0.0.1:5173/';
fs.mkdirSync('ui-preview/reading-flow',{recursive:true});
try {
  for(const [width,height,quiet] of [[1920,1080,false],[1440,900,false],[390,844,false],[320,568,true]]) {
    const context=await browser.newContext({viewport:{width,height},reducedMotion:quiet?'reduce':'no-preference'});
    try {
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base);
      await page.getByRole('button',{name:'走进信件处'}).click();
      await page.waitForFunction(()=>Number(document.querySelector('.home-scroll-stage').dataset.progress)>.99);
      assert.equal(await page.locator('.post-office-choices').getAttribute('data-scene-state'),'administrator');
      assert.equal(await page.getByRole('button',{name:'Read a Letter',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Write a Letter',exact:true}).count(),0);
      await page.screenshot({path:`ui-preview/reading-flow/${width}-choose-administrator.png`});
      await page.locator('[data-choice="cat"] .administrator-choice').click();
      await page.waitForSelector('.post-office-choices[data-scene-state="actionChoice"]');
      assert.equal(await page.getByRole('heading',{name:'你想从哪里开始？'}).count(),1);
      assert.equal(await page.locator('.home-animal-choice').evaluateAll(els=>els.filter(el=>getComputedStyle(el).visibility==='visible').length),1);
      await page.screenshot({path:`ui-preview/reading-flow/${width}-choose-action.png`});
      await page.getByRole('button',{name:'Read a Letter',exact:true}).click();
      await page.waitForSelector('.reading-scroll-flow[data-phase="archive"]');
      await page.waitForTimeout(800);
      const scroll=async units=>{await page.evaluate(u=>scrollTo({top:innerHeight*u,behavior:'instant'}),units);await page.waitForTimeout(180);};
      const cabinet=page.locator('.cabinet-painting');
      const c=await cabinet.boundingBox(),client=await page.evaluate(()=>document.documentElement.clientWidth);
      assert(c.x<=0 && c.x+c.width>=client,'cabinet covers both edges');
      assert(c.y<=1 && c.y+c.height>=height-1,'cabinet covers viewport height');
      await page.screenshot({path:`ui-preview/reading-flow/${width}-archive.png`});
      await page.locator('.drawer-front').nth(17).click();await page.waitForTimeout(850);
      const envelopes=page.locator('.painted-drawer.is-open .file-envelope');
      assert.equal(await envelopes.count(),3);assert.deepEqual(await envelopes.allTextContents(),['','','']);
      await envelopes.nth(1).focus();const id=await envelopes.nth(1).getAttribute('data-letter-id');
      assert.equal(await page.locator('.archive-preview').getAttribute('data-letter-id'),id);
      await envelopes.nth(1).press('Enter');
      await page.waitForSelector('.reading-scroll-flow[data-phase="reading"]');
      await page.waitForTimeout(450);
      const beforeWheel=await page.evaluate(()=>scrollY);
      await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,-180);await page.waitForTimeout(200);
      assert(await page.evaluate(()=>scrollY)<beforeWheel-80,'native upward wheel reverses the scene');
      await scroll(3.2);
      const paper=await page.locator('.is-flow-reading .living-paper').elementHandle();
      const paperRect=await page.locator('.is-flow-reading .living-paper').boundingBox();
      for(const item of await page.locator('.reading-flow-header button,.reading-flow-header h1').all()){
        const rect=await item.boundingBox();
        if(rect)assert(rect.y+rect.height<paperRect.y,'header content does not overlap the reading paper');
      }
      assert.equal(await page.locator('.living-reading').getAttribute('data-letter-id'),id);
      assert.equal(new URL(page.url()).hash,'#bureau','no route navigation from archive to reading');
      await page.screenshot({path:`ui-preview/reading-flow/${width}-reading.png`});
      const poses=[];
      for(const units of [3.2,2.85,2.5,2.15,1.85,1.52,1.2]) {
        await scroll(units);
        poses.push(await page.locator('.reading-flow-envelope').getAttribute('style'));
        if([2.85,2.5,1.85,1.2].includes(units))await page.screenshot({path:`ui-preview/reading-flow/${width}-return-${units}.png`});
        assert.equal(new URL(page.url()).hash,'#bureau');
      }
      assert(new Set(poses).size>=4,'return is continuous');
      assert.equal(await page.locator('.painted-drawer.is-open').count(),1);
      assert.equal(await page.locator('.painted-drawer.is-open .file-envelope.is-taken').count(),0);
      assert.equal(await page.locator('.reading-scroll-flow').getAttribute('data-phase'),'archive');
      for(const units of [.8,.5,.2,0])await scroll(units);
      assert.equal(await page.locator('.post-office-choices').getAttribute('data-scene-state'),'actionChoice');
      assert.equal(await page.locator('.post-office-choices [data-choice="cat"]').evaluate(el=>getComputedStyle(el).visibility),'visible');
      assert.equal(await page.getByRole('button',{name:'Read a Letter',exact:true}).count(),1);
      await page.screenshot({path:`ui-preview/reading-flow/${width}-returned-to-choice.png`});
      for(const units of [1.2,2.2,3.2,1.2,3.2])await scroll(units);
      assert(await paper.evaluate(el=>el===document.querySelector('.is-flow-reading .living-paper')),'same letter DOM survives both directions');
      assert.equal(await page.locator('.reading-scroll-flow').getAttribute('data-selected-letter'),id);
      await scroll(1.2);await envelopes.nth(2).focus();const next=await envelopes.nth(2).getAttribute('data-letter-id');await envelopes.nth(2).press('Enter');
      await page.waitForSelector('.reading-scroll-flow[data-phase="reading"]');
      assert.equal(await page.locator('.living-reading').getAttribute('data-letter-id'),next);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
      assert.deepEqual(errors,[]);
      console.log(`PASS ${width}x${height}: staged administrator/action choice, cover wall, 3 envelopes, click pickup, scrub return to same open drawer and selected cat, repeated reverse, new letter, no route jumps/errors`);
    }finally{await context.close();}
  }
}finally{await browser.close();}
