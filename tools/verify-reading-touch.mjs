import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
const base=process.env.QA_URL||'http://127.0.0.1:5173/';
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
try {
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const cdp=await context.newCDPSession(page);
  const swipe=async(x,y,dx,dy)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=20;i++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/20,y:y+dy*i/20}]});
      await page.waitForTimeout(30);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(200);
  };
  await page.goto(`${base}#reading/archive-02`);
  await page.waitForSelector('.reading-scroll-flow[data-phase="reading"]');
  await page.waitForTimeout(500);
  const initial=await page.evaluate(()=>scrollY);
  await swipe(195,260,0,290);
  assert(await page.evaluate(()=>scrollY)<initial-200,'touch swipe reverses reading');
  for(let i=0;i<9&&await page.evaluate(()=>scrollY>innerHeight*1.3);i++)await swipe(195,230,0,290);
  await page.waitForSelector('.reading-scroll-flow[data-phase="archive"]');
  assert.equal(await page.locator('.painted-drawer.is-open').count(),1,'same drawer stays open');
  assert.equal(await page.locator('.file-envelope.is-taken').count(),0,'letter returned');
  await page.evaluate(()=>scrollTo({top:innerHeight*1.2,behavior:'instant'}));
  await page.waitForTimeout(200);
  const before=await page.evaluate(()=>scrollY);
  await swipe(195,230,0,280);
  assert(await page.evaluate(()=>scrollY)<before-180,'drawer front allows native vertical scroll');
  for(let i=0;i<5&&await page.evaluate(()=>scrollY>5);i++)await swipe(195,230,0,280);
  await page.waitForSelector('.reading-scroll-flow[data-phase="actionChoice"]');
  assert.equal(await page.getByRole('button',{name:'Read a Letter',exact:true}).count(),1);
  await page.getByRole('button',{name:'Read a Letter',exact:true}).tap();
  await page.waitForSelector('.reading-scroll-flow[data-phase="archive"]');
  await page.waitForTimeout(1000);
  const view=page.locator('.cabinet-viewport');
  const left=await view.evaluate(el=>el.scrollLeft);
  await swipe(285,420,-220,0);
  assert(Math.abs(await view.evaluate(el=>el.scrollLeft)-left)>100,'horizontal cabinet pan remains available');
  const front=page.locator('.drawer-front').nth(17);
  await front.scrollIntoViewIfNeeded();
  const expanded=await front.getAttribute('aria-expanded');
  await front.tap();await page.waitForTimeout(850);
  assert.notEqual(await front.getAttribute('aria-expanded'),expanded,'tap still toggles drawer');
  assert.deepEqual(errors,[]);
  console.log('PASS touch: reading return, same open drawer, native vertical scene scroll, retained action choice, horizontal cabinet pan, tap to open');
}finally{await context.close();await browser.close();}
