import { warn } from './helpers/console';
import { isOutsideInput } from './helpers/dom/element';

/**
 * Possible focus modes.
 * - CELL - The browser's focus stays on the lastly selected cell element.
 * - MIXED - The browser's focus switches from the lastly selected cell element to the currently active editor's
 * `TEXTAREA` element after a delay defined in the manager.
 *
 * @type {{CELL: string, MIXED: string}}
 */
const FOCUS_MODES = Object.freeze({
  CELL: 'cell',
  MIXED: 'mixed',
});

/**
 * Manages the browser's focus in the table.
 */
export class FocusManager {
  /**
   * The Handsontable instance.
   */
  #hot;
  /**
   * The currently enabled focus mode.
   * Can be either:
   *
   * - 'cell' - The browser's focus stays on the lastly selected cell element.
   * - 'mixed' - The browser's focus switches from the lastly selected cell element to the currently active editor's
   * `TEXTAREA` element after a delay defined in the manager.
   *
   * @type {string}
   */
  #focusMode;
  /**
   * The delay after which the focus switches from the lastly selected cell to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @type {number}
   */
  #refocusDelay = 50;
  /**
   * Getter function for the element to be used when refocusing the browser after a delay. If `null`, the active
   * editor's `TEXTAREA` element will be used.
   *
   * @type {null|Function}
   */
  #refocusElementGetter = null;

  constructor(hotInstance) {
    const hotSettings = hotInstance.getSettings();

    this.#hot = hotInstance;
    this.#focusMode = hotSettings.imeFastEdit ? FOCUS_MODES.MIXED : FOCUS_MODES.CELL;

    this.#hot.addHook('afterUpdateSettings', (...args) => this.#onUpdateSettings(...args));
    this.#hot.addHook('afterSelection', (...args) => this.#manageFocus(...args));
  }

  /**
   * Get the current focus mode.
   *
   * @returns {'cell' | 'mixed'}
   */
  getFocusMode() {
    return this.#focusMode;
  }

  /**
   * Set the focus mode.
   *
   * @param {'cell' | 'mixed'} focusMode The new focus mode.
   */
  setFocusMode(focusMode) {
    if (Object.values(FOCUS_MODES).includes(focusMode)) {
      this.#focusMode = focusMode;

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
    return this.#refocusDelay;
  }

  /**
   * Set the delay after which the focus will change from the cell elements to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @param {number} delay Delay in milliseconds.
   */
  setRefocusDelay(delay) {
    this.#refocusDelay = delay;
  }

  /**
   * Set the function to be used as the "refocus element" getter. It should return a focusable HTML element.
   *
   * @param {Function} getRefocusElementFunction The refocus element getter.
   */
  setRefocusElementGetter(getRefocusElementFunction) {
    this.#refocusElementGetter = getRefocusElementFunction;
  }

  /**
   * Get the element to be used when refocusing the browser after a delay in case of the focus mode being 'mixed'.
   *
   * @returns {HTMLTextAreaElement|HTMLElement|undefined}
   */
  getRefocusElement() {
    if (typeof this.#refocusElementGetter === 'function') {
      return this.#refocusElementGetter();

    } else {
      return this.#hot.getActiveEditor()?.TEXTAREA;
    }
  }

  /**
   * Set the browser's focus to the highlighted cell of the last selection.
   *
   * @param {HTMLTableCellElement} [selectedCell] The highlighted cell/header element.
   */
  focusOnHighlightedCell(selectedCell) {
    const currentHighlightCoords = this.#getCurrentHighlightCoords();
    const currentlySelectedHighlight = selectedCell || this.#getSelectedCell();

    let elementToBeFocused = this.#hot.runHooks(
      'modifyFocusedElement', currentHighlightCoords.row, currentHighlightCoords.col, currentlySelectedHighlight
    );

    if (!(elementToBeFocused instanceof HTMLElement)) {
      elementToBeFocused = currentlySelectedHighlight;
    }

    if (
      elementToBeFocused &&
      !this.#hot.getActiveEditor()?.isOpened()
    ) {
      elementToBeFocused.focus({
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
  refocusToEditorTextarea(delay = this.#refocusDelay) {
    const refocusElement = this.getRefocusElement();

    // Re-focus on the editor's `TEXTAREA` element (or a predefined element) if the `imeFastEdit` option is enabled.
    if (
      this.#hot.getSettings().imeFastEdit &&
      !!refocusElement
    ) {
      this.#hot._registerTimeout(() => {
        refocusElement.select();
      }, delay);
    }
  }

  /**
   * Get the coordinates of the highlight of the currently selected cell/header.
   *
   * @returns {CellCoords}
   */
  #getCurrentHighlightCoords() {
    const lastSelectedRange = this.#hot.getSelectedRangeLast();

    return lastSelectedRange.highlight;
  }

  /**
   * Get and return the currently selected and highlighted cell/header element.
   *
   * @private
   * @returns {HTMLTableCellElement}
   */
  #getSelectedCell() {
    const selectedCellCoords = this.#getCurrentHighlightCoords();

    return this.#hot.getCell(selectedCellCoords.row, selectedCellCoords.col, true);
  }

  /**
   * Manage the browser's focus after cell selection.
   *
   * @private
   */
  #manageFocus() {
    const selectedCell = this.#getSelectedCell();
    const { activeElement } = this.#hot.rootDocument;

    // Blurring the `activeElement` removes the unwanted border around the focusable element (#6877)
    // and resets the `document.activeElement` property. The blurring should happen only when the
    // previously selected input element has not belonged to the Handsontable editor. If blurring is
    // triggered for all elements, there is a problem with the disappearing IME editor (#9672).
    if (activeElement && isOutsideInput(activeElement)) {
      activeElement.blur();
    }

    this.focusOnHighlightedCell(selectedCell);

    if (
      this.getFocusMode() === FOCUS_MODES.MIXED &&
      selectedCell.nodeName === 'TD'
    ) {
      this.#hot.addHookOnce('afterSelectionEnd', () => {
        this.refocusToEditorTextarea();
      });
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
