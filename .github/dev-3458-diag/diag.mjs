import { chromium } from 'playwright';
import { createHash } from 'node:crypto';

const base = process.env.BASE || 'https://handsontable-docs-staging.pages.dev/docs';
const perFw = Number(process.env.LOADS || 10);
const workers = Number(process.env.WORKERS || 4);
const fws = ['javascript-data-grid', 'react-data-grid', 'angular-data-grid', 'vue-data-grid'];
const pages = (process.env.PAGES || '').split(',').filter(Boolean);
const variants = {
  base: null,
  htmlMin: 'html{min-width:1000px}',
  previewMin: '.hot-example-preview{min-width:360px}',
};
const jobs = [];

for (let i = 0; i < perFw; i++) {
  for (const fw of fws) {
    for (const v of Object.keys(variants)) jobs.push({ fw, slug: 'export-to-csv', v, i, kind: 'csv' });
  }
}
for (const slug of pages) {
  for (const v of ['base', 'base', 'htmlMin']) jobs.push({ fw: fws[0], slug, v, i: 0, kind: 'page' });
}

const results = [];

async function load(browser, job) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies([{ name: 'CookieConsent', value: '-2', domain: new URL(base).hostname, path: '/' }]);
  const page = await ctx.newPage();

  await page.goto(`${base}/${job.fw}/${job.slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.hot-example-preview--loading').length === 0, null, { timeout: 60000 });
  if (variants[job.v]) await page.addStyleTag({ content: variants[job.v] });
  await page.waitForTimeout(300);

  const rows = () => page.evaluate(() => [...document.querySelectorAll('#example1,#example2,#example3')].map((ex) => {
    const tr = ex.querySelector('.ht_master table.htCore tbody tr');
    const cols = [...ex.querySelectorAll('.ht_master table.htCore colgroup col')].map(c => c.style.width).join(',');

    return `${tr ? tr.offsetHeight : '-'}:${cols}`;
  }).join('|'));
  const before = job.kind === 'csv' ? await rows() : '';
  let shot;

  for (let k = 0; k < 3; k++) {
    shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    await page.waitForTimeout(k === 0 ? 100 : 250);
  }
  results.push({
    ...job,
    shotH: shot.readUInt32BE(20),
    sha: createHash('sha1').update(shot).digest('hex').slice(0, 10),
    before,
    after: job.kind === 'csv' ? await rows() : '',
  });
  await ctx.close();
}

async function worker(id) {
  const browser = await chromium.launch();

  for (let k = id; k < jobs.length; k += workers) {
    try {
      await load(browser, jobs[k]);
    } catch (e) {
      console.log('ERR', jobs[k].fw, jobs[k].slug, jobs[k].v, String(e).slice(0, 160));
    }
  }
  await browser.close();
}

await Promise.all(Array.from({ length: workers }, (_, id) => worker(id)));

const csv = {};

for (const r of results.filter(x => x.kind === 'csv')) {
  const bad = r.after.split('|').some(g => !g.startsWith('29:')) ? 'BAD' : 'ok';
  const key = `${r.v.padEnd(10)} ${r.fw.slice(0, 5)} h=${r.shotH} ${bad}`;

  csv[key] = (csv[key] || 0) + 1;
}
console.log('CSV PAGE');
Object.keys(csv).sort().forEach(k => console.log(`${k}  x${csv[k]}`));

const byPage = {};

for (const r of results.filter(x => x.kind === 'page')) {
  (byPage[r.slug] = byPage[r.slug] || {})[r.v] = (byPage[r.slug][r.v] || []).concat(`${r.sha}/${r.shotH}`);
}
console.log('OTHER PAGES (sha/height per load)');
for (const [slug, v] of Object.entries(byPage)) {
  const b = v.base || [];
  const same = b.length === 2 && b[0] === b[1];
  const eq = same && v.htmlMin && v.htmlMin[0] === b[0];

  console.log(`${slug.padEnd(28)} baseStable=${same} htmlMinSameAsBase=${eq} base=${b.join(',')} htmlMin=${(v.htmlMin || []).join(',')}`);
}
