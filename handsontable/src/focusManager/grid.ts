import type { HotInstance } from '../core/types';
import { warn } from '../helpers/console';
import { isHTMLElement, isOutsideInput } from '../helpers/dom/element';
import { debounce } from '../helpers/function';

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
 * Manages the browser's focus in the table to achieve correct behavior for screen readers and
 * IME editors.
 */
type FocusMode = 'cell' | 'mixed';

interface ActiveEditorInstance {
  TEXTAREA?: HTMLTextAreaElement;
  isOpened?: () => boolean;
  refreshValue?: () => void;
  [key: string]: unknown;
}

export class FocusGridManager {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The currently enabled focus mode.
   * Can be either:
   *
   * - 'cell' - The browser's focus stays on the lastly selected cell element.
   * - 'mixed' - The browser's focus switches from the lastly selected cell element to the currently active editor's
   * `TEXTAREA` element after a delay defined in the manager.
   *
   * @type {'cell' | 'mixed'}
   */
  #focusMode: FocusMode;
  /**
   * The delay after which the focus switches from the lastly selected cell to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @type {number}
   */
  #refocusDelay = 1;
  /**
   * Getter function for the element to be used when refocusing the browser after a delay. If `null`, the active
   * editor's `TEXTAREA` element will be used.
   *
   * @type {null|Function}
   */
  #refocusElementGetter: (() => HTMLElement) | null = null;
  /**
   * Map of the debounced `select` functions.
   *
   * @type {Map<number, Function>}
   */
  #debouncedSelect = new Map();
  /**
   * Flag to indicate if the selection has changed.
   *
   * @type {boolean}
   */
  #hasSelectionChange = false;
  /**
   * Flag indicating whether automatic focus management for the upcoming selection cycle is suspended.
   * When `true`, `#focusCell` does not steal an externally focused input/textarea/select element,
   * and `#focusEditorElement` does not refocus the editor textarea. Set with `suspend()` and
   * cleared with `resume()`. Mirrors the `viewportScroller.suspend()/resume()` pattern.
   *
   * @type {boolean}
   */
  #isSuspended = false;

  constructor(hotInstance: HotInstance) {
    this.#hot = hotInstance;
  }

  init() {
    const hotSettings = this.#hot.getSettings();

    this.#focusMode = hotSettings.imeFastEdit ? FOCUS_MODES.MIXED : FOCUS_MODES.CELL;

    this.#hot.addHook('afterUpdateSettings',
      (...args: unknown[]) => this.#onUpdateSettings(args[0] as Record<string, unknown>));
    this.#hot.addHook('afterSelection', (...args: unknown[]) => this.#onAfterSelectionChange());
    this.#hot.addHook('afterSelectionFocusSet', (...args: unknown[]) => this.#onAfterSelectionChange());
    this.#hot.addHook('afterSelectionEnd', (...args: unknown[]) => this.#focusEditorElement());
    this.#hot.addHook('afterRender', (...args: unknown[]) => this.#onAfterRender());
  }

  /**
   * Get the current focus mode.
   *
   * @returns {'cell' | 'mixed'}
   */
  getFocusMode(): FocusMode {
    return this.#focusMode;
  }

  /**
   * Set the focus mode.
   *
   * @param {'cell' | 'mixed'} focusMode The new focus mode.
   */
  setFocusMode(focusMode: FocusMode): void {
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
  getRefocusDelay(): number {
    return this.#refocusDelay;
  }

  /**
   * Set the delay after which the focus will change from the cell elements to the active editor's `TEXTAREA`
   * element if the focus mode is set to 'mixed'.
   *
   * @param {number} delay Delay in milliseconds.
   */
  setRefocusDelay(delay: number): void {
    this.#refocusDelay = delay;
  }

  /**
   * Set the function to be used as the "refocus element" getter. It should return a focusable HTML element.
   *
   * @param {Function} getRefocusElementFunction The refocus element getter.
   */
  setRefocusElementGetter(getRefocusElementFunction: () => HTMLElement): void {
    this.#refocusElementGetter = getRefocusElementFunction;
  }

  /**
   * Suspend automatic focus management until `resume()` is called. While suspended, an
   * externally focused element (input, textarea, select, or contenteditable located outside
   * Handsontable) keeps the browser focus when a programmatic selection is applied, and the
   * editor textarea is not auto-refocused (`imeFastEdit`). Used by `selectCells()` when
   * `changeListener` is `false`. Note: an `activeElement` of `<body>` or an `<iframe>` element
   * does not count as an external input - in those cases focus still moves to the cell.
   *
   * @since 17.0.2
   */
  suspend() {
    this.#isSuspended = true;
  }

  /**
   * Resume automatic focus management. Pair with a prior `suspend()` call.
   *
   * @since 17.0.2
   */
  resume() {
    this.#isSuspended = false;
  }

  /**
   * Get the element to be used when refocusing the browser after a delay in case of the focus mode being 'mixed'.
   *
   * @returns {HTMLTextAreaElement|HTMLElement|undefined}
   */
  getRefocusElement(): HTMLElement | void {
    if (typeof this.#refocusElementGetter === 'function') {
      return this.#refocusElementGetter();
    }

    return (this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.TEXTAREA;
  }

  /**
   * Moves the browser focus to a connected `HTMLElement`. Plugins should call this instead of
   * `element.focus()` so programmatic focus stays in the focus manager layer.
   *
   * @param {HTMLElement} element The element to focus.
   * @param {FocusOptions} [focusOptions] Optional arguments for the native `focus()` call.
   * @returns {boolean} `true` if `focus()` was called, `false` if `element` is not a connected `HTMLElement`.
   */
  focusElement(element: HTMLElement, focusOptions?: FocusOptions) {
    if (!isHTMLElement(element) || !element.isConnected) {
      return false;
    }

    element.focus(focusOptions);

    return true;
  }

  /**
   * Set the browser's focus to the highlighted cell of the last selection.
   *
   * @param {HTMLTableCellElement} [selectedCell] The highlighted cell/header element.
   */
  focusOnHighlightedCell(selectedCell?: HTMLTableCellElement | null): void {
    const focusElement = (element: HTMLElement | null) => {
      const currentHighlightCoords = this.#hot.getSelectedRangeActive()?.highlight;

      if (!currentHighlightCoords) {
        return;
      }

      let elementToBeFocused = this.#hot.runHooks(
        'modifyFocusedElement', currentHighlightCoords.row, currentHighlightCoords.col, element
      );

      if (!isHTMLElement(elementToBeFocused)) {
        elementToBeFocused = element;
      }

      if (
        elementToBeFocused &&
        !(this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.isOpened()
      ) {
        this.focusElement(elementToBeFocused as HTMLElement, { preventScroll: true });
      }
    };

    if (selectedCell) {
      focusElement(selectedCell);
    } else {
      this.#getSelectedCell(element => focusElement(element));
    }
  }

  /**
   * Set the focus to the active editor's `TEXTAREA` element after the provided delay. If no delay is provided, it
   * will be taken from the manager's configuration.
   *
   * @param {number} [delay] Delay in milliseconds.
   */
  refocusToEditorTextarea(delay = this.#refocusDelay) {
    // Re-focus on the editor's `TEXTAREA` element (or a predefined element) if the `imeFastEdit` option is enabled.
    if (
      this.#hot.getSettings().imeFastEdit &&
      !(this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.isOpened()
    ) {
      (this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.refreshValue?.();

      if (!this.#debouncedSelect.has(delay)) {
        this.#debouncedSelect.set(delay, debounce(() => {
          if (!this.#hot.isDestroyed) {
            (this.getRefocusElement() as HTMLTextAreaElement)?.select();
          }
        }, delay));
      }

      this.#debouncedSelect.get(delay)();
    }
  }

  /**
   * Get and return the currently selected and highlighted cell/header element.
   *
   * @param {Function} callback Callback function to be called after the cell element is retrieved.
   */
  #getSelectedCell(callback: (element: HTMLTableCellElement | null) => void): void {
    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    if (!highlight || !this.#hot.selection.isCellVisible(highlight)) {
      callback(null);

      return;
    }

    const cell = this.#hot.getCell(highlight.row, highlight.col, true);

    if (cell === null) {
      this.#hot.addHookOnce('afterScroll', () => {
        callback(this.#hot.getCell(highlight.row, highlight.col, true));
      });

    } else {
      callback(cell);
    }
  }

  /**
   * Manage the browser's focus after each cell selection change.
   */
  #focusCell() {
    // Capture the suspend flag synchronously. `#getSelectedCell` may defer its callback via
    // `afterScroll` when the target cell is not yet rendered, by which time `resume()` may
    // have run. Reading `this.#isSuspended` inside the callback would miss the suspend window.
    const suspended = this.#isSuspended;

    this.#getSelectedCell((selectedCell) => {
      const activeElement = this.#hot.rootDocument.activeElement as HTMLElement | null;

      // When focus management is suspended and an external focusable element (outside Handsontable)
      // currently owns the browser focus, keep it - do not blur and do not move focus to the cell.
      // This preserves the focus of inputs that live next to the grid when a programmatic selection
      // is applied via `selectCells(..., changeListener = false)`. See #10038.
      if (suspended && activeElement && isOutsideInput(activeElement)) {
        return;
      }

      // Blurring the `activeElement` removes the unwanted border around the focusable element (#6877)
      // and resets the `document.activeElement` property. The blurring should happen only when the
      // previously selected input element has not belonged to the Handsontable editor. If blurring is
      // triggered for all elements, there is a problem with the disappearing IME editor (#9672).
      if (activeElement && isOutsideInput(activeElement)) {
        activeElement.blur();
      }

      this.focusOnHighlightedCell(selectedCell);
    });
  }

  /**
   * Manage the browser's focus after cell selection end.
   */
  #focusEditorElement() {
    // When focus management is suspended and an external focusable element (outside Handsontable)
    // currently owns the browser focus, skip the `imeFastEdit` refocus - otherwise the debounced
    // `select()` on the editor textarea would steal that external focus. When no external element
    // owns focus, fall through so the default `imeFastEdit` behavior still moves focus to the
    // editor textarea (existing per-editor IME support tests rely on this). See #10038.
    if (this.#isSuspended) {
      const activeElement = this.#hot.rootDocument.activeElement as HTMLElement | null;

      if (activeElement && isOutsideInput(activeElement)) {
        return;
      }
    }

    this.#getSelectedCell((selectedCell) => {
      if (
        this.getFocusMode() === FOCUS_MODES.MIXED &&
        selectedCell?.nodeName === 'TD'
      ) {
        this.refocusToEditorTextarea();
      }
    });
  }

  /**
   * Handle the after selection change event.
   */
  #onAfterSelectionChange() {
    this.#hasSelectionChange = true;
  }

  /**
   * Focuses the cell after the render event when the selection has changed.
   */
  #onAfterRender() {
    if (this.#hasSelectionChange) {
      this.#hasSelectionChange = false;
      this.#focusCell();
    }
  }

  /**
   * Update the manager configuration after calling `updateSettings`.
   *
   * @param {object} newSettings The new settings passed to the `updateSettings` method.
   */
  #onUpdateSettings(newSettings: Record<string, unknown>): void {
    if (typeof newSettings.imeFastEdit === 'boolean') {
      this.setFocusMode(newSettings.imeFastEdit ? FOCUS_MODES.MIXED : FOCUS_MODES.CELL);
    }
  }
}
