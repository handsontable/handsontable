/* eslint-disable */
/**
 * PROTOTYPE ONLY (issue #9614 research) - not for shipping.
 *
 * Tracks which cells changed since they were last painted so the cells renderer can skip
 * unchanged cells. Mode is read from `globalThis.__HOT_PARTIAL_MODE`:
 *   'off' - current behaviour (every rendered cell is wiped and repainted);
 *   'A'   - resolve meta + value as today, then skip the paint when the resolved value, the
 *           cell's write version and the position stamp all match the TD's last paint;
 *   'B'   - skip the whole per-cell pipeline (no getCellMeta, no value read) when the cell's
 *           write version and position stamp match.
 */
export type PartialRenderMode = 'off' | 'A' | 'B';

// Compile-time default used when the page sets no `__HOT_PARTIAL_MODE` (e2e sweep builds edit this).
export const DEFAULT_PARTIAL_MODE: PartialRenderMode = 'off';

export function getPartialRenderMode(): PartialRenderMode {
  return ((globalThis as any).__HOT_PARTIAL_MODE as PartialRenderMode) ?? DEFAULT_PARTIAL_MODE;
}

export interface CellStamp {
  rr: number; rc: number; // renderable (source) row/col the TD painted last
  vr: number; vc: number; // visual row/col
  band: string;           // rendered band identity (offset/size per axis) of the owning table
  epoch: number;
  ver: number;
  value: unknown;
  renderer: unknown;
}

let globalRenderEpoch = 0;

/** PROTOTYPE(#9614 scan cache): a process-wide epoch Walkontable can read without knowing the instance. */
export function getGlobalRenderEpoch() {
  return globalRenderEpoch;
}

export class PartialRenderState {
  epoch = 0;
  versions = new Map<number, Map<number, number>>();
  stats = { rendered: 0, skipped: 0, draws: 0 };

  get mode(): PartialRenderMode {
    return getPartialRenderMode();
  }

  get enabled() {
    return this.mode !== 'off';
  }

  markCell(physicalRow: number | null | undefined, physicalColumn: number | null | undefined) {
    if (typeof physicalRow !== 'number' || typeof physicalColumn !== 'number' ||
        Number.isNaN(physicalRow) || Number.isNaN(physicalColumn)) {
      return;
    }
    let row = this.versions.get(physicalRow);

    if (!row) {
      row = new Map();
      this.versions.set(physicalRow, row);
    }
    row.set(physicalColumn, (row.get(physicalColumn) ?? 0) + 1);
  }

  bumpEpoch() {
    this.epoch += 1;
    globalRenderEpoch += 1;
  }

  version(physicalRow: number, physicalColumn: number): number {
    return this.versions.get(physicalRow)?.get(physicalColumn) ?? 0;
  }

  resetStats() {
    this.stats = { rendered: 0, skipped: 0, draws: 0 };
  }
}
