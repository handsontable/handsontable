// The JS heap that survives a forced garbage collection after the action -- the live set.
//
// `jsHeapMaxBytes` (the gate today) is the highest sample inside the window, which on the scroll
// scenarios depends on where V8 scheduled a GC during 500 renders rather than on what the grid
// retains. The live set has no such dependence: the runner forces a full GC once the end mark is
// down and reads the heap that is left, per iteration. Recorded alongside the max for now; it can
// become the gate once enough goldens carry it to derive a threshold from (scripts/replay-goldens.mjs).

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const HEAP_AFTER_GC_FILE = 'heap-after-gc.json';

/**
 * @param {Array<number | null>} values -- per-iteration used heap after GC, in bytes; null where
 *   the readback failed for that iteration
 * @returns {{ averageBytes: number | null, values: Array<number | null> }}
 */
export function summarizeHeapAfterGc(values) {
  const finite = (values || []).filter(v => typeof v === 'number' && Number.isFinite(v));

  return {
    averageBytes: finite.length > 0 ? finite.reduce((a, b) => a + b, 0) / finite.length : null,
    values: [...(values || [])],
  };
}

/**
 * Persists the per-iteration readings alongside the traces, for the teardown to fold into the
 * scenario's `updateCounters`. Nothing is written when no iteration produced a reading, so a
 * scenario whose readback failed throughout looks like one recorded before the field existed.
 *
 * @param {string} outputDir -- scenario output directory
 * @param {Array<number | null>} values
 */
export async function saveHeapAfterGc(outputDir, values) {
  const summary = summarizeHeapAfterGc(values);

  if (summary.averageBytes === null) {
    return;
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, HEAP_AFTER_GC_FILE), JSON.stringify(summary, null, 2), 'utf8');
}
