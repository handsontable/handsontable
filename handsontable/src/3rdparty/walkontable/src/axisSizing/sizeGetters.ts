/**
 * Size getters for `Table` and every subclass.
 *
 * These read the per-row / per-column sizes (through `RowUtils` / `ColumnUtils`) and the rendered
 * table box (through the `GeometryReader`). They are universal — every table type (master and each
 * overlay clone) needs them — so the mixin is applied once to the base `Table` (`mixin(Table,
 * sizeGetters)` in `baseTable.ts`) and inherited by all subclasses. The methods run on the `Table`
 * instance (`this`), reading its public fields (`rowUtils`/`columnUtils`/`TABLE`/`hider`/
 * `hasTableWidth`/`hasTableHeight`) and the geometry-read port via the `deps` getter.
 */
import { isVisible } from '../../../../helpers/dom/element';
import type { default as Table } from '../table/baseTable';

/**
 * Size getters, mixed into every `Table` type.
 */
export interface SizeGetters {
  getRowHeight(sourceRow: number): number;
  getColumnHeaderHeight(level: number): number;
  getColumnWidth(sourceColumn: number): number;
  hasDefinedSize(): boolean;
  getWidth(): number;
  getHeight(): number;
  getTotalWidth(): number;
  getTotalHeight(): number;
  isVisible(): boolean;
}

const sizeGetters = {
  /**
   * @param {number} sourceRow The physical row index.
   * @returns {number}
   * @this Table
   */
  getRowHeight(this: Table, sourceRow: number) {
    return this.rowUtils.getHeight(sourceRow);
  },

  /**
   * @param {number} level The column level.
   * @returns {number}
   * @this Table
   */
  getColumnHeaderHeight(this: Table, level: number) {
    return this.columnUtils.getHeaderHeight(level);
  },

  /**
   * @param {number} sourceColumn The physical column index.
   * @returns {number}
   * @this Table
   */
  getColumnWidth(this: Table, sourceColumn: number): number {
    return this.columnUtils.getWidth(sourceColumn) as number;
  },

  /**
   * Checks if the table has defined size. It returns `true` when the table has width and height
   * set bigger than `0px`.
   *
   * @returns {boolean}
   * @this Table
   */
  hasDefinedSize(this: Table) {
    return this.hasTableHeight && this.hasTableWidth;
  },

  /**
   * Gets table's width. The returned width is the width of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns {number}
   * @this Table
   */
  getWidth(this: Table) {
    return this.deps.geometryReader.outerWidth(this.TABLE);
  },

  /**
   * Gets table's height. The returned height is the height of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns {number}
   * @this Table
   */
  getHeight(this: Table) {
    return this.deps.geometryReader.outerHeight(this.TABLE);
  },

  /**
   * Gets table's total width. The returned width is the width of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns {number}
   * @this Table
   */
  getTotalWidth(this: Table) {
    const width = this.deps.geometryReader.outerWidth(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then width from the table element
    return width !== 0 ? width : this.getWidth();
  },

  /**
   * Gets table's total height. The returned height is the height of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns {number}
   * @this Table
   */
  getTotalHeight(this: Table) {
    const height = this.deps.geometryReader.outerHeight(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then height from the table element
    return height !== 0 ? height : this.getHeight();
  },

  /**
   * Checks if the table is visible. It returns `true` when the holder element (or its parents)
   * has CSS 'display' property different than 'none'.
   *
   * @returns {boolean}
   * @this Table
   */
  isVisible(this: Table) {
    return isVisible(this.TABLE);
  },
};

export default sizeGetters;
