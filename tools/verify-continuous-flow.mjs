import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9347');
const base=process.env.TEST_URL || 'http://127.0.0.1:5173/';
fs.mkdirSync('ui-preview/continuous-flow',{recursive:true});
try {
  for(const [width,height,reduced] of [[1920,1080,false],[1440,900,false],[390,844,false],[320,568,true]]) {
    const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
    try {
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'#write');
      await page.locator('.desk-scene').evaluate(image=>image.decode());
      const editor=page.getByRole('textbox',{name:'信件正文',includeHidden:true});
      const scroll=async progress=>{
        await page.locator('.writing-flow').evaluate((el,p)=>scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*p,behavior:'instant'}),progress);
        await page.waitForTimeout(180);
      };
      const paper=await page.locator('.writing-flow > .desk-viewport > .living-paper').elementHandle();
      const envelope=await page.locator('.flow-envelope-object').elementHandle();
      assert(await editor.isDisabled());
      for(const p of [0,.04,.08,.12,.16,.22]) {
        await scroll(p);await page.screenshot({path:`ui-preview/continuous-flow/${width}-p${p}.png`});
      }
      assert(await editor.isEnabled());
      const geometry=await paper.boundingBox();
      assert(Math.abs(geometry.x+geometry.width/2-(await page.evaluate(()=>document.documentElement.clientWidth))/2)<2);
      assert(Math.abs(geometry.y+geometry.height/2-height/2)<2);
      await editor.pressSequentially('I thought I had nothing to say.',{delay:5});
      await page.waitForTimeout(200);
      const original=await editor.inputValue();
      assert.equal(await page.getByRole('button',{name:'写完了',exact:true}).count(),0);
      await scroll(.37);
      assert.equal(await page.locator('.writing-flow').getAttribute('data-phase'),'replay');
      assert(await editor.isDisabled());
      await page.waitForTimeout(500);
      const first=Number(await page.getByRole('slider',{name:'书写回放进度'}).inputValue());
      await scroll(.39);await page.waitForTimeout(200);
      assert(Number(await page.getByRole('slider',{name:'书写回放进度'}).inputValue())>=first,'scrolling inside replay does not restart');
      await scroll(.22);assert.equal(await editor.inputValue(),original);
      await editor.press('End');await editor.pressSequentially(' But I am here.',{delay:5});
      await scroll(.39);
      assert(Number(await page.getByRole('slider',{name:'书写回放进度'}).inputValue())<8,'new revision starts fresh replay');
      await scroll(.65);
      assert.equal(await page.locator('.writing-flow').getAttribute('data-phase'),'prepare');
      assert.equal(await page.locator('.flow-mailbox').evaluate(el=>getComputedStyle(el).visibility),'hidden');
      assert.equal(await page.locator('.flow-drop-off').getAttribute('aria-hidden'),'true');
      const rails=page.locator('.object-rail');
      assert(await rails.evaluateAll(els=>els.every(el=>el.scrollWidth>el.clientWidth)),'both selections are truly scrollable');
      for(const rail of await rails.all()) {
        const start=await rail.evaluate(el=>el.scrollLeft);
        const r=await rail.boundingBox();
        await page.mouse.move(r.x+r.width-12,r.y+r.height/2);await page.mouse.down();
        await page.mouse.move(r.x+12,r.y+r.height/2,{steps:12});await page.mouse.up();
        await page.waitForTimeout(180);
        assert(await rail.evaluate(el=>el.scrollLeft)>start,'mouse horizontal dragging');
      }
      await page.getByRole('button',{name:'浅粉信封',exact:true}).click();
      await page.getByRole('button',{name:'花枝',exact:true}).click();
      await page.getByRole('button',{name:'Email',exact:true}).click();
      await page.getByRole('textbox',{name:'寄送收件信息'}).fill('a@example.com');
      await page.getByRole('button',{name:'Address',exact:true}).click();
      await page.getByRole('textbox',{name:'寄送收件信息'}).fill('Guiyang');
      await page.getByRole('button',{name:'Name only',exact:true}).click();
      await page.getByRole('textbox',{name:'寄送收件信息'}).fill('Lin');
      await page.getByRole('button',{name:'一小时后',exact:true}).click();
      await page.screenshot({path:`ui-preview/continuous-flow/${width}-prepare.png`});
      const transform=[];
      for(const p of [.75,.77,.8,.82,.86,.875,.89,.94,.98]) {
        await scroll(p);
        transform.push(await page.locator('.flow-envelope-position').getAttribute('style'));
        await page.screenshot({path:`ui-preview/continuous-flow/${width}-p${p}.png`});
      }
      assert(new Set(transform).size>=4);
      assert(await envelope.evaluate(el=>el===document.querySelector('.flow-envelope-object')),'same envelope DOM');
      assert(await paper.evaluate(el=>el===document.querySelector('.writing-flow .living-paper')),'same paper DOM');
      assert.equal(await page.locator('.flow-envelope-position').getAttribute('data-envelope-kind'),'wine');
      assert.match(await page.locator('.flow-postage').getAttribute('src'),/flowers/);
      assert.equal(await page.locator('.flow-address').innerText(),'Lin');
      assert.equal(new URL(page.url()).hash,'#write');
      assert.equal(await page.locator('.flow-mailbox').evaluate(el=>getComputedStyle(el).visibility),'visible');
      assert.equal(await page.locator('.flow-envelope-object').getAttribute('data-sending'),'false','scrolling alone never sends');
      for(const p of [.65,.22,0,.98])await scroll(p);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'no horizontal overflow');
      if(width===1920) {
        const e=await envelope.boundingBox(),m=await page.locator('.flow-mailbox').boundingBox();
        await page.mouse.move(e.x+e.width/2,e.y+e.height/2);await page.mouse.down();
        await page.mouse.move(m.x+m.width/2,m.y+m.height*.37,{steps:24});await page.mouse.up();
      } else { await page.locator('.flow-envelope-object').focus();await page.keyboard.press('Enter'); }
      await page.waitForURL('**/#waiting');
      const sent=await page.evaluate(()=>JSON.parse(localStorage.getItem('before-sending-letter-v3')));
      assert.equal(sent.deliveryRecipient,'Lin');assert.equal(sent.stampId,'flowers');assert.equal(sent.envelopeKind,'wine');
      assert.equal(sent.scheduledDeliveryAt-sent.sentAt,3600000);
      assert.equal(sent.events.filter(event=>event.type==='send').length,1);
      assert.equal(sent.finalText,original+' But I am here.');
      assert.deepEqual(errors,[]);
      console.log(`PASS ${width}x${height}: scroll phases, actual typing/replay/revision, independent preparation, draggable rails, fold/stamp/drop continuity, reverse, real send, no errors`);
    }finally{await context.close();}
  }
}finally{await browser.close();}
