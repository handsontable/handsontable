// Golden snapshot I/O -- save and load performance baselines.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';

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
