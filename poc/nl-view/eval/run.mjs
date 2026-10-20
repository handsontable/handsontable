/**
 * Score an nl-view page against the hand-checked gold.
 *
 *   node run.mjs --url <approach demo URL|oracle> --approach <name> --out results/<name>.json [--token-file path] [--timeout ms]
 *
 * `--url oracle` loads this directory's reference page (the gold oracle, not an approach).
 * The harness always applies gold itself, on its own grid, through validateViewState and
 * setViewState. The approach is scored on the grid its translate() leaves behind.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORDER_ID, TICKET_ID, TODAY } from './lib/schema.mjs';
import {
  acceptablePredicates,
  expectedHidden,
  expectedSort,
  rowPredicate,
} from './lib/expectations.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOT_UMD = resolve(HERE, '../../../handsontable/dist/handsontable.js');

function loadPlaywrightCore() {
  const store = resolve(HERE, '../../../node_modules/.pnpm');
  const entry = readdirSync(store).find((name) => name.startsWith('playwright@'));

  if (!entry) {
    throw new Error('playwright is not installed under node_modules/.pnpm');
  }

  const pkg = join(store, entry, 'node_modules/playwright/package.json');

  return createRequire(pkg)('playwright-core');
}

const ID_KEY = { orders: ORDER_ID, tickets: TICKET_ID };
const FULL_ROW = new Set(['sort_single', 'sort_multi', 'hide_columns', 'clear']);

function parseArgs(argv) {
  const args = { timeout: 120000 };

  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === '--url') args.url = value;
    else if (key === '--approach') args.approach = value;
    else if (key === '--out') args.out = value;
    else if (key === '--token-file') args.tokenFile = value;
    else if (key === '--timeout') args.timeout = Number(value);
    else throw new Error(`unknown argument ${key}`);

    index += 1;
  }

  if (!args.url || !args.approach || !args.out) {
    throw new Error('usage: node run.mjs --url <url|oracle> --approach <name> --out results/<name>.json [--token-file path] [--timeout ms]');
  }

  return args;
}

function contentType(file) {
  const extension = extname(file);

  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js' || extension === '.mjs') return 'text/javascript; charset=utf-8';
  if (extension === '.json') return 'application/json; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';

  return 'application/octet-stream';
}

function startServer() {
  if (!existsSync(HOT_UMD)) {
    throw new Error(`missing ${HOT_UMD}; run npm --prefix handsontable run build:umd`);
  }

  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      let file = HOT_UMD;

      if (url.pathname !== '/vendor/handsontable.js') {
        const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        file = resolve(HERE, relative);

        if (file !== HERE && !file.startsWith(`${HERE}/`)) {
          response.writeHead(403);
          response.end('forbidden');
          return;
        }

        if (existsSync(file) && statSync(file).isDirectory()) {
          file = join(file, 'index.html');
        }
      }

      if (!existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404);
        response.end('not found');
        return;
      }

      response.writeHead(200, {
        'content-type': contentType(file),
        'cache-control': 'no-store',
      });
      response.end(readFileSync(file));
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });

  return new Promise((ready) => {
    server.listen(0, '127.0.0.1', () => {
      ready({ server, port: server.address().port });
    });
  });
}

function percentile(values, p) {
  if (!values.length) return null;

  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil((p / 100) * sorted.length);

  return sorted[Math.max(0, rank - 1)];
}

function sameIds(left, right) {
  if (left.length !== right.length) return false;

  const a = [...left].sort();
  const b = [...right].sort();

  return a.every((id, index) => id === b[index]);
}

function sameSnapshot(left, right) {
  return JSON.stringify(left.first50) === JSON.stringify(right.first50)
    && sameIds(left.visibleIds, right.visibleIds)
    && JSON.stringify(left.hiddenColumns) === JSON.stringify(right.hiddenColumns)
    && JSON.stringify(left.sort) === JSON.stringify(right.sort);
}

function diffSnapshots(expected, actual) {
  const diff = {};

  if (JSON.stringify(expected.first50) !== JSON.stringify(actual.first50)) {
    diff.first50 = { expected: expected.first50, actual: actual.first50 };
  }

  if (!sameIds(expected.visibleIds, actual.visibleIds)) {
    const expectedSet = new Set(expected.visibleIds);
    const actualSet = new Set(actual.visibleIds);
    const missing = [...expectedSet].filter((id) => !actualSet.has(id));
    const extra = [...actualSet].filter((id) => !expectedSet.has(id));

    diff.visible = {
      expectedCount: expected.visibleIds.length,
      actualCount: actual.visibleIds.length,
      missing: missing.slice(0, 30),
      extra: extra.slice(0, 30),
    };
  }

  if (JSON.stringify(expected.hiddenColumns) !== JSON.stringify(actual.hiddenColumns)) {
    diff.hiddenColumns = { expected: expected.hiddenColumns, actual: actual.hiddenColumns };
  }

  if (JSON.stringify(expected.sort) !== JSON.stringify(actual.sort)) {
    diff.sort = { expected: expected.sort, actual: actual.sort };
  }

  return diff;
}

function idsFor(rows, idKey, predicate) {
  return rows.filter(predicate).map((row) => row[idKey]);
}

function conditionUses(state) {
  const uses = [];

  for (const entry of state?.filters ?? []) {
    for (const condition of entry.conditions ?? []) {
      uses.push({ column: entry.column, name: condition.name });
    }
  }

  return uses;
}

function normalize(value, wallMs) {
  if (!value || typeof value !== 'object') {
    return {
      status: 'error',
      state: null,
      explanation: 'translate did not return an object',
      ms: null,
      costUsd: null,
      tokens: null,
      turns: null,
      wallMs,
    };
  }

  const status = value.status === 'applied' || value.status === 'not_expressible' || value.status === 'error'
    ? value.status
    : 'error';

  return {
    status,
    state: value.state ?? null,
    explanation: typeof value.explanation === 'string' ? value.explanation : '',
    ms: typeof value.ms === 'number' ? value.ms : null,
    costUsd: typeof value.costUsd === 'number' ? value.costUsd : null,
    tokens: value.tokens ?? null,
    turns: value.turns ?? null,
    wallMs,
  };
}

function markdown(report) {
  const lines = [
    `# nl-view eval: ${report.approach}`,
    '',
    'Gold oracle scores are a harness check. An approach name other than `oracle` is the thing under test.',
    '',
    `Prompts: ${report.counts.prompts}. Expressible: ${report.counts.expressible} (${(report.counts.expressibleRatio * 100).toFixed(1)}%). Not expressible: ${report.counts.notExpressible}.`,
    '',
    `Detection (said not_expressible on an inexpressible prompt): ${report.scores.detectionHits}/${report.scores.detectionTotal} (${pct(report.scores.detection)}).`,
    `Accuracy (expressible prompt applied to the gold grid, or an accepted alternate): ${report.scores.accuracyHits}/${report.scores.accuracyTotal} (${pct(report.scores.accuracy)}).`,
    '',
    `p50 reported ms: ${fmt(report.scores.p50Ms)}. p95 reported ms: ${fmt(report.scores.p95Ms)}.`,
    `p50 wall ms: ${fmt(report.scores.p50WallMs)}. p95 wall ms: ${fmt(report.scores.p95WallMs)}.`,
    `Mean costUsd: ${fmt(report.scores.meanCostUsd)}.`,
    '',
    '## Thresholds',
    '',
    `- Expressible ratio ${pct(report.thresholds.expressibleRatio.actual)} against >= 70%.`,
    `- Accuracy ${pct(report.thresholds.accuracy.actual)} against >= 85% of expressible prompts.`,
    `- p50 reported ms ${fmt(report.thresholds.p50Ms.actual)} against <= 3000.`,
    '',
    '## By category',
    '',
    '| Category | Prompts | Expressible | Detection | Accuracy |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const [category, row] of Object.entries(report.byCategory)) {
    lines.push(`| ${category} | ${row.prompts} | ${row.expressible} | ${row.detectionHits}/${row.detectionTotal} | ${row.accuracyHits}/${row.accuracyTotal} |`);
  }

  lines.push('', '## Failures', '');

  if (!report.failures.length) {
    lines.push('None.');
  } else {
    for (const failure of report.failures) {
      lines.push(`- \`${failure.id}\` (${failure.category}): ${failure.reason}`);
    }
  }

  lines.push(
    '',
    '## Gold notes',
    '',
    '- TODAY is 2026-10-20. Relative dates in the gold are absolute ISO ranges. `date_today` follows the browser clock, so it is not used.',
    '- "This quarter" and "this month" show the same orders: `order_date` stops in October 2026.',
    '- Top-N is not expressible. A sort still shows every row.',
    '- Group and aggregate are not expressible. There is no flat-data grouping.',
    '- `by_value` is absent from `getAvailableConditions` and is still a valid restored condition.',
    '- String filter arguments are lowercased when the condition is imported. `by_value` stays case-sensitive.',
    '- The oracle forces text for low-cardinality columns. An approach that infers dropdown uses the same text operators.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function pct(value) {
  if (value == null || Number.isNaN(value)) return 'n/a';

  return `${(value * 100).toFixed(1)}%`;
}

function fmt(value) {
  return value == null ? 'n/a' : String(value);
}

const args = parseArgs(process.argv);
const prompts = JSON.parse(readFileSync(join(HERE, 'prompts.json'), 'utf8'));
const datasets = {
  orders: JSON.parse(readFileSync(join(HERE, 'datasets/orders.json'), 'utf8')),
  tickets: JSON.parse(readFileSync(join(HERE, 'datasets/tickets.json'), 'utf8')),
};

let token;

if (args.tokenFile) {
  token = readFileSync(args.tokenFile, 'utf8').trim();
}

const { chromium } = loadPlaywrightCore();
const { server, port } = await startServer();
const oracleUrl = `http://127.0.0.1:${port}/reference/index.html`;
const approachUrl = args.url === 'oracle' ? oracleUrl : args.url;
const browser = await chromium.launch({
  executablePath: process.env.NL_VIEW_CHROME || '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const goldErrors = [];
const goldValidation = [];
const columnConditions = {};
const goldSnapshots = new Map();
const acceptableSnapshots = new Map();

let report;

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  if (token) {
    await context.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });
    await context.addInitScript((value) => {
      window.__NL_VIEW_TOKEN = value;
    }, token);
  }

  await context.addInitScript(() => {
    window.__nlViewSnapshot = (idKey) => {
      const fromApi = window.nlView && window.nlView.hot;
      const root = document.querySelector('.ht-root-wrapper');
      const hot = fromApi && !fromApi.isDestroyed ? fromApi : root && root.__hotInstance;

      if (!hot) {
        throw new Error('no Handsontable instance');
      }

      const visibleIds = [];
      const count = hot.countRows();

      for (let visual = 0; visual < count; visual += 1) {
        const physical = hot.toPhysicalRow(visual);
        const row = hot.getSourceDataAtRow(physical);
        visibleIds.push(row[idKey]);
      }

      const columns = hot.getSettings().columns;
      const hiddenPhysical = hot.getPlugin('hiddenColumns').getHiddenColumns() || [];
      const hiddenColumns = hiddenPhysical.map((physical) => {
        if (Array.isArray(columns) && columns[physical] && columns[physical].data) {
          return columns[physical].data;
        }

        const visual = hot.toVisualColumn(physical);

        return visual == null ? `physical:${physical}` : hot.colToProp(visual);
      }).sort();

      const rawSort = hot.getPlugin('multiColumnSorting').getSortConfig();
      const sort = (Array.isArray(rawSort) ? rawSort : []).map((entry) => ({
        column: hot.colToProp(entry.column),
        sortOrder: entry.sortOrder,
      }));

      return {
        first50: visibleIds.slice(0, 50),
        visibleIds,
        hiddenColumns,
        sort,
      };
    };
  });

  const goldPage = await context.newPage();
  goldPage.setDefaultTimeout(args.timeout);
  await goldPage.goto(oracleUrl, { waitUntil: 'load' });
  await goldPage.waitForFunction(() => window.nlView && typeof window.nlView.translate === 'function');

  for (const dataset of ['orders', 'tickets']) {
    const rows = datasets[dataset];
    const idKey = ID_KEY[dataset];

    await goldPage.evaluate(async ({ name, data }) => {
      await window.nlView.loadData(name, data);
      await window.nlView.reset();
    }, { name: dataset, data: rows });

    const baseline = await goldPage.evaluate((key) => window.__nlViewSnapshot(key), idKey);

    if (baseline.visibleIds.length !== rows.length || baseline.sort.length || baseline.hiddenColumns.length) {
      goldErrors.push(`${dataset} reset left ${baseline.visibleIds.length} rows, sort ${JSON.stringify(baseline.sort)}, hidden ${JSON.stringify(baseline.hiddenColumns)}`);
    }

    columnConditions[dataset] = await goldPage.evaluate(() => {
      const hot = window.nlView.hot;
      const filters = hot.getPlugin('filters');
      const columns = hot.getSettings().columns;
      const listed = {};

      columns.forEach((column, index) => {
        listed[column.data] = filters.getAvailableConditions(index).map((condition) => condition.name);
      });

      return listed;
    });

    for (const item of prompts.filter((entry) => entry.dataset === dataset && entry.expressible)) {
      const predicate = rowPredicate(item.id);
      const expectedIds = idsFor(rows, idKey, predicate);
      const issues = [];

      for (const use of conditionUses(item.gold)) {
        const offered = columnConditions[dataset][use.column] ?? [];

        if (use.name !== 'by_value' && !offered.includes(use.name)) {
          issues.push(`${use.column} does not offer ${use.name}`);
        }
      }

      for (const alternate of item.acceptable ?? []) {
        for (const use of conditionUses(alternate)) {
          const offered = columnConditions[dataset][use.column] ?? [];

          if (use.name !== 'by_value' && !offered.includes(use.name)) {
            issues.push(`acceptable ${use.column} does not offer ${use.name}`);
          }
        }
      }

      const applied = await goldPage.evaluate(async (state) => {
        await window.nlView.reset();
        const plugin = window.nlView.hot.getPlugin('viewState');
        const validation = plugin.validateViewState(state);
        const restore = plugin.setViewState(state, { atomic: true, undo: 'record' });

        return {
          valid: validation.valid,
          error: validation.error ? validation.error.message : (restore.error ? restore.error.message : null),
          skipped: (validation.skipped || []).map((issue) => issue.message),
        };
      }, item.gold);

      if (!applied.valid || applied.error) {
        issues.push(`validate/set failed: ${applied.error || applied.skipped.join('; ')}`);
      }

      const snapshot = applied.valid && !applied.error
        ? await goldPage.evaluate((key) => window.__nlViewSnapshot(key), idKey)
        : null;

      if (snapshot) {
        if (!sameIds(snapshot.visibleIds, expectedIds)) {
          issues.push(`visible ids ${snapshot.visibleIds.length}, predicate ${expectedIds.length}`);
        }

        if (JSON.stringify(snapshot.sort) !== JSON.stringify(expectedSort(item.id))) {
          issues.push(`sort ${JSON.stringify(snapshot.sort)} wanted ${JSON.stringify(expectedSort(item.id))}`);
        }

        const hidden = [...expectedHidden(item.id)].sort();

        if (JSON.stringify(snapshot.hiddenColumns) !== JSON.stringify(hidden)) {
          issues.push(`hidden ${JSON.stringify(snapshot.hiddenColumns)} wanted ${JSON.stringify(hidden)}`);
        }

        if (FULL_ROW.has(item.category) && snapshot.visibleIds.length !== rows.length) {
          issues.push(`${item.category} hid rows`);
        }

        if (!FULL_ROW.has(item.category) && (snapshot.visibleIds.length === 0 || snapshot.visibleIds.length === rows.length)) {
          issues.push(`${item.category} visible count ${snapshot.visibleIds.length} is empty or complete`);
        }

        if (item.category === 'sort_single' && snapshot.sort.length !== 1) issues.push('sort_single length');
        if (item.category === 'sort_multi' && snapshot.sort.length < 2) issues.push('sort_multi length');
        if ((item.category === 'hide_columns' || item.category === 'combined') && snapshot.hiddenColumns.length < 1) {
          issues.push('nothing hidden');
        }
        if (item.category === 'combined' && snapshot.sort.length < 1) issues.push('combined has no sort');
        if (item.category === 'clear' && (snapshot.sort.length || snapshot.hiddenColumns.length)) {
          issues.push('clear left sort or hidden columns');
        }
      }

      const alternates = [];
      const predicates = acceptablePredicates(item.id);

      if ((item.acceptable ?? []).length !== predicates.length) {
        issues.push('acceptable count does not match the predicate list');
      }

      for (let index = 0; index < (item.acceptable ?? []).length; index += 1) {
        const alternate = item.acceptable[index];
        const alternateApplied = await goldPage.evaluate(async (state) => {
          await window.nlView.reset();
          const plugin = window.nlView.hot.getPlugin('viewState');
          const validation = plugin.validateViewState(state);
          const restore = plugin.setViewState(state, { atomic: true, undo: 'record' });

          return {
            valid: validation.valid,
            error: validation.error ? validation.error.message : (restore.error ? restore.error.message : null),
          };
        }, alternate);

        if (!alternateApplied.valid || alternateApplied.error) {
          issues.push(`acceptable ${index} rejected: ${alternateApplied.error}`);
          continue;
        }

        const alternateSnapshot = await goldPage.evaluate((key) => window.__nlViewSnapshot(key), idKey);
        const wanted = idsFor(rows, idKey, predicates[index]);

        if (!sameIds(alternateSnapshot.visibleIds, wanted)) {
          issues.push(`acceptable ${index} visible ${alternateSnapshot.visibleIds.length}, predicate ${wanted.length}`);
        }

        const sameAsGold = snapshot ? sameSnapshot(snapshot, alternateSnapshot) : false;

        if (item.distinctAcceptable && sameAsGold) {
          issues.push(`acceptable ${index} matches gold and was supposed to differ`);
        }

        if (!item.distinctAcceptable && snapshot && !sameAsGold) {
          issues.push(`acceptable ${index} was supposed to match gold`);
        }

        alternates.push({
          sameAsGold,
          visibleCount: alternateSnapshot.visibleIds.length,
          snapshot: alternateSnapshot,
        });
      }

      if (item.distinctAcceptable && alternates.length > 1) {
        for (let left = 0; left < alternates.length; left += 1) {
          for (let right = left + 1; right < alternates.length; right += 1) {
            if (sameSnapshot(alternates[left].snapshot, alternates[right].snapshot)) {
              issues.push(`acceptable ${left} and ${right} collapsed`);
            }
          }
        }
      }

      if (issues.length) {
        goldErrors.push(`${item.id}: ${issues.join(' | ')}`);
      }

      if (snapshot) {
        goldSnapshots.set(item.id, snapshot);
        acceptableSnapshots.set(item.id, alternates.map((alternate) => alternate.snapshot));
      }

      goldValidation.push({
        id: item.id,
        valid: issues.length === 0,
        issues,
        visibleCount: snapshot ? snapshot.visibleIds.length : null,
        visibleIds: snapshot ? snapshot.visibleIds : [],
        first50: snapshot ? snapshot.first50 : [],
        sort: snapshot ? snapshot.sort : [],
        hiddenColumns: snapshot ? snapshot.hiddenColumns : [],
        acceptable: alternates.map(({ sameAsGold, visibleCount }) => ({ sameAsGold, visibleCount })),
      });
    }
  }

  const approachPage = await context.newPage();
  approachPage.setDefaultTimeout(args.timeout);
  await approachPage.goto(approachUrl, { waitUntil: 'load' });
  await approachPage.waitForFunction(() => window.nlView && typeof window.nlView.translate === 'function');

  const promptResults = [];
  const failures = [];
  const byCategory = {};

  for (const item of prompts) {
    const category = byCategory[item.category] ?? {
      prompts: 0,
      expressible: 0,
      detectionHits: 0,
      detectionTotal: 0,
      accuracyHits: 0,
      accuracyTotal: 0,
    };
    category.prompts += 1;
    if (item.expressible) category.expressible += 1;
    byCategory[item.category] = category;

    const rows = datasets[item.dataset];
    const idKey = ID_KEY[item.dataset];
    let translated;
    let wallMs = null;
    let snapshot = null;
    let setupError = null;

    try {
      await approachPage.evaluate(async ({ name, data }) => {
        await window.nlView.loadData(name, data);
        await window.nlView.reset();
      }, { name: item.dataset, data: rows });

      const started = Date.now();

      try {
        translated = await approachPage.evaluate(async ({ text, today }) => window.nlView.translate(text, { today }), {
          text: item.prompt,
          today: TODAY,
        });
      } catch (error) {
        translated = {
          status: 'error',
          state: null,
          explanation: error.message,
          ms: null,
          costUsd: null,
          tokens: null,
          turns: null,
        };
      }

      wallMs = Date.now() - started;
    } catch (error) {
      setupError = error.message;
      translated = {
        status: 'error',
        state: null,
        explanation: error.message,
        ms: null,
        costUsd: null,
        tokens: null,
        turns: null,
      };
      wallMs = null;
    }

    const normalized = normalize(translated, wallMs);

    if (!setupError && normalized.status === 'applied') {
      try {
        snapshot = await approachPage.evaluate((key) => window.__nlViewSnapshot(key), idKey);
      } catch (error) {
        normalized.status = 'error';
        normalized.explanation = error.message;
      }
    }

    let pass = false;
    let reason = '';
    const gold = goldSnapshots.get(item.id);
    const alternates = acceptableSnapshots.get(item.id) ?? [];

    if (!item.expressible) {
      category.detectionTotal += 1;
      pass = normalized.status === 'not_expressible';
      if (pass) category.detectionHits += 1;
      else reason = `status ${normalized.status}, expected not_expressible`;
    } else {
      category.accuracyTotal += 1;
      const matchedGold = gold && snapshot && sameSnapshot(gold, snapshot);
      const matchedAlternate = snapshot && alternates.some((alternate) => sameSnapshot(alternate, snapshot));
      pass = normalized.status === 'applied' && (matchedGold || matchedAlternate);
      if (pass) category.accuracyHits += 1;
      else if (normalized.status !== 'applied') reason = `status ${normalized.status}, expected applied`;
      else if (!gold) reason = 'gold snapshot missing';
      else reason = 'grid does not match gold or an accepted alternate';
    }

    const entry = {
      id: item.id,
      dataset: item.dataset,
      category: item.category,
      expressible: item.expressible,
      status: normalized.status,
      pass,
      ms: normalized.ms,
      wallMs: normalized.wallMs,
      costUsd: normalized.costUsd,
      tokens: normalized.tokens,
      turns: normalized.turns,
      explanation: normalized.explanation,
    };

    if (!pass) {
      const failure = {
        id: item.id,
        dataset: item.dataset,
        category: item.category,
        prompt: item.prompt,
        reason,
        status: normalized.status,
      };

      if (item.expressible && gold && snapshot) {
        failure.diff = diffSnapshots(gold, snapshot);
        if (alternates.length) failure.note = 'none of the acceptable states matched either';
      }

      failures.push(failure);
      entry.failure = failure;
    }

    promptResults.push(entry);
  }

  const expressible = prompts.filter((item) => item.expressible).length;
  const notExpressible = prompts.length - expressible;
  const detectionHits = promptResults.filter((item) => !item.expressible && item.pass).length;
  const accuracyHits = promptResults.filter((item) => item.expressible && item.pass).length;
  const reported = promptResults.map((item) => item.ms).filter((value) => typeof value === 'number');
  const walls = promptResults.map((item) => item.wallMs).filter((value) => typeof value === 'number');
  const costs = promptResults.map((item) => item.costUsd).filter((value) => typeof value === 'number');
  const detection = notExpressible ? detectionHits / notExpressible : 1;
  const accuracy = expressible ? accuracyHits / expressible : null;
  const meanCostUsd = costs.length
    ? Math.round((costs.reduce((sum, value) => sum + value, 0) / costs.length) * 1e6) / 1e6
    : null;

  report = {
    approach: args.approach,
    url: args.url,
    today: TODAY,
    generatedAt: new Date().toISOString(),
    oraclePage: true,
    counts: {
      prompts: prompts.length,
      expressible,
      notExpressible,
      expressibleRatio: expressible / prompts.length,
    },
    scores: {
      detection,
      detectionHits,
      detectionTotal: notExpressible,
      accuracy,
      accuracyHits,
      accuracyTotal: expressible,
      p50Ms: percentile(reported, 50),
      p95Ms: percentile(reported, 95),
      p50WallMs: percentile(walls, 50),
      p95WallMs: percentile(walls, 95),
      meanCostUsd,
    },
    thresholds: {
      expressibleRatio: { target: 0.7, actual: expressible / prompts.length, pass: expressible / prompts.length >= 0.7 },
      accuracy: { target: 0.85, actual: accuracy, pass: accuracy != null && accuracy >= 0.85 },
      p50Ms: { target: 3000, actual: percentile(reported, 50), pass: (percentile(reported, 50) ?? Infinity) <= 3000 },
    },
    byCategory,
    goldErrors,
    columnConditions,
    goldValidation,
    failures,
    prompts: promptResults,
  };
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}

mkdirSync(dirname(resolve(args.out)), { recursive: true });
const jsonPath = resolve(args.out);
const mdPath = jsonPath.endsWith('.json') ? jsonPath.replace(/\.json$/, '.md') : `${jsonPath}.md`;

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, markdown(report));

const score = report.scores;
console.log(`prompts ${report.counts.prompts} expressible ${report.counts.expressible} (${(report.counts.expressibleRatio * 100).toFixed(1)}%) notExpressible ${report.counts.notExpressible}`);
console.log(`detection ${score.detectionHits}/${score.detectionTotal} accuracy ${score.accuracyHits}/${score.accuracyTotal}`);
console.log(`p50Ms ${score.p50Ms} p95Ms ${score.p95Ms} p50WallMs ${score.p50WallMs} p95WallMs ${score.p95WallMs} meanCostUsd ${score.meanCostUsd}`);
console.log(`goldErrors ${goldErrors.length}`);
if (goldErrors.length) {
  goldErrors.forEach((error) => console.log(`GOLD ${error}`));
}
console.log(`failures ${report.failures.length}`);
report.failures.slice(0, 20).forEach((failure) => console.log(`FAIL ${failure.id}: ${failure.reason}`));
console.log(`wrote ${jsonPath}`);
console.log(`wrote ${mdPath}`);

const oracleMiss = args.approach === 'oracle' && (score.detection !== 1 || score.accuracy !== 1);
process.exit(goldErrors.length || oracleMiss ? 1 : 0);
