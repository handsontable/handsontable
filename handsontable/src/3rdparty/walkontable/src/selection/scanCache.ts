import type { WalkontableInstance } from '../types';
import type Selection from './selection';
import type { CellScanResult } from './scanner';

/**
 * Caches the cell elements a selection layer resolved to, per layer and per overlay.
 *
 * The rendered DOM reuses its TD nodes by position, so as long as the layer's corners, the rendered
 * band, and the grid's structure (the render epoch) are unchanged, the same elements represent the
 * same cells and the scan can be reused. Any of the three changing produces a different key, which
 * is a miss. Only the cell-range part of a scan is cached: the header scans run hooks that plugins
 * use to redirect headers, and those must run on every draw.
 */
export class SelectionScanCache {
  /**
   * The cached scan per layer and overlay, together with the key it is valid for.
   */
  #entries = new WeakMap<Selection, WeakMap<WalkontableInstance, { key: string; result: CellScanResult }>>();

  /**
   * Returns the cached scan when it is still valid for the key.
   *
   * @param {Selection} selection The selection layer.
   * @param {Walkontable} wot The overlay instance the scan was made for.
   * @param {string} key The validity key (corners, band, epoch).
   * @returns {CellScanResult|undefined}
   */
  get(selection: Selection, wot: WalkontableInstance, key: string): CellScanResult | undefined {
    const entry = this.#entries.get(selection)?.get(wot);

    return entry !== undefined && entry.key === key ? entry.result : undefined;
  }

  /**
   * Stores a scan under its validity key.
   *
   * @param {Selection} selection The selection layer.
   * @param {Walkontable} wot The overlay instance the scan was made for.
   * @param {string} key The validity key (corners, band, epoch).
   * @param {CellScanResult} result The scan to store.
   */
  set(selection: Selection, wot: WalkontableInstance, key: string, result: CellScanResult): void {
    let perOverlay = this.#entries.get(selection);

    if (perOverlay === undefined) {
      perOverlay = new WeakMap();
      this.#entries.set(selection, perOverlay);
    }

    perOverlay.set(wot, { key, result });
  }

  /**
   * Drops every overlay's cached scan of a layer. A draw that skips the layer (it is empty, or an
   * off-screen custom selection) does not validate its cached elements, and the band's nodes can be
   * replaced before the layer is scanned again under the same key - so the entry must not outlive
   * such a draw.
   *
   * @param {Selection} selection The selection layer.
   */
  delete(selection: Selection): void {
    this.#entries.delete(selection);
  }
}

/**
 * Builds the part of the validity key that describes the overlay's rendered band: which source rows
 * and columns the DOM currently holds, and how many header rows and columns precede them.
 *
 * @param {Walkontable} wot The overlay instance.
 * @param {number} renderEpoch The grid's render epoch (advanced on every structural change).
 * @returns {string}
 */
export function buildBandKey(wot: WalkontableInstance, renderEpoch: number): string {
  const { wtTable } = wot;

  return [
    wtTable.rowFilter?.offset ?? 0,
    wtTable.getRenderedRowsCount(),
    wtTable.columnFilter?.offset ?? 0,
    wtTable.getRenderedColumnsCount(),
    wtTable.getRowHeadersCount(),
    wtTable.getColumnHeadersCount(),
    renderEpoch,
  ].join(',');
}
