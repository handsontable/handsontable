/**
 * What a cell element showed after its last paint. The engine reuses TD elements by position and,
 * on a scroll, rotates the rows so an element follows its row; the stamp records which cell the
 * element painted (renderable and visual indexes, and the band identity the painter picked: the
 * overlay alone for a cell that may keep its element across a scroll, the full band for a merged
 * block's cell), under which grid-wide epoch and cell meta version, with which formatted value and
 * which renderer. A draw repaints the element only when any of these differs.
 */
export interface CellPaintStamp {
  renderedRow: number;
  renderedColumn: number;
  visualRow: number;
  visualColumn: number;
  band: string;
  epoch: number;
  version: number;
  value: unknown;
  renderer: unknown;
}

const stamps = new WeakMap<HTMLTableCellElement, CellPaintStamp>();

/**
 * Returns the stamp of the element's last paint, or `undefined` for an element that was never
 * painted through the incremental path.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @returns {CellPaintStamp|undefined}
 */
export function readCellPaintStamp(TD: HTMLTableCellElement): CellPaintStamp | undefined {
  return stamps.get(TD);
}

/**
 * Records the stamp of the paint that just happened.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @param {CellPaintStamp} stamp The stamp to record.
 */
export function writeCellPaintStamp(TD: HTMLTableCellElement, stamp: CellPaintStamp): void {
  stamps.set(TD, stamp);
}

/**
 * Forgets the stamp of an element that a paint outside `'onChange'` just overwrote. The stamp
 * described content the element no longer holds, and a row rotation can bring that cell back to
 * this element later; a stale stamp would then match and the element would keep the other cell.
 *
 * @param {HTMLTableCellElement} TD The cell element that was painted.
 */
export function deleteCellPaintStamp(TD: HTMLTableCellElement): void {
  stamps.delete(TD);
}

/**
 * Tells whether two stamps describe the same paint. Values and renderers are compared by identity:
 * a value object mutated in place is deliberately not detected (see the `renderMode` option docs).
 *
 * @param {CellPaintStamp|undefined} previous The stamp of the last paint.
 * @param {CellPaintStamp} next The stamp the draw is about to paint.
 * @returns {boolean}
 */
export function isSameCellPaint(previous: CellPaintStamp | undefined, next: CellPaintStamp): boolean {
  return previous !== undefined &&
    previous.renderedRow === next.renderedRow &&
    previous.renderedColumn === next.renderedColumn &&
    previous.visualRow === next.visualRow &&
    previous.visualColumn === next.visualColumn &&
    previous.band === next.band &&
    previous.epoch === next.epoch &&
    previous.version === next.version &&
    previous.value === next.value &&
    previous.renderer === next.renderer;
}
