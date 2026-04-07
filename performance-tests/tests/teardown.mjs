/**
 * After test runs: average traces per version/iteration and print a single markdown table
 * (Metric with unit in title, version columns, % change, value change). Written to `output/result.md`.
 *
 * Trace files: `output/test-{version}-{iteration}.json` (e.g. test-15.0.0-1.json).
 *
 * Playwright: `globalTeardown: './tests/teardown.mjs'`. CLI: `node tests/teardown.mjs`
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { averageTraceFiles } from '../trace-parser.mjs';

export const DEFAULT_VERSION_KEYS = ['latest', 'current'];
export const DEFAULT_VERSION_LABELS = [process.env.VERSION_1 || 'latest', process.env.VERSION_2 || 'current'];
export const DEFAULT_ITERATIONS = Number(process.env.ITERATIONS) || 3;

/**
 * Paths to existing traces for one version: test-{version}-1.json … test-{version}-{iterations}.json
 */
export function resolveTracePathsForVersion(outputDir, version, iterations) {
  const paths = [];
  for (let i = 1; i <= iterations; i++) {
    const fp = path.join(outputDir, `test-${version}-${i}.json`);
    if (fs.existsSync(fp)) paths.push(fp);
  }
  return paths;
}

/**
 * Percent change from baseline to compare: ((compare − baseline) / baseline) × 100.
 */
export function percentChange(baselineNum, compareNum) {
  if (
    baselineNum == null ||
    compareNum == null ||
    Number.isNaN(baselineNum) ||
    Number.isNaN(compareNum)
  ) {
    return '—';
  }
  if (baselineNum === 0) {
    return compareNum === 0 ? '0%' : '—';
  }
  const p = ((compareNum - baselineNum) / baselineNum) * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
}

/**
 * Absolute change compare − baseline for display.
 * `kind`: `ms` | `count` (integer) | `bytes` (Δ as kb or Mb like trace-parser).
 */
export function valueChangeDisplay(baselineNum, compareNum, kind) {
  if (
    baselineNum == null ||
    compareNum == null ||
    Number.isNaN(baselineNum) ||
    Number.isNaN(compareNum)
  ) {
    return '—';
  }
  const d = compareNum - baselineNum;
  if (d === 0) return '0';
  const sign = d > 0 ? '+' : '';
  if (kind === 'bytes') {
    const ad = Math.abs(d);
    if (ad >= 1_000_000) {
      return `${sign}${(d / 1_000_000).toFixed(1)} Mb`;
    }
    return `${sign}${Math.round(d / 1000)} kb`;
  }
  return `${sign}${Math.round(d)}`;
}

function roundMs(n) {
  return n != null && Number.isFinite(n) ? Math.round(n) : null;
}

function cat(agg, key) {
  return agg?.categories?.[key];
}

/**
 * Build markdown: one table — Metric (unit in title), version columns, % change, Value change.
 */
export function buildTraceComparisonMarkdown(options = {}) {
  const {
    outputDir = path.join(process.cwd(), 'output'),
    versionKeys = DEFAULT_VERSION_KEYS,
    versionLabels = DEFAULT_VERSION_LABELS,
    iterations = DEFAULT_ITERATIONS,
  } = options;

  if (!versionKeys || versionKeys.length < 2) {
    return '*Need at least two entries in `versionKeys` (baseline first, then compare).*\n';
  }

  if (!versionLabels || versionLabels.length < 2) {
    return '*Need at least two entries in `versionLabels` (baseline first, then compare).*\n';
  }

  const baselineVersionKey = versionKeys[0];
  const compareVersionKey = versionKeys[1];
  const baselineVersionLabel = versionLabels[0];
  const compareVersionLabel = versionLabels[1];
  const basePaths = resolveTracePathsForVersion(outputDir, baselineVersionKey, iterations);
  const cmpPaths = resolveTracePathsForVersion(outputDir, compareVersionKey, iterations);

  if (basePaths.length === 0) {
    return `*No traces for baseline \`${baselineVersionLabel}\` under \`${outputDir}\` (expected \`test-${baselineVersionKey}-1.json\` …).*\n`;
  }
  if (cmpPaths.length === 0) {
    return `*No traces for compare \`${compareVersionLabel}\` under \`${outputDir}\` (expected \`test-${compareVersionKey}-1.json\` …).*\n`;
  }

  const base = averageTraceFiles(basePaths);
  const cmp = averageTraceFiles(cmpPaths);

  const rowsTimeline = [];

  const addMs = (target, label, bVal, cVal, unit = 'ms') => {
    const br = roundMs(bVal);
    const cr = roundMs(cVal);
    target.push({
      label: `${label} (${unit})`,
      b: br == null ? '—' : String(br),
      c: cr == null ? '—' : String(cr),
      pct: percentChange(br, cr),
      chg: valueChangeDisplay(br, cr, 'ms'),
    });
  };

  addMs(rowsTimeline, 'Total', base.rangeEnd, cmp.rangeEnd);
  addMs(rowsTimeline, 'System', cat(base, 'other'), cat(cmp, 'other'));
  addMs(rowsTimeline, 'Scripting', cat(base, 'scripting'), cat(cmp, 'scripting'));
  addMs(rowsTimeline, 'Rendering', cat(base, 'rendering'), cat(cmp, 'rendering'));
  addMs(rowsTimeline, 'Loading', cat(base, 'loading'), cat(cmp, 'loading'));
  addMs(rowsTimeline, 'Painting', cat(base, 'painting'), cat(cmp, 'painting'));
  addMs(rowsTimeline, 'Experience', cat(base, 'experience'), cat(cmp, 'experience'));
  addMs(rowsTimeline, 'Idle', cat(base, 'idle'), cat(cmp, 'idle'));

  const rowsMemory = [];
  const bu = base.updateCounters;
  const cu = cmp.updateCounters;
  if (bu && cu) {
    const maxHeapUnit =
      Math.max(bu.jsHeapMaxBytes ?? 0, cu.jsHeapMaxBytes ?? 0) >= 1_000_000 ? 'Mb' : 'kb';
    rowsMemory.push({
      label: 'Min JS heap (kb)',
      b: bu.jsHeapMinLabel ?? '—',
      c: cu.jsHeapMinLabel ?? '—',
      pct: percentChange(bu.jsHeapMinBytes, cu.jsHeapMinBytes),
      chg: valueChangeDisplay(bu.jsHeapMinBytes, cu.jsHeapMinBytes, 'bytes'),
    });
    rowsMemory.push({
      label: `Max JS heap (${maxHeapUnit})`,
      b: bu.jsHeapMaxLabel ?? '—',
      c: cu.jsHeapMaxLabel ?? '—',
      pct: percentChange(bu.jsHeapMaxBytes, cu.jsHeapMaxBytes),
      chg: valueChangeDisplay(bu.jsHeapMaxBytes, cu.jsHeapMaxBytes, 'bytes'),
    });
    rowsMemory.push({
      label: 'Min Documents (count)',
      b: bu.documentsMin == null ? '—' : String(bu.documentsMin),
      c: cu.documentsMin == null ? '—' : String(cu.documentsMin),
      pct: percentChange(bu.documentsMin, cu.documentsMin),
      chg: valueChangeDisplay(bu.documentsMin, cu.documentsMin, 'count'),
    });
    rowsMemory.push({
      label: 'Max Documents (count)',
      b: bu.documentsMax == null ? '—' : String(bu.documentsMax),
      c: cu.documentsMax == null ? '—' : String(cu.documentsMax),
      pct: percentChange(bu.documentsMax, cu.documentsMax),
      chg: valueChangeDisplay(bu.documentsMax, cu.documentsMax, 'count'),
    });
    rowsMemory.push({
      label: 'Min Nodes (count)',
      b: bu.nodesMin == null ? '—' : String(bu.nodesMin),
      c: cu.nodesMin == null ? '—' : String(cu.nodesMin),
      pct: percentChange(bu.nodesMin, cu.nodesMin),
      chg: valueChangeDisplay(bu.nodesMin, cu.nodesMin, 'count'),
    });
    rowsMemory.push({
      label: 'Max Nodes (count)',
      b: bu.nodesMax == null ? '—' : String(bu.nodesMax),
      c: cu.nodesMax == null ? '—' : String(cu.nodesMax),
      pct: percentChange(bu.nodesMax, cu.nodesMax),
      chg: valueChangeDisplay(bu.nodesMax, cu.nodesMax, 'count'),
    });
    rowsMemory.push({
      label: 'Min Listeners (count)',
      b: bu.listenersMin == null ? '—' : String(bu.listenersMin),
      c: cu.listenersMin == null ? '—' : String(cu.listenersMin),
      pct: percentChange(bu.listenersMin, cu.listenersMin),
      chg: valueChangeDisplay(bu.listenersMin, cu.listenersMin, 'count'),
    });
    rowsMemory.push({
      label: 'Max Listeners (count)',
      b: bu.listenersMax == null ? '—' : String(bu.listenersMax),
      c: cu.listenersMax == null ? '—' : String(cu.listenersMax),
      pct: percentChange(bu.listenersMax, cu.listenersMax),
      chg: valueChangeDisplay(bu.listenersMax, cu.listenersMax, 'count'),
    });
  }

  /** Single table: timeline (ms) first, then UpdateCounters when present. */
  const rowsAll =
    rowsMemory.length > 0 ? [...rowsTimeline, ...rowsMemory] : rowsTimeline;

  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

  /** Metric | v1 | v2 | % change | Value change (compare − baseline). */
  function formatTable(rows, colTitleA, colTitleB) {
    const chgHeader = 'Value change';
    const colMetric = Math.max('Metric'.length, ...rows.map(r => r.label.length));
    const colB = Math.max(colTitleA.length, ...rows.map(r => String(r.b).length));
    const colC = Math.max(colTitleB.length, ...rows.map(r => String(r.c).length));
    const colP = Math.max('% change'.length, ...rows.map(r => String(r.pct).length));
    const colChg = Math.max(chgHeader.length, ...rows.map(r => String(r.chg ?? '').length));

    const pad = (s, w, left = true) => {
      const t = esc(s);
      const sp = ' '.repeat(Math.max(0, w - t.length));
      return left ? t + sp : sp + t;
    };

    const sep =
      `| ${pad('Metric', colMetric)} | ${pad(colTitleA, colB)} | ${pad(colTitleB, colC)} | ${pad('% change', colP, false)} | ${pad(chgHeader, colChg, false)} |`;
    const rule = `| ${'-'.repeat(colMetric)} | ${'-'.repeat(colB)} | ${'-'.repeat(colC)} | ${'-'.repeat(colP)} | ${'-'.repeat(colChg)} |`;

    const out = [sep, rule];
    for (const r of rows) {
      const chg = r.chg ?? '—';
      out.push(
        `| ${pad(r.label, colMetric)} | ${pad(r.b, colB)} | ${pad(r.c, colC)} | ${pad(r.pct, colP, false)} | ${pad(chg, colChg, false)} |`,
      );
    }
    return out.join('\n');
  }

  return `${formatTable(rowsAll, baselineVersionLabel, compareVersionLabel)}\n`;
}

/** Playwright global teardown: print the markdown report to stdout and save to output/result.md. */
export default async function teardown() {
  const outputDir = path.join(process.cwd(), 'output');
  const md = buildTraceComparisonMarkdown({
    outputDir,
    versionKeys: DEFAULT_VERSION_KEYS,
    versionLabels: DEFAULT_VERSION_LABELS,
    iterations: DEFAULT_ITERATIONS,
  });
  console.log(md);
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'result.md'), md, 'utf8');
  } catch (e) {
    console.error('teardown: failed to write output/result.md', e);
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const outputDir = path.join(process.cwd(), 'output');
  const md = buildTraceComparisonMarkdown({
    outputDir,
    versionKeys: DEFAULT_VERSION_KEYS,
    versionLabels: DEFAULT_VERSION_LABELS,
    iterations: DEFAULT_ITERATIONS,
  });
  console.log(md);
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'result.md'), md, 'utf8');
  } catch (e) {
    console.error('teardown: failed to write output/result.md', e);
  }
}
