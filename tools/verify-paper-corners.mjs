import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
fs.mkdirSync('ui-preview/paper-corners',{recursive:true});
try {
  for(const touch of [false,true]) {
    const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1440,height:900},hasTouch:touch});
    try {
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:5173/#write');
      await page.locator('.writing-flow').evaluate(el=>scrollTo({top:(el.offsetHeight-innerHeight)*.22,behavior:'instant'}));
      await page.waitForSelector('.is-writing-ready');
      await page.locator('textarea').fill('开头。其实我一直在等你。结尾。');
      await page.locator('textarea').evaluate(el=>el.setSelectionRange(3,12));
      await page.locator('textarea').press('Backspace');
      const before=await page.evaluate(()=>localStorage.getItem('before-sending-letter-v3'));
      const cdp=touch?await context.newCDPSession(page):null;
      let origin;
      const begin=async side=>{
        const r=await page.locator(`.corner-${side}`).boundingBox();
        origin={x:r.x+r.width/2,y:r.y+r.height/2,side};
        if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:origin.x,y:origin.y}]});
        else {await page.mouse.move(origin.x,origin.y);await page.mouse.down();}
      };
      const move=async fraction=>{
        const required=await page.locator('.tactile-paper').evaluate(el=>Math.min(300,el.clientWidth*.65));
        const point={x:origin.x+(origin.side==='left'?1:-1)*required*fraction*.6,y:origin.y-required*fraction*.4/.75};
        if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]});
        else await page.mouse.move(point.x,point.y,{steps:6});
        await page.waitForTimeout(50);
      };
      const end=async(cancel=false)=>{if(touch)await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});else await page.mouse.up();await page.waitForTimeout(750);};
      const progress=async()=>Number(await page.locator('.tactile-paper').getAttribute('data-flip-progress'));
      for(const route of ['write','reading']) {
        if(route==='reading')await page.goto('http://127.0.0.1:5173/#reading');
        await begin('right');await move(.25);assert(Math.abs(await progress()-.25)<.02);await end();assert.equal(await progress(),0);
        await begin('left');
        for(const fraction of [.25,.5,.75]) {await move(fraction);assert(Math.abs(await progress()-fraction)<.02);await page.screenshot({path:`ui-preview/paper-corners/${touch?'touch':'mouse'}-${route}-${fraction}.png`});}
        assert.equal(await page.locator('.tactile-paper').evaluate(el=>getComputedStyle(el).transform),'none');
        await end();assert.equal(await progress(),1);
        assert.equal(await page.locator('.backside-residue p').textContent(),'其实我一直在等你。');
        const style=await page.locator('.backside-residue').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,shadow:getComputedStyle(el).boxShadow}));
        assert.equal(style.bg,'rgba(0, 0, 0, 0)');assert.equal(style.shadow,'none');
        await page.screenshot({path:`ui-preview/paper-corners/${touch?'touch':'mouse'}-${route}-back.png`});
        await begin('right');await move(.8);await end();assert.equal(await progress(),0);
      }
      const tail=page.locator('.thread-tail-anchor').first();
      const r=await tail.locator('button').boundingBox();
      if(touch){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+22,y:r.y+20}]});
        for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+22+i*10,y:r.y+20}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForTimeout(500);assert.equal(await tail.locator('button').getAttribute('aria-expanded'),'true');
      }
      assert.equal(await page.evaluate(()=>localStorage.getItem('before-sending-letter-v3')),before,'reader gestures never write data');
      assert.deepEqual(errors,[]);
      console.log(`PASS ${touch?'touch':'mouse'}: both corners, 25/50/75% progress, short return, full flip, reverse, plain-paper backside, shared fragment data, privacy${touch?', real touch thread drag':''}`);
    }finally{await context.close();}
  }
}finally{await browser.close();}
