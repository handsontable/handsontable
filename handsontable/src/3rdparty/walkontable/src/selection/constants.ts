/**
 * Selection type that is visible only if the row or column header is clicked. If that happened
 * all row or column header layers are highlighted.
 *
 * @type {string}
 */
export const ACTIVE_HEADER_TYPE: string = 'active-header';
/**
 * Selection type that is visible only if the a cell or cells are clicked. If that happened
 * only the most closest to the cells row or column header is highlighted.
 *
 * @type {string}
 */
export const HEADER_TYPE: string = 'header';
/**
 * Selection type that is visible when a cell or cells are clicked. The selected cells are
 * highlighted.
 *
 * @type {string}
 */
export const AREA_TYPE: string = 'area';
/**
 * Selection type defines a cell that follows the user (keyboard navigation).
 *
 * @type {string}
 */
export const FOCUS_TYPE: string = 'focus';
/**
 * Selection type defines borders for the autofill functionality.
 *
 * @type {string}
 */
export const FILL_TYPE: string = 'fill';
/**
 * Selection type defines highlights for the `currentRowClassName` option.
 *
 * @type {string}
 */
export const ROW_TYPE: string = 'row';
/**
 * Selection type defines highlights for the `currentColumnClassName` option.
 *
 * @type {string}
 */
export const COLUMN_TYPE: string = 'column';
/**
 * Selection type defines highlights managed by the CustomBorders plugin.
 *
 * @type {string}
 */
export const CUSTOM_SELECTION_TYPE: string = 'custom-selection';
