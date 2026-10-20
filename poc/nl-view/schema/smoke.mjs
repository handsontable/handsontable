/**
 * Manual smoke for the nl-view schema PoC. Not a test suite.
 * Token comes from NL_VIEW_TOKEN. It is never written to disk.
 */
import { readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pnpmDir = path.join(here, '../../../node_modules/.pnpm');
const playwrightDir = readdirSync(pnpmDir).find(name => name.startsWith('playwright@'));
const { chromium } = await import(pathToFileURL(
  path.join(pnpmDir, playwrightDir, 'node_modules/playwright/index.mjs'),
).href);

const shots = path.join(here, 'screenshots');
const base = process.env.NL_VIEW_URL || 'http://127.0.0.1:5199/';
const token = process.env.NL_VIEW_TOKEN || '';

if (!token) {
  console.error('NL_VIEW_TOKEN is empty');
  process.exit(1);
}

const prompts = [
  { dataset: 'orders', id: 'orders-paid', prompt: 'show only paid orders', shot: true },
  { dataset: 'orders', id: 'orders-emea-high', prompt: 'EMEA orders with high priority, newest order date first', shot: false },
  { dataset: 'orders', id: 'orders-hide', prompt: 'hide the rep and region columns', shot: true },
  { dataset: 'orders', id: 'orders-last-7', prompt: 'orders from the last 7 days', shot: false },
  { dataset: 'orders', id: 'orders-qty', prompt: 'quantity at least 10, sort by total descending', shot: false },
  { dataset: 'orders', id: 'orders-countries', prompt: 'only Germany or France', shot: false },
  { dataset: 'orders', id: 'orders-clear', prompt: 'clear all filters, sorting, and hidden columns', shot: false },
  { dataset: 'orders', id: 'orders-group', prompt: 'group by country and sum the total', shot: false },
  { dataset: 'tickets', id: 'tickets-open-p0', prompt: 'open P0 bugs', shot: true },
  { dataset: 'tickets', id: 'tickets-hide-sort', prompt: 'hide story points and tags, sort by due date ascending', shot: false },
  { dataset: 'tickets', id: 'tickets-month', prompt: 'created this month and not done', shot: false },
  { dataset: 'tickets', id: 'tickets-unassigned', prompt: 'unassigned tickets', shot: false },
  { dataset: 'tickets', id: 'tickets-average', prompt: 'average story points by component', shot: false },
];

function summarize(state) {
  if (!state || typeof state !== 'object') {
    return null;
  }

  return {
    sort: state.sort ?? null,
    filters: state.filters ?? null,
    hiddenColumns: state.hiddenColumns ?? null,
  };
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const logs = [];

page.on('pageerror', (error) => {
  logs.push(`pageerror: ${error.message}`);
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    logs.push(`console: ${message.text()}`);
  }
});
page.on('response', (response) => {
  if (response.status() >= 400) {
    logs.push(`http ${response.status()} ${response.url()}`);
  }
});

await page.addInitScript((value) => {
  localStorage.setItem('nl-view-token', value);
}, token);

await mkdir(shots, { recursive: true });
await page.goto(`${base}?dataset=orders`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });

const boot = await page.evaluate(() => ({
  ready: document.body.dataset.ready,
  dataset: document.body.dataset.dataset,
  columns: window.hot.getColHeader(),
  rows: window.hot.countRows(),
  contract: typeof window.nlView?.loadData === 'function'
    && typeof window.nlView?.reset === 'function'
    && typeof window.nlView?.translate === 'function',
  conditions: window.hot.getPlugin('filters').getAvailableConditions(6).map(item => item.name),
}));

console.log(JSON.stringify({ boot, logs }, null, 2));

if (!boot.contract || boot.rows < 1 || logs.some(line => line.startsWith('pageerror'))) {
  await browser.close();
  process.exit(1);
}

const results = [];
let currentDataset = 'orders';

for (const item of prompts) {
  if (item.dataset !== currentDataset) {
    await page.evaluate((name) => window.nlView.loadData(name), item.dataset);
    await page.waitForFunction(
      (name) => document.body.dataset.dataset === name && document.body.dataset.ready === '1',
      item.dataset,
    );
    currentDataset = item.dataset;
  }

  await page.evaluate(() => window.nlView.reset());
  const beforeRows = await page.evaluate(() => window.hot.countRows());

  if (item.shot) {
    await page.screenshot({ path: path.join(shots, `${item.id}-before.png`), fullPage: true });
  }

  const started = Date.now();
  const translated = await page.evaluate(async (prompt) => {
    return window.nlView.translate(prompt, { today: '2026-10-20' });
  }, item.prompt);
  const afterRows = await page.evaluate(() => window.hot.countRows());
  const headers = await page.evaluate(() => window.hot.getColHeader());

  if (item.shot) {
    await page.screenshot({ path: path.join(shots, `${item.id}-after.png`), fullPage: true });
  }

  let undo = null;

  if (translated.status === 'applied' && item.id === 'orders-paid') {
    undo = await page.evaluate(() => {
      const plugin = window.hot.getPlugin('undoRedo');
      const before = window.hot.countRows();
      const available = plugin.isUndoAvailable();

      plugin.undo();

      return { before, after: window.hot.countRows(), available };
    });
    await page.evaluate(() => window.nlView.reset());
  }

  const row = {
    id: item.id,
    dataset: item.dataset,
    prompt: item.prompt,
    status: translated.status,
    explanation: translated.explanation,
    ms: translated.ms,
    wallMs: Date.now() - started,
    costUsd: translated.costUsd,
    tokens: translated.tokens,
    turns: translated.turns,
    beforeRows,
    afterRows,
    headers,
    state: summarize(translated.state),
    undo,
  };

  results.push(row);
  await writeFile(path.join(here, 'smoke-results.json'), `${JSON.stringify({
    ranAt: new Date().toISOString(),
    today: '2026-10-20',
    model: 'gpt-5.6-luna',
    boot,
    consoleErrors: logs,
    results,
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    id: row.id,
    status: row.status,
    ms: row.ms,
    costUsd: row.costUsd,
    tokens: row.tokens,
    turns: row.turns,
    beforeRows: row.beforeRows,
    afterRows: row.afterRows,
    explanation: row.explanation,
  }));
}

await writeFile(path.join(here, 'smoke-results.json'), `${JSON.stringify({
  ranAt: new Date().toISOString(),
  today: '2026-10-20',
  model: 'gpt-5.6-luna',
  boot,
  consoleErrors: logs,
  results,
}, null, 2)}\n`);

await browser.close();

const failed = results.filter(row => row.status === 'error');

if (failed.length) {
  process.exitCode = 2;
}
