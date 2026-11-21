// Pexels video araması (stok.py çağırır): görünür ayrı Chromium (Playwright'ın kendi tarayıcısı, .cache/stok-profil).
// Kullanım: node pipeline/stok_ara.mjs <url> <n>   -> stdout JSON [{h, i}] (video bağlantısı + küçük resim)
// Bot doğrulaması çıkarsa açılan pencerede kullanıcı kutuya tıklar; 3 dk beklenir.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [url, nArg] = process.argv.slice(2), n = Number(nArg || 24);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = await chromium.launchPersistentContext(path.join(ROOT, '.cache/stok-profil'), { headless: false, viewport: { width: 1280, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
const grab = () => page.evaluate(() => ({ t: document.title, v: [...document.querySelectorAll("a[href*='/video/']")]
  .map(a => ({ h: a.getAttribute('href'), i: (a.querySelector('img') || {}).src || null })) }));
const found = new Map(), add = v => v.forEach(x => { if (x.h && !found.has(x.h)) found.set(x.h, x); });
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  let warned = false;
  for (let w = 0; w < 180; w += 2) {
    await page.waitForTimeout(2000);
    const d = await grab().catch(() => ({ t: '', v: [] }));
    if (d.v.length) { add(d.v); break; }
    if (!warned && /bir dakika|just a moment|attention/i.test(d.t)) { console.error('bot doğrulaması: açılan pencerede kutuya tıkla, kendiliğinden devam edeceğim'); warned = true; }
  }
  for (let k = 0; k < 8 && found.size < n; k++) { await page.mouse.wheel(0, 2500); await page.waitForTimeout(1500); add((await grab()).v); }
} finally { await ctx.close(); }
process.stdout.write(JSON.stringify([...found.values()].slice(0, n)));
