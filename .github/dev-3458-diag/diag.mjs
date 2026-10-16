import { chromium } from 'playwright';

const base = process.env.BASE || 'https://handsontable-docs-staging.pages.dev/docs';
const perFw = Number(process.env.LOADS || 30);
const workers = Number(process.env.WORKERS || 4);
const mix = process.env.MIX === '1';
const fws = ['javascript-data-grid', 'react-data-grid', 'angular-data-grid', 'vue-data-grid'];
const noise = ['binding-to-data', 'cell-renderer', 'column-summary', 'configuration-options', 'dialog', 'selection'];
const jobs = [];

for (let i = 0; i < perFw; i++) {
  for (const fw of fws) jobs.push({ fw, slug: 'export-to-csv', measure: true, i });
  if (mix) jobs.push({ fw: fws[i % 4], slug: noise[i % noise.length], measure: false, i });
}

const pngHeight = buf => buf.readUInt32BE(20);
const results = [];

async function load(browser, job) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies([{ name: 'CookieConsent', value: '-2', domain: new URL(base).hostname, path: '/' }]);
  const page = await ctx.newPage();
  const url = `${base}/${job.fw}/${job.slug}`;

  if (job.measure) {
    await page.addInitScript(() => {
      window.__ghost = [];

      window.__resize = [];
      const describe = el => {
        const cs = getComputedStyle(el);
        return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}#${el.id} w=${Math.round(el.getBoundingClientRect().width)} disp=${cs.display} pos=${cs.position} ov=${cs.overflowX} wid=${cs.width} min=${cs.minWidth} flex=${cs.flex}`;
      };

      window.addEventListener('DOMContentLoaded', () => {
        const ex = document.querySelector('#example1');

        if (!ex) { return; }
        const chain = [];

        for (let el = ex; el && el !== document.documentElement; el = el.parentElement) { chain.push(el); }

        let last = '';
        const ro = new ResizeObserver(() => {
          const widths = chain.map(el => Math.round(el.getBoundingClientRect().width)).join(',');

          if (widths === last) { return; }
          last = widths;
          const zero = chain.find(el => Math.round(el.getBoundingClientRect().width) === 0);

          window.__resize.push({
            t: Math.round(performance.now()),
            innerW: window.innerWidth,
            innerH: window.innerHeight,
            clientW: document.documentElement.clientWidth,
            widths,
            zero: zero ? describe(zero) : null,
            zeroParent: zero && zero.parentElement ? describe(zero.parentElement) : null,
          });
        });

        chain.forEach(el => ro.observe(el));
        ro.observe(document.documentElement);
      });
      const orig = Element.prototype.getBoundingClientRect;

      Element.prototype.getBoundingClientRect = function() {
        const r = orig.call(this);

        try {
          if (this.tagName === 'TABLE' && this.parentElement && this.parentElement.classList.contains('htGhostTable')) {
            const ex = this.closest('[id^="example"]');

            if (ex && ex.id === 'example1') {
              window.__ghost.push({
                t: Math.round(performance.now()),
                w: Math.round(r.width * 100) / 100,
                txt: this.textContent.slice(0, 12),
                rootW: Math.round(orig.call(this.parentElement.parentElement).width),
                fonts: document.fonts.status,
                loading: !!ex.closest('.hot-example-preview--loading'),
              });
            }
          }
        } catch (e) { /* diagnostic only */ }

        return r;
      };
    });
  }

  const started = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.hot-example-preview--loading').length === 0, null, { timeout: 60000 });

  if (!job.measure) {
    await page.screenshot({ fullPage: true, animations: 'disabled' });
    await ctx.close();

    return;
  }

  const grab = () => page.evaluate(() => {
    const out = [];

    for (const n of [1, 2, 3]) {
      const ex = document.querySelector(`#example${n}`);
      const wrapper = ex && ex.querySelector('.ht-root-wrapper');
      const hot = wrapper && wrapper.__hotInstance;
      const cols = ex ? [...ex.querySelectorAll('.ht_master table.htCore colgroup col')].map(c => c.style.width).join(',') : null;
      const row = ex && ex.querySelector('.ht_master table.htCore tbody tr');

      out.push({
        cols,
        rowH: row ? row.offsetHeight : null,
        rootW: wrapper ? Math.round(wrapper.getBoundingClientRect().width) : null,
        getColWidth: hot ? [0, 1, 2, 3, 4, 5, 6].map(c => hot.getColWidth(c)).join(',') : null,
        visible: hot ? hot.view.isVisible() : null,
      });
    }

    return { docH: document.documentElement.scrollHeight, grids: out };
  });

  const before = await grab();
  let shot;

  for (let k = 0; k < 3; k++) {
    shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    await page.waitForTimeout(k === 0 ? 100 : 250);
  }

  const after = await grab();
  const ghost = await page.evaluate(() => window.__ghost);
  const resize = await page.evaluate(() => window.__resize);

  results.push({
    fw: job.fw, i: job.i, ms: Date.now() - started, shotH: pngHeight(shot), before, after, ghost, resize,
  });
  await ctx.close();
}

async function worker(id) {
  const browser = await chromium.launch();

  for (let k = id; k < jobs.length; k += workers) {
    try {
      await load(browser, jobs[k]);
    } catch (e) {
      console.log('ERR', jobs[k].fw, jobs[k].slug, String(e).slice(0, 200));
    }
  }
  await browser.close();
}

await Promise.all(Array.from({ length: workers }, (_, id) => worker(id)));

const summary = {};

for (const r of results) {
  const key = `${r.fw.slice(0, 5)} shotH=${r.shotH} rowH=${r.before.grids.map(g => g.rowH).join('/')} cols1=${r.before.grids[0].cols}`;

  summary[key] = (summary[key] || 0) + 1;
}
console.log('SUMMARY');
console.log(JSON.stringify(summary, null, 1));

const bad = results.filter(r => r.before.grids.some(g => g.rowH !== 29) || r.after.grids.some(g => g.rowH !== 29));

console.log(`bad loads: ${bad.length} / ${results.length}`);
for (const r of bad.slice(0, 3)) console.log('BAD', JSON.stringify(r));
const good = results.find(r => !bad.includes(r));

if (good) console.log('GOOD', JSON.stringify(good));
