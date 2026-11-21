// Proje kompozisyonunu kare kare render eder. Format: --fmt 9x16 (varsayılan) | 1x1 | 16x9
//   node comp/render.mjs projects/<slug> stills 0.5,2.2,9.95 [--fmt F]  -> <çıktı>/qa/t_<t>.png
//   node comp/render.mjs projects/<slug> video [işçi] [--fmt F]          -> <çıktı>/video_noaudio.mp4
//   node comp/render.mjs projects/<slug> sheet [adım=0.5] [--fmt F]      -> <çıktı>/qa/sheet_*.jpg (kontak sayfaları)
//   node comp/render.mjs projects/<slug> safecheck [--fmt F]             -> güvenli alan denetimi
//   node comp/render.mjs projects/<slug> fsheet 1,5.5,12                 -> work/qa/fsheet.jpg (formatlar yan yana)
// <çıktı> = 9x16 için work/ (eski yollar), diğerleri için work/fmt/<id>/
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));   // fileURLToPath: klasör adında 'ö' (yüzde kodlama) olsa da çalışır
const argv = process.argv.slice(2), fi = argv.indexOf('--fmt');
const FMT = fi >= 0 ? argv.splice(fi, 2)[1] : '9x16';
const [projArg, mode = 'stills', arg = '', a2, a3] = argv;
if (!projArg) { console.error('kullanım: node comp/render.mjs projects/<slug> stills|video|sheet ...'); process.exit(1); }
const P = path.resolve(ROOT, projArg), WORK = path.join(P, 'work');
const FORMATS = JSON.parse(readFileSync(path.join(ROOT, 'comp/formats.json'), 'utf8'));
if (!FORMATS[FMT]) { console.error('bilinmeyen format: ' + FMT); process.exit(1); }
const FMTD = FORMATS[FMT];
const OUT = FMT === '9x16' ? WORK : path.join(WORK, 'fmt', FMT);
mkdirSync(OUT, { recursive: true });
const FPS = 30;
const EXE = process.env.VA_CHROME || '';                 // boşsa Playwright kendi indirdiği Chromium'u bulur
const PY = process.env.VA_PY || (process.platform === 'win32' ? 'python' : 'python3');   // studyo.py .venv Python'unu verir

// --- sayfa üretimi: timeline + marka + motor + kütüphane + proje video.js ---
const plan = JSON.parse(readFileSync(path.join(P, 'plan.json'), 'utf8'));
// plan.yerlesim "reklam": Meta Reels reklam güvenli alanı (üst %14, alt %35, yanlar %6; reklam açıklaması + CTA düğmesi altta).
// Organik Reels sınırı (formats.json, y1 1500) reklamda dar kalır. Yalnız bayraklı projelerde; diğerlerinin comp.html'i aynı.
const SAFE_AD = { '9x16': { x0: 65, x1: 1015, y0: 269, y1: 1248, no: [{ x0: 930, y0: 1000, x1: 1080, y1: 1720 }] } };
if (plan.yerlesim === 'reklam') for (const k in SAFE_AD) if (FORMATS[k]) FORMATS[k].safe = SAFE_AD[k];
const tl = JSON.parse(readFileSync(path.join(WORK, 'timeline.json'), 'utf8'));
const brandDir = path.join(ROOT, 'brands', plan.brand || '_none');
const brand = existsSync(path.join(brandDir, 'brand.json')) ? JSON.parse(readFileSync(path.join(brandDir, 'brand.json'), 'utf8')) : {};
const rel = p => path.relative(P, p).split(path.sep).join('/');
brand.base = rel(brandDir) + '/';
writeFileSync(path.join(WORK, 'run.js'),
  `window.TIMELINE = ${JSON.stringify(tl)};\nwindow.BRAND = ${JSON.stringify(brand)};\nwindow.FACE_DIR = 'work/face/';\n` +
  ((tl.base || {}).kind === 'anim' ? `window.FACE_STILL = ${JSON.stringify(plan.base_still || 'work/still.jpg')};\n` : '') +
  `window.FORMATS = ${JSON.stringify(FORMATS)};\n` +
  `window.FACE_TRACK = ${existsSync(path.join(WORK, 'face_track.json')) ? readFileSync(path.join(WORK, 'face_track.json'), 'utf8') : 'null'};\n`);
writeFileSync(path.join(P, 'comp.html'), `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>${plan.slug || 'reels'}</title>
<link rel="stylesheet" href="${rel(path.join(ROOT, 'comp/base.css'))}">
${existsSync(path.join(P, 'video.css')) ? '<link rel="stylesheet" href="video.css">' : ''}
</head><body>
<script src="work/run.js"></script>
<script src="${rel(path.join(ROOT, 'comp/engine.js'))}"></script>
<script src="${rel(path.join(ROOT, 'comp/library.js'))}"></script>
${(plan.libs || []).map(n => `<script src="${rel(path.join(ROOT, `comp/${n}.js`))}"></script>\n`).join('')}<script src="video.js"></script>
</body></html>`);
const N = Math.round(tl.total * FPS);

const MICRO_FAIL = [];
async function openPage(fmt = FMT) {
  const browser = await chromium.launch({ executablePath: EXE && existsSync(EXE) ? EXE : undefined,
    args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--disable-lcd-text'] });
  const D = FORMATS[fmt];
  const page = await browser.newPage({ viewport: { width: D.W, height: D.H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('SAYFA HATASI:', e.message); });
  page.on('console', m => { if (m.type() === 'error') { console.error('KONSOL:', m.text()); if (/MİKRO YER YOK/.test(m.text())) MICRO_FAIL.push(m.text()); } });
  page.on('requestfailed', r => console.error('YÜKLENEMEDİ:', r.url()));
  await page.goto(pathToFileURL(path.join(P, 'comp.html')).href + (fmt === '9x16' ? '' : `?fmt=${fmt}`), { waitUntil: 'load' });
  await page.evaluate(() => window.__ready);
  if (errors.length) throw new Error('sayfa hatası');
  return { browser, page };
}
const shot = async (page, t) => { await page.evaluate(t => window.renderAt(t), t); return page.screenshot({ type: 'png' }); };

if (mode === 'stills') {
  mkdirSync(path.join(OUT, 'qa'), { recursive: true });
  const { browser, page } = await openPage();
  for (const t of arg.split(',').filter(Boolean).map(Number))
    writeFileSync(path.join(OUT, 'qa', `t_${t.toFixed(2)}.png`), await shot(page, t));
  await browser.close();
} else if (mode === 'sheet') {                         // her adımda bir kare, 6x3'lük sayfalar
  const step = Number(arg || .5), dir = path.join(OUT, 'qa', 'sheet');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage();
  const ts = []; for (let t = 0; t < tl.total; t += step) ts.push(Math.round(t * 100) / 100);
  for (const [i, t] of ts.entries()) writeFileSync(path.join(dir, `${String(i).padStart(3, '0')}.png`), await shot(page, t));
  await browser.close();
  // döşeme PIL ile (bu ffmpeg'de drawtext yok): 6x3, köşede saniye etiketi
  writeFileSync(path.join(dir, 'times.json'), JSON.stringify(ts));
  spawnSync(PY, ['-c', `
import json, sys
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
ts = json.load(open(d + '/times.json')); f = ImageFont.truetype(sys.argv[3], 22)
W, H = int(sys.argv[4]), int(sys.argv[5])
tw, th = (270, 480) if H > W else (360, 360) if H == W else (480, 270)
cols, rows = (6, 3) if H > W else (5, 3) if H == W else (4, 4)
n = cols * rows
for s in range(0, len(ts), n):
    S = Image.new('RGB', (cols * tw, rows * th), 'black'); g = ImageDraw.Draw(S)
    for k, t in enumerate(ts[s:s + n]):
        x, y = (k % cols) * tw, (k // cols) * th
        S.paste(Image.open(f'{d}/{s + k:03d}.png').convert('RGB').resize((tw, th)), (x, y))
        g.rectangle((x, y, x + 86, y + 30), fill='black'); g.text((x + 6, y + 3), f'{t:.2f}s', fill='yellow', font=f)
    S.save(f'{out}/sheet_{s // n}.jpg', quality=88)
`, dir, path.join(OUT, 'qa'), `${ROOT}/assets/fonts/Montserrat.ttf`, String(FMTD.W), String(FMTD.H)], { stdio: 'inherit' });
  console.log(`kontak sayfaları: ${OUT}/qa/sheet_*.jpg (etiket = saniye)`);
} else if (mode === 'fsheet') {                        // aynı anlar, planın tüm formatları yan yana (hızlı format karşılaştırması)
  const fmts = plan.formats || ['9x16'], ts = arg.split(',').filter(Boolean).map(Number), dir = path.join(WORK, 'qa', 'fsheet');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  for (const f of fmts) {
    const { browser, page } = await openPage(f);
    for (const [i, t] of ts.entries()) writeFileSync(path.join(dir, `${f}_${i}.png`), await shot(page, t));
    await browser.close();
  }
  spawnSync(PY, ['-c', `
import sys, json
from PIL import Image, ImageDraw
d, fmts, ts = sys.argv[1], sys.argv[2].split(','), json.loads(sys.argv[3])
Hh = 420; rows = []
for i, t in enumerate(ts):
    ims = [Image.open(f'{d}/{f}_{i}.png').convert('RGB') for f in fmts]
    ims = [im.resize((round(im.width * Hh / im.height), Hh)) for im in ims]
    R = Image.new('RGB', (sum(im.width for im in ims) + 20 * len(ims), Hh + 30), (30, 30, 30)); x = 0; g = ImageDraw.Draw(R)
    for f, im in zip(fmts, ims): R.paste(im, (x, 30)); g.text((x + 6, 8), f'{f}  t={t}s', fill='yellow'); x += im.width + 20
    rows.append(R)
S = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows)), (30, 30, 30)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height
S.save(d + '/../fsheet.jpg', quality=88)
`, dir, fmts.join(','), JSON.stringify(ts)], { stdio: 'inherit' });
  console.log(`format karşılaştırma: ${WORK}/qa/fsheet.jpg`);
} else if (mode === 'safecheck') {                     // güvenli alan denetimi: her karede görünür yazı/kartların kutusu
  const { browser, page } = await openPage();
  await page.evaluate(() => {
    const S = M.SAFE, tol = 6;
    const opaque = el => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return o; };
    const visual = el => { const cs = getComputedStyle(el);
      if (el.matches('img,svg')) return true;
      if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return true;
      const bg = cs.backgroundColor; return (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0; };
    const boxy = el => { const cs = getComputedStyle(el); const bg = cs.backgroundColor;
      return el.matches('img,svg') || (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0; };
    const clipR = el => { let r;
      if (boxy(el)) r = el.getBoundingClientRect();
      else { const rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); }   // yalnız yazı: glif kutusu
      r = { l: r.left, t: r.top, r: r.right, b: r.bottom };
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
        if (getComputedStyle(e).overflow === 'hidden') { const q = e.getBoundingClientRect();
          r = { l: Math.max(r.l, q.left), t: Math.max(r.t, q.top), r: Math.min(r.r, q.right), b: Math.min(r.b, q.bottom) }; } }
      return r; };
    const name = el => { const sc = el.closest('.scene'); const txt = (el.textContent || '').trim().slice(0, 24);
      return `${sc ? sc.id : 'altyazı'} > ${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${txt ? ` "${txt}"` : ''}`; };
    window.__safeScan = (t) => {
      const bad = [], fc = M.face ? M.face(t) : { ok: false };
      if (fc.ok) for (const el of document.querySelectorAll('.micro')) {      // mikro elemanlar kafanın üstüne binmez
        if (opaque(el) < .3) continue;
        const q = el.getBoundingClientRect(), h = fc.avoid;
        if (q.width > 2 && q.left < h.x1 - tol && q.right > h.x0 + tol && q.top < h.y1 - tol && q.bottom > h.y0 + tol)
          bad.push({ n: `mikro kafayla çakışıyor > ${el.id}`, r: [q.left, q.top, q.right, q.bottom].map(Math.round) });
      }
      for (const el of document.querySelectorAll('.scene *, #cap .cw')) {
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
        if (el.closest('[data-safe=ignore]') === el || !visual(el) || opaque(el) < .3) continue;
        const r = clipR(el); if (r.r - r.l < 2 || r.b - r.t < 2) continue;
        const out = r.l < S.x0 - tol || r.r > S.x1 + tol || r.t < S.y0 - tol || r.b > S.y1 + tol ||
          S.no.some(z => r.r > z.x0 + tol && r.l < z.x1 - tol && r.b > z.y0 && r.t < z.y1);   // yasak kutular (9x16: sağ buton sütunu)
        if (out) bad.push({ n: name(el), r: [r.l, r.t, r.r, r.b].map(Math.round) });
      }
      return bad;
    };
  });
  const runs = new Map(), fails = [];
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    const bad = await page.evaluate(async t => { await window.renderAt(t); return window.__safeScan(t); }, t);
    const seen = new Set(bad.map(b => b.n));
    for (const b of bad) { const r = runs.get(b.n) || { a: i, n: 0, r: b.r }; r.n++; r.last = i; runs.set(b.n, r); }
    for (const [k, r] of runs) if (!seen.has(k)) { if (r.n >= 4) fails.push({ k, ...r }); runs.delete(k); }
  }
  for (const [k, r] of runs) if (r.n >= 4) fails.push({ k, ...r });
  await browser.close();
  const sec = f => (f / FPS).toFixed(2);
  const S0 = FMTD.safe, noTxt = (S0.no || []).map(z => ` yasak x${z.x0}-${z.x1} y${z.y0}-${z.y1}`).join('');
  for (const m of MICRO_FAIL) fails.push({ k: m + ' (mikro eleman yerleşemedi: küçült, süreyi kaydır veya prefer/at ver)', a: 0, last: 0, n: 0, r: [] });
  if (!fails.length) console.log(`GÜVENLİ ALAN [${FMT}]: GEÇTİ (${N} kare; sınır x ${S0.x0}-${S0.x1}, y ${S0.y0}-${S0.y1}${noTxt})`);
  else {
    console.log(`GÜVENLİ ALAN [${FMT}]: KALDI — ${fails.length} taşma (4+ kare):`);
    for (const f of fails) console.log(`  ${sec(f.a)}-${sec(f.last)} s (${f.n} kare)  ${f.k}  kutu ${f.r.join(',')}`);
    process.exitCode = 1;
  }
} else if (mode === 'worker') {
  const [f0, f1, out] = [Number(arg), Number(a2), a3];
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '10', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const { browser, page } = await openPage();
  for (let i = f0; i < f1; i++) {
    const buf = await shot(page, i / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
} else if (mode === 'video') {
  const K = Number(arg || 8), per = Math.ceil(N / K), dir = path.join(OUT, 'parts');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), parts = [];
  await Promise.all([...Array(K)].map((_, k) => new Promise((res, rej) => {
    const out = path.join(dir, `p${String(k).padStart(2, '0')}.mp4`); parts.push(out);
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), projArg, 'worker', k * per, Math.min(N, (k + 1) * per), out, '--fmt', FMT], { stdio: 'inherit' });
    p.on('close', c => c === 0 ? res() : rej(new Error('işçi ' + k)));
  })));
  writeFileSync(path.join(dir, 'list.txt'), parts.sort().map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-c', 'copy',
    path.join(OUT, 'video_noaudio.mp4')], { stdio: 'inherit' });
  console.log(`[${FMT}] ${N} kare, ${((Date.now() - t0) / 1000).toFixed(1)} sn -> ${OUT}/video_noaudio.mp4`);
}
