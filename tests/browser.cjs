const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.mp3':'audio/mpeg'};
const server = http.createServer((req,res)=>{
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  fs.readFile(file,(err,data)=>{res.writeHead(err ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(err ? 'Not found' : data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || undefined,headless:true});
  const errors=[];
  for(const [name,width,height,touch] of [['phone',390,844,true],['small-phone',320,568,true],['landscape',844,390,true],['tablet',768,1024,true],['desktop',1920,1080,false]]) {
    const context = await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
    const page = await context.newPage();
    page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
    await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
    assert(await page.locator('#splashBtn').isVisible());
    const enterBox = await page.locator('#splashBtn').boundingBox();
    assert(enterBox.x >= 0 && enterBox.x + enterBox.width <= width + 1, `${name}: entry overflow`);
    // Exercise entry without fullscreen changing the desktop test viewport.
    await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.resolve();});
    await page.locator('#splashBtn').click();
    await page.waitForSelector('#splash',{state:'detached'});
    const galleryBox = await page.locator('#gallery').boundingBox();
    assert(galleryBox.x >= 0 && galleryBox.x + galleryBox.width <= width + 1, `${name}: gallery overflow`);
    if(process.env.SNAPSHOT_DIR) await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR, `${name}-gallery.png`)});
    await page.locator('.thumb').first().click();
    await page.waitForSelector('.viewer.show');
    for(const side of ['left','right']) {
      for(const index of [2,0,1]) {
        await page.locator(`[data-${side}="${index}"]`).click();
        assert.equal(await page.locator(`[data-${side}="${index}"]`).getAttribute('aria-pressed'),'true');
      }
    }
    await page.evaluate(()=>closeViewer());
    await page.locator('.thumb').nth(1).click();
    await page.waitForSelector('.viewer.show');
    // Hover must not restore the previous scene's quality state.
    await page.locator('[data-left="2"]').hover();
    await page.mouse.move(0,0);
    const state = await page.evaluate(()=>({left:imgLeft.style.backgroundImage,right:imgRight.style.backgroundImage,leftTick:controls.querySelector('[data-left="0"] .box').style.backgroundImage,rightTick:controls.querySelector('[data-right="1"] .box').style.backgroundImage}));
    assert(state.left.includes('/4.webp') && state.right.includes('/5.webp'),`${name}: new scene images`);
    assert(state.leftTick.includes('ticked_box') && state.rightTick.includes('ticked_box'),`${name}: visual selection drift`);
    for(const side of ['left','right']) for(const index of [0,1,2]) {
      await page.locator(`[data-${side}="${index}"]`).click();
      const image = await page.locator(side==='left'?'#imgLeft':'#imgRight').evaluate(el=>el.style.backgroundImage);
      assert(image.includes(`/${4+index}.webp`),`${name}: selected quality image`);
      const box=await page.locator(`[data-${side}="${index}"] .box`).evaluate(el=>el.style.backgroundImage);
      assert(box.includes('ticked_box'),`${name}: selected tick`);
    }
    if(touch) {
      const buttons=await page.locator('#controls .menu-item').all();
      for(const button of buttons) {
        const b=await button.boundingBox();
        assert(b.x>=0 && b.y>=0 && b.x+b.width<=width+1 && b.y+b.height<=height+1,`${name}: quality button outside viewport`);
        assert(b.height>=44,`${name}: touch target too short`);
      }
      const b=await page.locator('#stage').boundingBox();
      await page.evaluate(b=>{
        const t=new Touch({identifier:0,target:stage,clientX:b.x+b.width*.7,clientY:b.y+b.height/2});
        stage.dispatchEvent(new TouchEvent('touchstart',{touches:[t],bubbles:true,cancelable:true}));
        stage.dispatchEvent(new TouchEvent('touchend',{touches:[],bubbles:true}));
      },b);
      const p=await page.evaluate(()=>percent);
      assert(Math.abs(p-.7)<.01,`${name}: touch comparison`);
      await page.locator('#toggleSettings').click();
      assert(!(await page.locator('#controls').isVisible()));
      await page.locator('#toggleSettings').click();
      assert(await page.locator('#controls').isVisible());
    }
    if(process.env.SNAPSHOT_DIR) await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR, `${name}-viewer.png`)});
    if(touch) await page.locator('#backToGallery').click();
    else await page.keyboard.press('Escape');
    assert(!(await page.locator('#viewer').isVisible()));
    await page.locator('#musicToggle').click();
    assert.equal(await page.locator('#musicToggle').getAttribute('aria-label'),'Play music');
    // Simulate out-of-order loads and cancel a pending scene on close.
    await page.evaluate(async()=>{
      const original=preload;
      preload=urls=>new Promise(r=>setTimeout(r,urls[0].endsWith('/1.webp')?80:5));
      await Promise.all([openSet(0),openSet(2)]);
      if(!imgLeft.style.backgroundImage.includes('/7.webp')) throw Error('Stale scene overwrote latest selection');
      const pending=openSet(0);closeViewer();await pending;
      if(viewerEl.classList.contains('show')) throw Error('Closed viewer reopened after pending load');
      preload=original;
    });
    console.log(`${name} ${width}x${height}: PASS`);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
