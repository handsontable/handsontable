/**
 * Real-browser smoke through the proxy. Not a test suite.
 * NL_VIEW_TOKEN must be set. The token is never written to disk.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../../tests/node_modules/@playwright/test/index.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const shotDir = path.join(root, 'screenshots');
const artifactDir = '/opt/cursor/artifacts';
const token = process.env.NL_VIEW_TOKEN;

const PROMPTS = [
  { id: 'orders-paid', dataset: 'orders', prompt: 'Show only paid orders', shot: true },
  { id: 'orders-emea-total', dataset: 'orders', prompt: 'EMEA orders sorted by total descending', shot: false },
  { id: 'orders-last-7', dataset: 'orders', prompt: 'Orders from the last 7 days', shot: true },
  { id: 'orders-hide', dataset: 'orders', prompt: 'Hide the rep and order_id columns', shot: false },
  { id: 'orders-high-not-cancelled', dataset: 'orders', prompt: 'High priority orders that are not cancelled', shot: false },
  { id: 'orders-qty', dataset: 'orders', prompt: 'Orders with quantity greater than 10', shot: false },
  { id: 'orders-de-fr', dataset: 'orders', prompt: 'Customers in Germany or France', shot: false },
  { id: 'orders-group', dataset: 'orders', prompt: 'Group orders by region and sum the totals', shot: false },
  { id: 'tickets-p0', dataset: 'tickets', prompt: 'Open P0 bugs', shot: true },
  { id: 'tickets-due', dataset: 'tickets', prompt: 'Tickets due this month, highest story points first', shot: false },
  { id: 'tickets-hide', dataset: 'tickets', prompt: 'Hide the tags and reporter columns', shot: false },
  { id: 'tickets-avg', dataset: 'tickets', prompt: 'Average story points by assignee', shot: false },
];

if (!token) {
  console.error('NL_VIEW_TOKEN is not set');
  process.exit(1);
}

fs.mkdirSync(shotDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

const server = await startServer(dist);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on('pageerror', (error) => {
  console.log('PAGEERROR', error.message);
});
const byVariant = {};

try {
  await page.goto(`${origin}/?dataset=orders#t=${encodeURIComponent(token)}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#grid td');

  const boot = await page.evaluate(() => {
    const hot = window.__nlHot;

    hot.getPlugin('viewState').setViewState({
      version: 1,
      filters: [{
        column: 'status',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['paid'] }],
      }],
    }, { atomic: true, undo: 'skip' });

    const filtered = hot.countRows();

    window.nlView.reset();

    return {
      columns: hot.countCols(),
      rows: hot.countRows(),
      filteredPaid: filtered,
      tokenInHash: location.hash.includes('t='),
      variant: document.querySelector('#variant')?.textContent || '',
      conditions: hot.getPlugin('filters').getAvailableConditions(9).map(item => item.name),
    };
  });

  console.log('boot', JSON.stringify(boot));

  for (const variant of ['default', 'fast']) {
    const query = variant === 'fast' ? '?dataset=orders&variant=fast' : '?dataset=orders';

    await page.goto(`${origin}/${query}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#grid td');

    const label = await page.locator('#variant').innerText();

    console.log('variant-page', label);
    byVariant[variant] = [];

    for (const item of PROMPTS) {
      await page.evaluate(async (dataset) => {
        window.nlView.loadData(dataset, dataset === 'tickets' ? window.__tickets : window.__orders);
        window.nlView.reset();
      }, item.dataset);

      if (item.shot && variant === 'default') {
        await shoot(page, `${item.id}-before`);
      }

      const started = Date.now();
      const result = await page.evaluate(async (prompt) => {
        const value = await window.nlView.translate(prompt, { today: '2026-10-20' });
        const debug = window.__nlViewDebug || {};

        return {
          ...value,
          rows: window.__nlHot.countRows(),
          variant: debug.variant || '',
          upstreamMs: debug.upstreamMs || 0,
          strippedReasoning: !!debug.strippedReasoning,
          reasoningItems: (debug.trace || []).reduce((sum, step) => sum + (step.reasoningItems || 0), 0),
          trace: (debug.trace || []).map(step => ({
            turn: step.turn,
            upstreamMs: step.upstreamMs,
            costUsd: step.costUsd,
            tokens: step.tokens,
            finishReason: step.finishReason,
            reasoningItems: step.reasoningItems,
            calls: (step.calls || []).map(call => ({
              name: call.name,
              args: call.args,
              ok: !call.output || call.output.ok !== false,
              error: call.output && call.output.error ? call.output.error : null,
            })),
          })),
        };
      }, item.prompt);

      if (item.shot && variant === 'default') {
        await shoot(page, `${item.id}-after`);
      }

      const row = {
        id: item.id,
        variant,
        dataset: item.dataset,
        prompt: item.prompt,
        status: result.status,
        ms: result.ms,
        turns: result.turns,
        costUsd: result.costUsd,
        tokens: result.tokens,
        upstreamMs: result.upstreamMs,
        rows: result.rows,
        pageVariant: result.variant,
        explanation: result.explanation,
        state: result.state,
        reasoningItems: result.reasoningItems,
        strippedReasoning: result.strippedReasoning,
        trace: result.trace,
        wallClockMs: Date.now() - started,
      };

      byVariant[variant].push(row);
      console.log([
        variant,
        item.id,
        result.status,
        `wall ${result.ms}ms`,
        `upstream ${result.upstreamMs}ms`,
        `turns ${result.turns}`,
        `$${result.costUsd}`,
        `rows ${result.rows}`,
        (result.explanation || '').slice(0, 120),
      ].join(' | '));
    }
  }
} finally {
  await browser.close();
  server.close();
}

const results = [...(byVariant.default || []), ...(byVariant.fast || [])];

const summary = {
  ranAt: new Date().toISOString(),
  prompts: results.length,
  applied: results.filter(item => item.status === 'applied').length,
  notExpressible: results.filter(item => item.status === 'not_expressible').length,
  error: results.filter(item => item.status === 'error').length,
  reasoningItemsSeen: results.reduce((sum, item) => sum + item.reasoningItems, 0),
  strippedReasoning: results.some(item => item.strippedReasoning),
  results,
};

const out = path.join(root, 'smoke-results.json');

fs.writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(artifactDir, 'smoke-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log('wrote', out);

/**
 * @param {import('playwright').Page} page
 * @param {string} name
 */
async function shoot(page, name) {
  const file = path.join(shotDir, `${name}.png`);

  await page.screenshot({ path: file });
  fs.copyFileSync(file, path.join(artifactDir, `${name}.png`));
}

/**
 * Placeholder rows are inside the page module, so stash them once for dataset switches.
 * @param {import('node:http').Server} _server
 */
async function startServer(dir) {
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.json': 'application/json',
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.join(dir, path.normalize(relative));

    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }

    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  return server;
}
