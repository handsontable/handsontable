/**
 * The sizing ports. These interfaces are the seam between the rendering engine and whoever supplies
 * the row heights and column widths — the settings/defaults inside Walkontable, or (through the
 * settings callbacks) the Handsontable size funnel and its `AutoRowSize`/`AutoColumnSize` plugins.
 *
 * A source answers only the "provided size" half of a measurement. The oversized-content merge
 * (`Math.max(provided, measured)`) still lives in `RowUtils`/`ColumnUtils` for now; it moves behind
 * the port in a later stage. Indexes are source indexes — the space the engine renders in, passed
 * through unchanged.
 */

/**
 * A per-axis size source. Supplies the provided size of one item plus the axis defaults.
 */
export interface AxisSizeSource {
  /**
   * The provided size in px for one item, or `undefined` when no size is provided (the caller then
   * applies `getDefaultSize()`). Must be a cheap, pure lookup — it is called O(n) on a cache rebuild.
   *
   * @param {number} sourceIndex The source index of the item.
   * @returns {number | undefined}
   */
  getSize(sourceIndex: number): number | undefined;

  /**
   * The default size in px for items with no provided size.
   *
   * @returns {number}
   */
  getDefaultSize(): number;

  /**
   * Whether every item is guaranteed to be `getDefaultSize()`. Enables the O(1) arithmetic fast path
   * in the prefix-sum cache. Must be conservative — return `false` whenever any per-item override may
   * exist.
   *
   * @returns {boolean}
   */
  isUniform(): boolean;
}

/**
 * The row-height source. Adds the per-overlay height override used by frozen rows.
 */
export interface RowSizeSource extends AxisSizeSource {
  /**
   * The provided height in px for one row within a specific overlay, or `undefined` when none is
   * provided. Lets a plugin vary a row's height per overlay (top/bottom/master).
   *
   * @param {number} sourceIndex The source index of the row.
   * @param {string} overlayName The overlay name.
   * @returns {number | undefined}
   */
  getSizeForOverlay(sourceIndex: number, overlayName: string): number | undefined;
}

/**
 * The column-width source. No extra members beyond the base today.
 */
export type ColumnSizeSource = AxisSizeSource;
