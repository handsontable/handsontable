import type { TableDeps } from '../table';
import type { RowSizeSource } from '../axisSizing/axisSizeSource';
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
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {number}
   */
  getHeight(sourceIndex: number) {
    let height = this.#rowSizeSource.getSize(sourceIndex);
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
   * @returns {number}
   */
  getHeightByOverlayName(sourceIndex: number, overlayName: string) {
    let height = this.#rowSizeSource.getSizeForOverlay(sourceIndex, overlayName);
    const oversizedHeight = this.#deps.getWtViewport().oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
