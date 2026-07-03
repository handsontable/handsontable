import type { TableDeps } from '../table';
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
    this.wtSettings = deps.wtSettings;
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {number}
   */
  getHeight(sourceIndex: number) {
    let height = this.wtSettings.getSetting<number | undefined>('rowHeight', sourceIndex);
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
    let height = this.wtSettings.getSetting<number | undefined>('rowHeightByOverlayName', sourceIndex, overlayName);
    const oversizedHeight = this.#deps.getWtViewport().oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
