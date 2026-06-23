/**
 * DEV-1777 Performance check
 *
 * Loads the before-fix and after-fix demo pages in a local HTTP server,
 * scrolls the grid 40 steps via CDP, captures a Chromium performance trace,
 * and extracts Layout + StyleRecalculation durations.
 *
 * Run: node demos/DEV-1777/perf-check.mjs
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/user/handsontable/handsontable/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
};

function startServer(root, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(root, req.url.split('?')[0]);

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found: ' + req.url);
        return;
      }
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
    });

    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function measurePage(browser, url, label) {
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for HOT to render the grid
  await page.waitForSelector('.wtHolder', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  // Start CDP trace capturing Layout and StyleRecalc events
  const client = await page.createCDPSession();

  await client.send('Tracing.start', {
    categories: 'blink,renderer.scheduler,disabled-by-default-devtools.timeline',
    transferMode: 'ReturnAsStream',
    bufferUsageReportingInterval: 500,
  });

  // Scroll the wtHolder 40 steps via mouse wheel
  const holderHandle = await page.$('.wtHolder');
  const box = await holderHandle.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  for (let i = 0; i < 40; i++) {
    await page.mouse.move(cx, cy);
    await page.mouse.wheel({ deltaY: 60 });
    await new Promise(r => setTimeout(r, 20));
  }

  // Extra settle time
  await new Promise(r => setTimeout(r, 400));

  // Stop trace and collect
  const traceResult = await new Promise((resolve, reject) => {
    const chunks = [];

    client.on('Tracing.dataCollected', ({ value }) => chunks.push(value));
    client.on('Tracing.tracingComplete', async ({ stream }) => {
      if (stream) {
        // Stream-based result
        let data = '';

        for (;;) {
          const { data: chunk, eof } = await client.send('IO.read', { handle: stream });

          data += chunk;
          if (eof) break;
        }
        await client.send('IO.close', { handle: stream });
        resolve(JSON.parse(data));
      } else {
        resolve({ traceEvents: chunks.flatMap(c => c) });
      }
    });

    client.send('Tracing.end').catch(reject);
  });

  await page.close();

  // Filter events to main-thread Layout and StyleRecalculation
  const relevantTypes = new Set(['Layout', 'UpdateLayoutTree', 'RecalculateStyles']);
  const events = (traceResult.traceEvents || []).filter(e =>
    relevantTypes.has(e.name) && e.ph === 'X' && e.dur > 0
  );

  const totalUs = events.reduce((s, e) => s + e.dur, 0);
  const totalMs = (totalUs / 1000).toFixed(2);
  const count = events.length;
  const avgMs = count > 0 ? (totalUs / 1000 / count).toFixed(2) : '—';

  const byType = {};

  for (const e of events) {
    byType[e.name] = (byType[e.name] || 0) + e.dur;
  }

  return { label, totalMs: parseFloat(totalMs), count, avgMs, byType };
}

async function run() {
  const PORT = 54321;
  const server = await startServer(REPO_ROOT, PORT);
  const BASE = `http://127.0.0.1:${PORT}`;

  console.log(`\nDEV-1777 Performance Check`);
  console.log('='.repeat(60));
  console.log(`Serving repo root at ${BASE}`);

  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: '/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const PASSES = 5;
    const results = [];

    for (const { path, label } of [
      { path: '/demos/DEV-1777/before-fix.html', label: 'BEFORE FIX' },
      { path: '/demos/DEV-1777/after-fix.html',  label: 'AFTER FIX'  },
    ]) {
      const passResults = [];

      for (let pass = 1; pass <= PASSES; pass++) {
        process.stdout.write(`\nMeasuring ${label} pass ${pass}/${PASSES}... `);
        try {
          const r = await measurePage(browser, BASE + path, label);

          passResults.push(r);
          console.log(`${r.totalMs} ms`);
        } catch (err) {
          console.error(`FAILED: ${err.message}`);
        }
      }

      if (passResults.length === 0) {
        results.push({ label, error: 'all passes failed' });
        continue;
      }

      // Average across passes
      const avgTotal = passResults.reduce((s, r) => s + r.totalMs, 0) / passResults.length;
      const avgCount = Math.round(passResults.reduce((s, r) => s + r.count, 0) / passResults.length);
      // Merge byType
      const byType = {};

      for (const r of passResults) {
        for (const [type, us] of Object.entries(r.byType)) {
          byType[type] = (byType[type] || 0) + us / passResults.length;
        }
      }
      const allTotals = passResults.map(r => r.totalMs);
      const min = Math.min(...allTotals).toFixed(2);
      const max = Math.max(...allTotals).toFixed(2);

      results.push({
        label,
        totalMs: parseFloat(avgTotal.toFixed(2)),
        count: avgCount,
        avgMs: (avgTotal / avgCount).toFixed(2),
        byType,
        min,
        max,
        passes: passResults.length,
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('Results (Layout + StyleRecalc, 40 scroll steps)');
    console.log('='.repeat(60));

    for (const r of results) {
      if (r.error) {
        console.log(`\n[${r.label}] ERROR: ${r.error}`);
        continue;
      }
      console.log(`\n[${r.label}]  (avg of ${r.passes} passes)`);
      console.log(`  Total Layout+StyleRecalc : ${r.totalMs} ms  (min ${r.min}, max ${r.max})`);
      console.log(`  Event count (avg)        : ${r.count}`);
      console.log(`  Avg per event            : ${r.avgMs} ms`);
      console.log('  Breakdown by type:');
      for (const [type, us] of Object.entries(r.byType)) {
        console.log(`    ${type.padEnd(22)}: ${(us / 1000).toFixed(2)} ms`);
      }
    }

    if (results.length === 2 && !results[0].error && !results[1].error) {
      const before = results[0].totalMs;
      const after  = results[1].totalMs;
      const diff   = before - after;
      const pct    = ((diff / before) * 100).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log('Comparison');
      console.log('='.repeat(60));
      console.log(`  Before : ${before} ms`);
      console.log(`  After  : ${after} ms`);
      console.log(`  Delta  : ${diff >= 0 ? '-' : '+'}${Math.abs(diff).toFixed(2)} ms  (${diff >= 0 ? pct + '% faster' : Math.abs(pct) + '% slower'})`);

      if (diff > 0) {
        console.log('\n✅ PASS — after-fix is faster than before-fix');
      } else {
        console.log('\n⚠️  WARN — after-fix is NOT faster; check measurement noise');
      }
    }

    console.log('');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
