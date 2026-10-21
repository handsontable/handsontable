// Per-scenario sidecar files: small JSON documents a spec or the runner writes next to the traces
// (`hook-timing.json`, `heap-after-gc.json`) for the teardown to fold into the scenario's result.
// One writer and one reader, so the two files cannot drift on encoding or on how a missing file is
// reported.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';

/**
 * @param {string} outputDir -- scenario output directory
 * @param {string} file -- the sidecar's file name
 * @param {object} data
 */
export async function writeSidecar(outputDir, file, data) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, file), JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @param {string} outputDir
 * @param {string} file
 * @returns {Promise<object | null>} null when the sidecar was never written
 */
export async function readSidecar(outputDir, file) {
  const path = join(outputDir, file);

  if (!await exists(path)) {
    return null;
  }

  return JSON.parse(await readFile(path, 'utf8'));
}
