/**
 * Manages the theme variables value.
 */
export class StylesManager {
  /**
   * The Handsontable instance.
   */
  #hot;
  /**
   * Keeps a value of cell vertical padding css variable.
   *
   * @type {number}
   */
  cellVerticalPadding;

  constructor(hotInstance) {
    this.#hot = hotInstance;

    this.cellVerticalPadding = parseInt(
      getComputedStyle(this.#hot.rootElement)?.getPropertyValue('--ht-cell-horizontal-padding') || 0,
      10
    );
  }

  /**
   * Get the cell vertical padding value.
   *
   * @returns {number}
   */
  getCellVerticalPadding() {
    return this.cellVerticalPadding;
  }
}
