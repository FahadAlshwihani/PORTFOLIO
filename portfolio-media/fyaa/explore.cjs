const {chromium}=require('C:/Users/DELL/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs');
const path=require('path');
(async()=>{
 const out=path.join(__dirname,'inspection'); fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'C:/Users/DELL/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await p.goto('https://fyaa.io/',{waitUntil:'networkidle'}); await p.waitForTimeout(6000);
 await p.screenshot({path:path.join(out,'hero.png')});
 console.log('SECTIONS',await p.locator('section').evaluateAll(es=>es.map(e=>({id:e.id,y:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight}))));
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(1200); await p.screenshot({path:path.join(out,'menu.png')});
 await p.locator('a[href$=\"#about\"]').click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'about.png')});
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(800); await p.locator('a[href$=\"#experience\"]').click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'experience.png')});
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(800); await p.locator('a[href$=\"#projects\"]').click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'projects.png')});
 await p.getByRole('button',{name:'Open folder',exact:true}).click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'folder.png')});
 await p.getByRole('button',{name:'AARC',exact:true}).click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'aarc.png')});
 await p.getByRole('button',{name:'Close',exact:true}).click(); await p.waitForTimeout(800);
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(800); await p.locator('a[href$=\"#skills\"]').click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'skills.png')});
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(800); await p.locator('a[href$=\"#contact\"]').click(); await p.waitForTimeout(1800);
 console.log('FORM_COUNT',await p.locator('form').count()); console.log('CONTACT_LINK_TYPES',await p.locator('#contact a').evaluateAll(es=>es.map(e=>(e.getAttribute('href')||'').split(':')[0])));
 await p.setViewportSize({width:390,height:844}); await p.goto('https://fyaa.io/',{waitUntil:'networkidle'}); await p.waitForTimeout(2500); await p.screenshot({path:path.join(out,'mobile.png')});
 await p.getByRole('button',{name:'Open menu',exact:true}).click(); await p.waitForTimeout(1200); await p.screenshot({path:path.join(out,'mobile-menu.png')});
 await p.getByRole('button',{name:'Close menu',exact:true}).click(); await p.getByRole('button',{name:'Language — Switch to Arabic',exact:true}).click(); await p.waitForTimeout(1800); await p.screenshot({path:path.join(out,'arabic.png')});
 console.log('BROKEN_IMAGES',await p.locator('img').evaluateAll(es=>es.filter(e=>e.complete&&!e.naturalWidth).map(e=>e.alt)));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});


