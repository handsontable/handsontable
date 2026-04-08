// Golden snapshot I/O -- save, load, and compare performance baselines.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import { pctChange } from './thresholds.mjs';

const GOLDEN_DIR = join(import.meta.dirname, '..', 'golden');
const GOLDEN_PATH = join(GOLDEN_DIR, 'snapshots.json');

/**
 * @param {Record<string, object>} scenarioResults -- keyed by scenario name
 * @param {object} [metadata]
 * @returns {Promise<string>} path to saved file
 */
export async function saveSnapshots(scenarioResults, metadata = {}) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    ...metadata,
    scenarios: scenarioResults,
  };

  await mkdir(GOLDEN_DIR, { recursive: true });
  await writeFile(GOLDEN_PATH, JSON.stringify(snapshot, null, 2), 'utf8');

  return GOLDEN_PATH;
}

/**
 * @returns {Promise<object | null>}
 */
export async function loadSnapshots() {
  if (!await exists(GOLDEN_PATH)) {
    return null;
  }

  try {
    const raw = await readFile(GOLDEN_PATH, 'utf8');

    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Warning: failed to parse golden snapshots (${err.message}) -- running without baseline`);

    return null;
  }
}

/**
 * @param {Record<string, object>} current -- keyed by scenario name
 * @param {object} golden -- golden snapshot (from loadSnapshots)
 * @returns {object} comparison results per scenario
 */
export function compareToGolden(current, golden) {
  const goldenScenarios = golden?.scenarios || {};
  const result = {};

  for (const [name, currentData] of Object.entries(current)) {
    const goldenData = goldenScenarios[name];

    if (!goldenData) {
      result[name] = {
        current: currentData,
        golden: null,
        deltas: null,
        hasBaseline: false,
      };
      continue;
    }

    const deltas = computeDeltas(goldenData, currentData);

    result[name] = {
      current: currentData,
      golden: goldenData,
      deltas,
      hasBaseline: true,
    };
  }

  return result;
}

function computeDeltas(golden, current) {
  const deltas = {};

  // Category deltas
  const goldenCats = golden.categories || {};
  const currentCats = current.categories || {};
  const allCatKeys = new Set([...Object.keys(goldenCats), ...Object.keys(currentCats)]);

  deltas.categories = {};

  for (const key of allCatKeys) {
    const g = goldenCats[key];
    const c = currentCats[key];

    deltas.categories[key] = {
      golden: g ?? null,
      current: c ?? null,
      change: pctChange(g, c),
    };
  }

  // Range end (cumulative)
  deltas.rangeEnd = {
    golden: golden.rangeEnd,
    current: current.rangeEnd,
    change: pctChange(golden.rangeEnd, current.rangeEnd),
  };

  // Hook timing if available
  if (golden.hookTiming != null && current.hookTiming != null) {
    deltas.hookTiming = {
      golden: golden.hookTiming,
      current: current.hookTiming,
      change: pctChange(golden.hookTiming, current.hookTiming),
    };
  }

  return deltas;
}
