// Golden snapshot I/O -- save and load performance baselines.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import { computeMedianSnapshot, MEDIAN_WINDOW_SIZE } from './median-snapshot.mjs';

const DEFAULT_GOLDEN_DIR = join(import.meta.dirname, '..', 'golden');

/**
 * @param {string} goldenDir
 * @returns {{goldenPath: string, historyDir: string}}
 */
function paths(goldenDir) {
  return {
    goldenPath: join(goldenDir, 'snapshots.json'),
    // Populated by the CI restore step (compare mode only) with the last N
    // timestamped develop golden snapshots fetched from gh-pages. A golden
    // (develop-push) run must never read this, even if one is sitting there --
    // see the PERF_MODE guard in loadSnapshots() below.
    historyDir: join(goldenDir, 'history'),
  };
}

/**
 * @param {Record<string, object>} scenarioResults -- keyed by scenario name
 * @param {object} [metadata]
 * @param {string} [goldenDir] -- override for tests; defaults to the real golden dir
 * @returns {Promise<string>} path to saved file
 */
export async function saveSnapshots(scenarioResults, metadata = {}, goldenDir = DEFAULT_GOLDEN_DIR) {
  const { goldenPath } = paths(goldenDir);
  const snapshot = {
    timestamp: new Date().toISOString(),
    ...metadata,
    scenarios: scenarioResults,
  };

  await mkdir(goldenDir, { recursive: true });
  await writeFile(goldenPath, JSON.stringify(snapshot, null, 2), 'utf8');

  return goldenPath;
}

/**
 * @param {string} [goldenDir] -- override for tests; defaults to the real golden dir
 * @returns {Promise<object | null>}
 */
export async function loadSnapshots(goldenDir = DEFAULT_GOLDEN_DIR) {
  const { goldenPath, historyDir } = paths(goldenDir);
  const goldenPathExists = await exists(goldenPath);

  if (process.env.PERF_MODE !== 'golden' && await exists(historyDir)) {
    const median = await loadMedianFromHistory(historyDir, goldenPathExists);

    if (median) {
      return median;
    }
  }

  if (!goldenPathExists) {
    return null;
  }

  try {
    const raw = await readFile(goldenPath, 'utf8');

    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Warning: failed to parse golden snapshots (${err.message}) -- running without baseline`);

    return null;
  }
}

/**
 * @returns {number | null}
 */
function envWindowSize() {
  const raw = process.env.PERF_MEDIAN_WINDOW_SIZE;

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

/**
 * @param {string} historyDir
 * @param {boolean} goldenPathExists -- whether a single-file golden is actually there to fall back to
 * @returns {Promise<object | null>}
 */
async function loadMedianFromHistory(historyDir, goldenPathExists) {
  const files = (await readdir(historyDir)).filter(name => name.endsWith('.json'));

  const parsed = await Promise.all(files.map(async(file) => {
    try {
      return JSON.parse(await readFile(join(historyDir, file), 'utf8'));
    } catch (err) {
      console.warn(`Warning: failed to parse golden history file ${file} (${err.message}) -- skipping`);

      return null;
    }
  }));

  const snapshots = parsed.filter(Boolean);
  const windowSize = envWindowSize() ?? MEDIAN_WINDOW_SIZE;
  const median = computeMedianSnapshot(snapshots, { windowSize });

  if (!median && snapshots.length > 0) {
    const fallback = goldenPathExists
      ? 'falling back to latest.json'
      : 'no single-file golden either, running without baseline';

    console.warn(
      `Golden history present but not enough snapshots had a marked trace window on every scenario -- ${fallback}`
    );
  }

  return median;
}
