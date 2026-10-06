import { defineGetter } from '../../../../../helpers/object';
import type Table from '../baseTable';

const MIXIN_NAME = 'stickyColumnsEnd';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to columns.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use sticky rendering of the last columns in the horizontal axis (`fixedColumnsEnd`).
 *
 * It is the column counterpart of `stickyRowsBottom`: the rendered columns are the LAST ones, so the
 * source index of the first rendered column is `totalColumns - renderedColumnsCount`. Row headers belong
 * to the inline-start tables only, so this mixin renders none.
 *
 * @type {object}
 */
const stickyColumnsEnd = {
  /**
   * Get the source index of the first rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedColumn(this: Table) {
    const allStickyColumns = this.getRenderedColumnsCount();

    if (allStickyColumns === 0) {
      return -1;
    }

    return (this.wtSettings.getSetting('totalColumns') ?? 0) - allStickyColumns;
  },

  /**
   * Get the source index of the first column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleColumn(this: Table): number {
    return this.getFirstRenderedColumn() as number;
  },

  /**
   * Get the source index of the first column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleColumn(this: Table): number {
    return this.getFirstRenderedColumn() as number;
  },

  /**
   * Get the source index of the last rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedColumn(this: Table) {
    const allStickyColumns = this.getRenderedColumnsCount();

    if (allStickyColumns === 0) {
      return -1;
    }

    return (this.wtSettings.getSetting('totalColumns') ?? 0) - 1;
  },

  /**
   * Get the source index of the last column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleColumn(this: Table): number {
    return this.getLastRenderedColumn() as number;
  },

  /**
   * Get the source index of the last column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleColumn(this: Table): number {
    return this.getLastRenderedColumn() as number;
  },

  /**
   * Get the number of rendered columns. The setting is already clamped against `fixedColumnsStart`
   * by `Settings#getSetting`.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedColumnsCount(this: Table) {
    const fixedColumnsEnd = this.wtSettings.getSetting('fixedColumnsEnd');

    // Most grids have no end band: skip the column count then.
    return fixedColumnsEnd > 0 ? Math.min(this.wtSettings.getSetting('totalColumns') ?? 0, fixedColumnsEnd) : 0;
  },

  /**
   * Get the number of fully visible columns in the viewport.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleColumnsCount(this: Table): number {
    return this.getRenderedColumnsCount() as number;
  },

  /**
   * Get the number of rendered row headers. Row headers belong to the inline-start tables only.
   *
   * @returns {number}
   * @this Table
   */
  getRowHeadersCount(this: Table): number {
    return 0;
  },
};

defineGetter(stickyColumnsEnd, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyColumnsEnd;
