import { warn } from './helpers/console';

/**
 * Possible focus modes.
 * - CELL - The browser's focus stays on the lastly selected cell element.
 * - MIXED - The browser's focus switches from the lastly selected cell element to the currently active editor's
 * `TEXTAREA` element after a delay defined in the manager.
 *
 * @type {{CELL: string, MIXED: string}}
 */
const FOCUS_MODES = {
  CELL: 'cell',
  MIXED: 'mixed',
};

/**
 * Manages the browser's focus in the table.
 */
export default class FocusManager {
  constructor(hotInstance) {
    const hotSettings = hotInstance.getSettings();

    /**
     * The Handsontable instance.
     *
     * @private
     */
    this._hot = hotInstance;

    /**
     * The currently enabled focus mode.
     * Can be either:
     *
     * - 'cell' - The browser's focus stays on the lastly selected cell element.
     * - 'mixed' - The browser's focus switches from the lastly selected cell element to the currently active editor's
     * `TEXTAREA` element after a delay defined in the manager.
     *
     * @type {string}
     * @private
     */
    this._focusMode = hotSettings.imeFastEdit ? FOCUS_MODES.MIXED : FOCUS_MODES.CELL;

    /**
     * The delay after which the focus switches from the lastly selected cell to the active editor's `TEXTAREA`
     * element if the focus mode is set to 'mixed'.
     *
     * @type {number}
     * @private
     */
    this._refocusDelay = 50;

    /**
     * Getter function for the element to be used when refocusing the browser after a delay. If `null`, the active
     * editor's `TEXTAREA` element will be used.
     *
     * @type {null|Function}
     * @private
     */
    this._refocusElementGetter = null;

    this._hot.addHook('afterUpdateSettings', (...args) => this.#onUpdateSettings(...args));
    this._hot.addHook('afterSelectionEnd', (...args) => this.#manageFocus(...args));
  }

  /**
   * Get the current focus mode.
   *
   * @returns {string}
   */
  getFocusMode() {
    return this._focusMode;
  }

  /**
   * Set the focus mode.
   *
   * @param {string} focusMode The new focus mode.
   */
  setFocusMode(focusMode) {
    if (Object.values(FOCUS_MODES).includes(focusMode)) {
      this._focusMode = focusMode;

    } else {
      warn(`"${focusMode}" is not a valid focus mode.`);
    }
  }

  /**
   * Get the delay after which the focus will change from the cell elements to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @returns {number} Delay in milliseconds.
   */
  getRefocusDelay() {
    return this._refocusDelay;
  }

  /**
   * Set the delay after which the focus will change from the cell elements to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @param {number} delay Delay in milliseconds.
   */
  setRefocusDelay(delay) {
    this._refocusDelay = delay;
  }

  /**
   * Set the function to be used as the "refocus element" getter. It should return a focusable HTML element.
   *
   * @param {Function} getRefocusElementFunction The refocus element getter.
   */
  setRefocusElementGetter(getRefocusElementFunction) {
    this._refocusElementGetter = getRefocusElementFunction;
  }

  /**
   * Get the element to be used when refocusing the browser after a delay in case of the focus mode being 'mixed'.
   *
   * @returns {HTMLTextAreaElement|HTMLElement|undefined}
   */
  getRefocusElement() {
    if (this._refocusElementGetter !== null) {
      return this._refocusElementGetter();

    } else {
      return this._hot.getActiveEditor()?.TEXTAREA;
    }
  }

  /**
   * Set the browser's focus to the highlighted cell of the last selection.
   */
  focusOnHighlightedCell() {
    const lastSelectedRange = this._hot.getSelectedRangeLast();
    const selectedCellCoords = lastSelectedRange.highlight;
    const selectedCell = this._hot.getCell(selectedCellCoords.row, selectedCellCoords.col);

    if (
      selectedCell &&
      !this._hot.getActiveEditor()?.isOpened()
    ) {
      this._hot.getCell(selectedCellCoords.row, selectedCellCoords.col).focus({
        preventScroll: true
      });
    }
  }

  /**
   * Set the focus to the active editor's `TEXTAREA` element after the provided delay. If no delay is provided, it
   * will be taken from the manager's configuration.
   *
   * @param {number} delay Delay in milliseconds.
   */
  refocusToEditorTextarea(delay = this._refocusDelay) {
    const refocusElement = this.getRefocusElement();

    // Re-focus on the editor's `TEXTAREA` element (or a predefined element) if the `imeFastEdit` option is enabled.
    if (
      this._hot.getSettings().imeFastEdit &&
      !!refocusElement
    ) {
      this._hot._registerTimeout(() => {
        refocusElement.select();
      }, delay);
    }
  }

  /**
   * Manage the browser's focus after cell selection.
   *
   * @private
   */
  #manageFocus() {
    this.focusOnHighlightedCell();

    if (this.getFocusMode() === FOCUS_MODES.MIXED) {
      this.refocusToEditorTextarea();
    }
  }

  /**
   * Update the manager configuration after calling `updateSettings`.
   *
   * @private
   * @param {object} newSettings The new settings passed to the `updateSettings` method.
   */
  #onUpdateSettings(newSettings) {
    if (newSettings.imeFastEdit && this.getFocusMode() !== FOCUS_MODES.MIXED) {
      this.setFocusMode(FOCUS_MODES.MIXED);

    } else if (!newSettings.imeFastEdit && this.getFocusMode() !== FOCUS_MODES.CELL) {
      this.setFocusMode(FOCUS_MODES.CELL);
    }
  }
}
