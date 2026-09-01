// Golden snapshot I/O -- save and load performance baselines.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import { computeMedianSnapshot } from './median-snapshot.mjs';

const GOLDEN_DIR = join(import.meta.dirname, '..', 'golden');
const GOLDEN_PATH = join(GOLDEN_DIR, 'snapshots.json');
// Populated by the CI restore step (compare mode only) with the last N
// timestamped develop golden snapshots fetched from gh-pages. Absent in
// golden mode (develop pushes), where the single-file path below is used.
const GOLDEN_HISTORY_DIR = join(GOLDEN_DIR, 'history');

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
  if (await exists(GOLDEN_HISTORY_DIR)) {
    const median = await loadMedianFromHistory();

    if (median) {
      return median;
    }
  }

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
 * @returns {Promise<object | null>}
 */
async function loadMedianFromHistory() {
  const files = (await readdir(GOLDEN_HISTORY_DIR)).filter(name => name.endsWith('.json'));

  const parsed = await Promise.all(files.map(async(file) => {
    try {
      return JSON.parse(await readFile(join(GOLDEN_HISTORY_DIR, file), 'utf8'));
    } catch (err) {
      console.warn(`Warning: failed to parse golden history file ${file} (${err.message}) -- skipping`);

      return null;
    }
  }));

  const snapshots = parsed.filter(Boolean);
  const median = computeMedianSnapshot(snapshots);

  if (!median && snapshots.length > 0) {
    console.warn(
      'Golden history present but not enough snapshots had a marked trace window on every ' +
      'scenario -- falling back to latest.json'
    );
  }

  return median;
}
