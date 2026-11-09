/**
 * How far above the default row height a measured row can sit and still count as a default-height
 * row, in CSS pixels. Both numbers are read off the same layout, so they differ by the layout grid
 * (1/64px) at most; the margin is a few of those steps.
 */
export const DEFAULT_HEIGHT_TOLERANCE = 0.05;

/**
 * Turns the height the ghost table measured for a row into the height AutoRowSize stores.
 *
 * A row taller than the default is rounded UP to a whole pixel, so the row has room for its content.
 * A row laid out at `118.27px` stored as `118` is `0.27px` short in the row-header clone, which is
 * written the stored height, while the master keeps sizing the row from its own content, and the
 * shortfall stacks row after row.
 *
 * A row at the default height keeps the plain rounding. Below 100% browser zoom a browser inflates
 * the cells' 1px border, so a default row measures a fraction above a whole pixel (`29.11px`);
 * rounding that up would make every default row a pixel taller than it renders.
 *
 * @param {number} measuredHeight The height of the sampled row, snapped to the layout grid.
 * @param {number} defaultHeight The default row height.
 * @returns {number} The whole-pixel height to store for the row.
 */
export function toStoredRowHeight(measuredHeight: number, defaultHeight: number): number {
  return measuredHeight <= defaultHeight + DEFAULT_HEIGHT_TOLERANCE ?
    Math.round(measuredHeight) : Math.ceil(measuredHeight);
}
