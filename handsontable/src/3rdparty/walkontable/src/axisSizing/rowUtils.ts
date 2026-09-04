import type { TableDeps } from '../table/baseTable';
import type { RowSizeSource } from './axisSizeSource';
/**
 * Row utils class contains all necessary information about sizes of the rows.
 *
 * @class {RowUtils}
 */
export default class RowUtils {
  /**
   * The table module dependencies.
   *
   * @type {TableDeps}
   */
  #deps: TableDeps;
  /**
   * The row-height source — supplies the provided (non-oversized) height half.
   *
   * @type {RowSizeSource}
   */
  #rowSizeSource: RowSizeSource;
  /**
   * @type {Settings}
   */
  wtSettings;

  /**
   * Read-only access to the dependencies, for the renderer, which reads `rowUtils.deps` externally
   * and so cannot reach the private `#deps`.
   *
   * @returns {TableDeps}
   */
  get deps(): TableDeps {
    return this.#deps;
  }

  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    this.#deps = deps;
    this.#rowSizeSource = deps.rowSizeSource;
    this.wtSettings = deps.wtSettings;
  }

  /**
   * Whether the row renders at exactly its provided height. An exact row is never raised by the
   * oversized-content measurement, and the renderer clips its content instead.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {boolean}
   */
  isExact(sourceIndex: number): boolean {
    // The mode first: in the (default) `min` mode it is a constant read, whereas the size read runs
    // the host's whole row-height funnel (the `modifyRowHeight` hooks in Handsontable). Reading the
    // size only for exact-mode rows keeps this free on every grid that does not use the mode.
    return this.#rowSizeSource.getMode(sourceIndex) === 'exact' &&
      hasProvidedHeight(this.#rowSizeSource.getSize(sourceIndex));
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {number}
   */
  getHeight(sourceIndex: number) {
    let height = this.#rowSizeSource.getSize(sourceIndex);

    if (hasProvidedHeight(height) && this.#rowSizeSource.getMode(sourceIndex) === 'exact') {
      return height;
    }

    const oversizedHeight = this.#deps.getWtViewport().oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }

  /**
   * Returns row height based on passed source index for the specified overlay type.
   *
   * @param {number} sourceIndex Row source index.
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName The overlay name.
   * @param {boolean} [isExact] Whether the row is exact (see `isExact`). A caller that already
   *   resolved it for the row passes it in, so the row-height funnel is not run a second time.
   * @returns {number}
   */
  getHeightByOverlayName(sourceIndex: number, overlayName: string, isExact = this.isExact(sourceIndex)) {
    let height = this.#rowSizeSource.getSizeForOverlay(sourceIndex, overlayName);

    if (isExact) {
      return height;
    }

    const oversizedHeight = this.#deps.getWtViewport().oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}

/**
 * Whether a provided height counts as one. A non-positive or missing height is "no height
 * provided", so it falls through to the default and the floor path, whatever the mode says (a `0`
 * from a hidden row must never become a 0px exact row).
 *
 * @param {number|undefined} providedHeight The provided height of a row.
 * @returns {boolean}
 */
function hasProvidedHeight(providedHeight: number | undefined): boolean {
  return providedHeight !== undefined && providedHeight > 0;
}
