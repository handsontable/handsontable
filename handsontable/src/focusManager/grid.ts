import type { HotInstance } from '../core/types';
import EventManager from '../eventManager';
import { hasCellChangedSinceAnnounced, rebuildAccessibilityObject, rememberAnnouncedCell } from '../helpers/a11y';
import { warn } from '../helpers/console';
import {
  getDeepActiveElement,
  getShadowHostChain,
  isHTMLElement,
  isInternalElement,
  isOutsideInput,
} from '../helpers/dom/element';
import { debounce } from '../helpers/function';
import { isRootInstance } from '../utils/rootInstance';

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

/**
 * Which caller waits for the selected cell to be rendered. A caller that asks again for the same
 * cell replaces its own earlier callback.
 */
type PendingScrollPurpose = 'focusCell' | 'focusEditorElement' | 'focusOnHighlightedCell';

type SelectedCellCallback = (element: HTMLTableCellElement | null) => void;

/**
 * The work that waits for the next `afterScroll` because the highlighted cell was not rendered when
 * it was asked for.
 */
interface PendingScroll {
  row: number;
  col: number;
  callbacks: Map<PendingScrollPurpose, SelectedCellCallback>;
  hook: () => void;
}

interface ActiveEditorInstance {
  TEXTAREA?: HTMLTextAreaElement;
  isOpened?: () => boolean;
  refreshValue?: () => void;
  [key: string]: unknown;
}

/**
 * Manages browser focus within the grid to ensure correct behavior for keyboard navigation,
 * screen readers, and IME text composition.
 */
export class FocusGridManager {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * Event manager used for the DOM listeners that track the browser focus within the grid.
   *
   * @type {EventManager}
   */
  #eventManager: EventManager | null = null;
  /**
   * Tracks whether the browser focus currently sits inside the grid's root wrapper or portal.
   * Maintained by `focusin`/`focusout` listeners bound within the grid's own DOM tree, where
   * sandboxed hosts (e.g. Salesforce Lightning Web Security) still report true event targets -
   * unlike `document.activeElement`, which such hosts collapse to the outermost shadow host.
   *
   * @type {boolean}
   */
  #hasBrowserFocus = false;
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
  #focusMode!: FocusMode;
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
   * Suspend flag captured when the selection changed, until render applies it.
   * `null` means nothing is waiting. `false` still moves focus, so absence is `null`.
   * `batch()` and `suspendRender()` defer that render until after `resume()` clears
   * `#isSuspended`, and `#getSelectedCell` can defer its callback until `afterScroll`.
   *
   * @type {boolean | null}
   */
  #pendingFocus: boolean | null = null;
  /**
   * The callbacks waiting for the next `afterScroll` because the highlighted cell is not rendered.
   * There is at most one entry, and its single `afterScroll` listener is removed as soon as the
   * highlight moves to another cell or the selection is cleared, so a scroll that comes later never
   * runs work for a cell the user has left. `null` means nothing is waiting.
   *
   * @type {PendingScroll | null}
   */
  #pendingScroll: PendingScroll | null = null;
  /**
   * Flag indicating whether automatic focus management for the upcoming selection cycle is suspended.
   * When `true`, `#focusCell` does not steal an externally focused input/textarea/select element,
   * and `#focusEditorElement` does not refocus the editor textarea. Set with `suspend()` and
   * cleared with `resume()`. Mirrors the `viewportScroller.suspend()/resume()` pattern.
   *
   * @type {boolean}
   */
  #isSuspended = false;
  /**
   * How many `keepForeignFocusWhile()` calls are running. While it is above zero, a selection that is laid again
   * does not take the browser focus from an element outside the grid.
   *
   * @type {number}
   */
  #keepForeignFocusDepth = 0;
  /**
   * Whether the selection change that is waiting for the next render happened inside `keepForeignFocusWhile()`.
   * Written by every selection change, so a later change made outside the scope takes the focus as usual.
   *
   * @type {boolean}
   */
  #pendingKeepsForeignFocus = false;
  /**
   * Plugin-owned elements outside the grid's root element that a press inside does not deselect
   * (see `registerOutsideClickExemptElement()`).
   *
   * @type {Set<HTMLElement>}
   */
  #outsideClickExemptElements = new Set<HTMLElement>();

  /**
   * Initializes the manager with a reference to the Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    this.#hot = hotInstance;
  }

  /**
   * Registers hooks to track selection changes and apply focus logic based on the configured focus mode.
   */
  init() {
    const hotSettings = this.#hot.getSettings();

    this.#focusMode = hotSettings.imeFastEdit ? FOCUS_MODES.MIXED : FOCUS_MODES.CELL;

    this.#hot.addHook('afterUpdateSettings',
      (...args: unknown[]) => this.#onUpdateSettings(args[0] as Record<string, unknown>));
    this.#hot.addHook('afterSelection', (...args: unknown[]) => this.#onAfterSelectionChange());
    this.#hot.addHook('afterSelectionFocusSet', (...args: unknown[]) => this.#onAfterSelectionChange());
    this.#hot.addHook('afterDeselect', () => this.#cancelPendingScroll());
    this.#hot.addHook('afterSelectionEnd', (...args: unknown[]) => this.#focusEditorElement());
    this.#hot.addHook('afterRender', (...args: unknown[]) => this.#onAfterRender());

    this.#eventManager = new EventManager(this.#hot);

    const focusRootElements = [this.#hot.rootWrapperElement ?? this.#hot.rootElement, this.#hot.rootPortalElement]
      .filter(element => isHTMLElement(element));

    focusRootElements.forEach((focusRootElement) => {
      this.#eventManager!.addEventListener(focusRootElement, 'focusin', () => {
        this.#hasBrowserFocus = true;
      });

      this.#eventManager!.addEventListener(focusRootElement, 'focusout', (event) => {
        const relatedTarget = (event as FocusEvent).relatedTarget;

        this.#hasBrowserFocus = isHTMLElement(relatedTarget) &&
          focusRootElements.some(focusRoot => focusRoot.contains(relatedTarget));
      });
    });
  }

  /**
   * Checks whether the browser focus currently sits inside the grid's root wrapper or portal.
   * The state comes from focus events observed within the grid's own DOM tree, so it stays
   * correct in environments where `document.activeElement` cannot be resolved through foreign
   * shadow boundaries.
   *
   * @returns {boolean}
   */
  hasBrowserFocus(): boolean {
    return this.#hasBrowserFocus;
  }

  /**
   * Returns the visual row of the highlighted cell that the manager gives the browser focus to after the next
   * render, because the selection changed since the last one. `null` when no selection change waits for the render,
   * when the highlight is a header or a hidden cell, and while an editor is open (its input keeps the focus).
   *
   * The view reads it while the render runs: when the rows renderer is about to draw the highlighted row into the
   * element that holds the focus, it gives that row a new element, so that the focus moves to a new element and a
   * screen reader hears the move.
   *
   * @private
   * @returns {number | null}
   */
  getPendingFocusRow(): number | null {
    if (this.#pendingFocus === null) {
      return null;
    }

    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    if (
      !highlight ||
      highlight.row === null ||
      highlight.col === null ||
      highlight.row < 0 ||
      !this.#hot.selection.isCellVisible(highlight) ||
      (this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.isOpened?.()
    ) {
      return null;
    }

    return highlight.row;
  }

  /**
   * Exempts a plugin-owned element from the outside-click deselect. The document `mousedown` in
   * `TableView` closes an open editor, saving it, and keeps the selection for a press inside the
   * element, whatever `outsideClickDeselects` says. Used by the sheets bar.
   *
   * @private
   * @param {HTMLElement} element The element to exempt.
   */
  registerOutsideClickExemptElement(element: HTMLElement): void {
    this.#outsideClickExemptElements.add(element);
  }

  /**
   * Removes an element exempted with `registerOutsideClickExemptElement()`.
   *
   * @private
   * @param {HTMLElement} element The element to remove.
   */
  unregisterOutsideClickExemptElement(element: HTMLElement): void {
    this.#outsideClickExemptElements.delete(element);
  }

  /**
   * Checks whether an event path passes through an element exempted with
   * `registerOutsideClickExemptElement()`.
   *
   * @private
   * @param {EventTarget[]} eventPath The event propagation path (`event.composedPath()`).
   * @returns {boolean}
   */
  isPathOutsideClickExempt(eventPath: EventTarget[]): boolean {
    if (this.#outsideClickExemptElements.size === 0) {
      return false;
    }

    return eventPath.some(entry => isHTMLElement(entry) && this.#outsideClickExemptElements.has(entry));
  }

  /**
   * Checks whether the given focused element proves that the browser focus left the grid.
   * Focus counts as foreign when the element is focusable, holds the browser focus, and is
   * neither a part of the grid or its portal, nor one of the shadow hosts the grid is rendered
   * within, nor the document body (a click on a non-focusable area keeps the focus where it
   * was). Sandboxed hosts (e.g. Salesforce Lightning Web Security) hide the real focused
   * element behind the host chain, so a focused ancestor host cannot prove the focus left the
   * grid - only an unrelated element can.
   *
   * The check mirrors the scope-deactivation rule in the focus scope manager (`scopeManager`
   * unlistens when a focus event lands outside every scope). Sandboxed hosts retarget the
   * window-level focus events that rule depends on, so the mouseup path re-applies the same
   * rule from the deepest reachable focused element. On a regular page both mechanisms agree -
   * this adds no behavior that the scope manager does not already provide there.
   *
   * @param {HTMLElement | null} element The deepest reachable focused element.
   * @returns {boolean}
   */
  isForeignFocusTarget(element: HTMLElement | null): boolean {
    const { rootElement, rootWrapperElement, rootPortalElement, rootDocument } = this.#hot;
    // Grid-owned UI hosted in the root wrapper's layout slots or overlay layer (e.g. a
    // plugin's formula bar) lives outside `rootElement`, so `isInternalElement` cannot
    // recognize it. Elements inside `rootElement` are deliberately excluded here: a
    // nested grid's focus must keep counting as foreign for this instance, exactly as
    // `isInternalElement` decides.
    const isWrapperHostedUi = !!rootWrapperElement &&
      rootWrapperElement.contains(element) && !rootElement.contains(element);

    if (
      element === null ||
      element === rootDocument.body ||
      element === rootDocument.documentElement ||
      isInternalElement(element, rootElement) ||
      isWrapperHostedUi ||
      (rootPortalElement && rootPortalElement.contains(element))
    ) {
      return false;
    }

    return !getShadowHostChain(rootElement).includes(element);
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
   * editor textarea is not auto-refocused (`imeFastEdit`). Used by `selectCells()`, `selectRows()`,
   * `selectColumns()`, and `selectAll()` when `changeListener` is `false`. Note: an `activeElement`
   * of `<body>` or an `<iframe>` element
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
   * Runs `action`, and keeps the browser focus on an element outside the grid while it runs. A selection laid
   * again by the action (a data update re-lays the selection it already holds) then does not move the focus into
   * the grid, whatever the outside element is: an input, a button or a link. The grid takes the focus back only when
   * it, or nothing, held it. `<body>` counts as nothing.
   *
   * Unlike `suspend()`, it leaves an outer suspension alone and protects any focused element, not only form fields.
   *
   * @since 19.0.0
   * @param {Function} action The work that may lay the selection again.
   * @returns {*} What `action` returns.
   */
  keepForeignFocusWhile<T>(action: () => T): T {
    this.#keepForeignFocusDepth += 1;

    try {
      return action();
    } finally {
      this.#keepForeignFocusDepth -= 1;
    }
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
   * Makes a screen reader read a data cell that is about to take the focus as a move onto that cell, with its
   * column and row. The cell is drawn into an element the grid recycles, and the draw leaves the element's
   * attributes as they were when they hold the same values, so the browser would keep the accessibility object
   * of the cell the element showed before, and a reader hears a name change or nothing. A cell that has the
   * focus already is left alone: nothing moved. The state of the cell or header is recorded, so that the draw
   * after a change made while it holds the focus can tell it from a repeated paint.
   *
   * Only the grid the application created gets the rebuild: the lists the editors build are grids of their own,
   * a reader reaches their options through the editor that keeps the focus, and a rebuilt option can lose the
   * reference the editor holds to it. Their cells are still recorded, so a checkbox in a menu list that is
   * toggled is read again.
   *
   * @param {HTMLElement} elementToBeFocused The element that is about to take the focus.
   * @param {HTMLElement | null} cell The highlighted cell or header, which the `modifyFocusedElement` hook may have
   * replaced.
   */
  #announceCellFocus(elementToBeFocused: HTMLElement, cell: HTMLElement | null): void {
    const isDataCell = elementToBeFocused.nodeName === 'TD';

    if (elementToBeFocused !== cell || (!isDataCell && elementToBeFocused.nodeName !== 'TH')) {
      return;
    }

    const coords = this.#readHighlight();

    if (coords === null) {
      return;
    }

    if (getDeepActiveElement(this.#hot.rootDocument) === elementToBeFocused) {
      // The browser focused an element that was pressed before the grid selected it. Nothing moved, but the draw that
      // follows needs a record of what it showed, to tell a change from a repeated paint.
      rememberAnnouncedCell(elementToBeFocused, coords.row, coords.col, true);

      return;
    }

    if (isDataCell && isRootInstance(this.#hot)) {
      rebuildAccessibilityObject(elementToBeFocused);
    }

    rememberAnnouncedCell(elementToBeFocused, coords.row, coords.col);
  }

  /**
   * Reads the cell the selection highlights, which is the cell that gets the browser focus. It asks the selection
   * and not the element, because looking an element up fires the public `modifyGetCoordsElement` hook.
   *
   * @returns {{ row: number, col: number } | null} The visual coordinates, `null` without a selection.
   */
  #readHighlight(): { row: number, col: number } | null {
    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    return highlight && highlight.row !== null && highlight.col !== null
      ? { row: highlight.row, col: highlight.col }
      : null;
  }

  /**
   * Makes a screen reader read the focused cell or header again when what it shows changed in place, or when the
   * grid drew another cell into the element that holds the focus (a jump to a row that is rendered only then).
   * The browser keeps the accessibility object of an element whose attributes keep their values, so the reader
   * hears nothing or a name that changed. It only counts when the element is a cell of this grid, not of a grid
   * nested in one of its cells, and shows the selected cell: a scroll that recycles the focused element for a cell
   * the user is not on says nothing.
   */
  #announceChangeInPlace(): void {
    const activeElement = getDeepActiveElement(this.#hot.rootDocument);

    if (
      !isHTMLElement(activeElement) ||
      (activeElement.nodeName !== 'TD' && activeElement.nodeName !== 'TH') ||
      !isInternalElement(activeElement, this.#hot.rootElement)
    ) {
      return;
    }

    const coords = this.#readHighlight();

    // The element shows the selected cell when it is the one the grid renders for the highlight. The `current` class
    // says the same, but a grid with `disableVisualSelection` never gets it.
    if (coords === null || this.#hot.getCell(coords.row, coords.col, true) !== activeElement) {
      return;
    }

    if (hasCellChangedSinceAnnounced(activeElement, coords.row, coords.col)) {
      rebuildAccessibilityObject(activeElement);
    }
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
        !(this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.isOpened?.()
      ) {
        this.#announceCellFocus(elementToBeFocused as HTMLElement, element);
        this.focusElement(elementToBeFocused as HTMLElement, { preventScroll: true });
      }
    };

    if (selectedCell) {
      focusElement(selectedCell);
    } else {
      this.#getSelectedCell('focusOnHighlightedCell', element => focusElement(element));
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
      !(this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.isOpened?.()
    ) {
      (this.#hot.getActiveEditor() as unknown as ActiveEditorInstance | undefined)?.refreshValue?.();

      if (!this.#debouncedSelect.has(delay)) {
        this.#debouncedSelect.set(delay, debounce(() => {
          if (!this.#hot.isDestroyed) {
            const refocusElement = this.getRefocusElement() as HTMLElement | undefined;

            // Firefox does not move the focus on `select()` of a date input, so the focus is set explicitly.
            // A custom refocus element (`setRefocusElementGetter()`) does not have to be an input.
            if (refocusElement && this.focusElement(refocusElement, { preventScroll: true }) &&
                typeof (refocusElement as HTMLTextAreaElement).select === 'function') {
              (refocusElement as HTMLTextAreaElement).select();
            }
          }
        }, delay));
      }

      this.#debouncedSelect.get(delay)();
    }
  }

  /**
   * Get and return the currently selected and highlighted cell/header element. When the cell is not
   * rendered yet, the callback waits for the next scroll, and only runs if the highlight still sits
   * on that cell by then.
   *
   * @param {PendingScrollPurpose} purpose Which caller asks. A repeated ask of the same caller replaces its callback.
   * @param {Function} callback Callback function to be called after the cell element is retrieved.
   */
  #getSelectedCell(purpose: PendingScrollPurpose, callback: SelectedCellCallback): void {
    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    if (!highlight || !this.#hot.selection.isCellVisible(highlight)) {
      callback(null);

      return;
    }

    if (highlight.row === null || highlight.col === null) {
      callback(null);

      return;
    }

    const { row, col } = highlight;
    const cell = this.#hot.getCell(row, col, true);

    if (cell === null) {
      this.#deferUntilScroll(row, col, purpose, callback);

    } else {
      callback(cell);
    }
  }

  /**
   * Keeps the callback until the next scroll, for the cell at the given coordinates. Callers waiting for
   * the same cell share one `afterScroll` listener, and a call for another cell drops the listener of the
   * previous one.
   *
   * @param {number} row Visual row of the highlighted cell.
   * @param {number} col Visual column of the highlighted cell.
   * @param {PendingScrollPurpose} purpose Which caller asks.
   * @param {Function} callback Callback function to be called after the cell element is retrieved.
   */
  #deferUntilScroll(row: number, col: number, purpose: PendingScrollPurpose, callback: SelectedCellCallback): void {
    if (this.#pendingScroll === null || this.#pendingScroll.row !== row || this.#pendingScroll.col !== col) {
      this.#cancelPendingScroll();

      const pending: PendingScroll = {
        row,
        col,
        callbacks: new Map(),
        hook: () => this.#flushPendingScroll(pending),
      };

      this.#pendingScroll = pending;
      this.#hot.addHookOnce('afterScroll', pending.hook);
    }

    this.#pendingScroll.callbacks.set(purpose, callback);
  }

  /**
   * Runs the waiting callbacks after a scroll, unless the grid is gone or the highlight is no longer on
   * the cell they were registered for.
   *
   * @param {PendingScroll} pending The entry whose `afterScroll` listener fired.
   */
  #flushPendingScroll(pending: PendingScroll): void {
    if (this.#pendingScroll !== pending) {
      return;
    }

    this.#pendingScroll = null;

    if (this.#hot.isDestroyed || !this.#isHighlightAt(pending.row, pending.col)) {
      return;
    }

    const cell = this.#hot.getCell(pending.row, pending.col, true);

    pending.callbacks.forEach(callback => callback(cell));
  }

  /**
   * Drops the waiting callbacks and their `afterScroll` listener.
   */
  #cancelPendingScroll(): void {
    if (this.#pendingScroll === null) {
      return;
    }

    // A destroyed instance has dropped its listeners, and `removeHook()` throws on it. The hook run keeps
    // walking its listeners after an earlier one destroyed the grid.
    if (!this.#hot.isDestroyed) {
      this.#hot.removeHook('afterScroll', this.#pendingScroll.hook);
    }

    this.#pendingScroll = null;
  }

  /**
   * Checks whether the active highlight sits on the given cell.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   * @returns {boolean}
   */
  #isHighlightAt(row: number, col: number): boolean {
    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    return highlight !== undefined && highlight.row === row && highlight.col === col;
  }

  /**
   * Gets the deepest focused element, or `null` when it is not an `HTMLElement`.
   *
   * @returns {HTMLElement | null}
   */
  #getActiveElement(): HTMLElement | null {
    const deepActiveElement = getDeepActiveElement(this.#hot.rootDocument);

    return isHTMLElement(deepActiveElement) ? deepActiveElement : null;
  }

  /**
   * Manage the browser's focus after each cell selection change.
   *
   * @param {boolean} suspended Whether focus management was suspended when the selection changed.
   * @param {boolean} keepsForeignFocus Whether the selection changed inside `keepForeignFocusWhile()`, so an element
   * outside the grid keeps the focus it holds.
   */
  #focusCell(suspended: boolean, keepsForeignFocus: boolean) {
    this.#getSelectedCell('focusCell', (selectedCell) => {
      const activeElement = this.#getActiveElement();

      // A selection laid again by a data update is not the user moving into the grid, so an element outside
      // the grid that holds the focus keeps it (WCAG 3.2.2). Nothing is blurred and nothing is focused.
      if (keepsForeignFocus && this.isForeignFocusTarget(activeElement)) {
        return;
      }

      // When focus management is suspended and an external focusable element (outside Handsontable)
      // currently owns the browser focus, keep it - do not blur and do not move focus to the cell.
      // This preserves the focus of inputs that live next to the grid when a programmatic selection
      // is applied with `changeListener` set to `false`. See #10038.
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
    // A listener that ran before this one can destroy the grid, and the hook run keeps walking its listeners.
    if (this.#hot.isDestroyed) {
      return;
    }

    // When focus management is suspended and an external focusable element (outside Handsontable)
    // currently owns the browser focus, skip the `imeFastEdit` refocus - otherwise the debounced
    // `select()` on the editor textarea would steal that external focus. When no external element
    // owns focus, fall through so the default `imeFastEdit` behavior still moves focus to the
    // editor textarea (existing per-editor IME support tests rely on this). See #10038.
    if (this.#isSuspended) {
      const activeElement = this.#getActiveElement();

      if (activeElement && isOutsideInput(activeElement)) {
        return;
      }
    }

    // Same rule as `#focusCell()`: the debounced refocus of the editor input must not take the focus from an
    // element outside the grid either.
    // It reads the live scope, not a captured flag: `afterSelectionEnd` runs synchronously inside the scope.
    if (this.#keepForeignFocusDepth > 0 && this.isForeignFocusTarget(this.#getActiveElement())) {
      return;
    }

    this.#getSelectedCell('focusEditorElement', (selectedCell) => {
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
    // A listener that ran before this one can destroy the grid, and the hook run keeps walking its listeners.
    if (this.#hot.isDestroyed) {
      return;
    }

    // With the render held back (`batch()`, `suspendRender()`), an earlier change made outside the scope is still
    // waiting for it, and it keeps the right to take the focus: only a scoped change that follows nothing, or
    // another scoped change, keeps the foreign focus.
    this.#pendingKeepsForeignFocus = this.#keepForeignFocusDepth > 0 &&
      (this.#pendingFocus === null || this.#pendingKeepsForeignFocus);
    this.#pendingFocus = this.#isSuspended;

    // Work waiting for another cell is stale now. A selection that stays on the same cell keeps it.
    if (this.#pendingScroll !== null && !this.#isHighlightAt(this.#pendingScroll.row, this.#pendingScroll.col)) {
      this.#cancelPendingScroll();
    }
  }

  /**
   * Focuses the cell after the render event when the selection has changed.
   */
  #onAfterRender() {
    // A listener from the settings runs before this one, and the hook run keeps walking its listeners
    // after such a listener destroyed the grid.
    if (this.#hot.isDestroyed) {
      return;
    }

    this.#announceChangeInPlace();

    const suspended = this.#pendingFocus;

    if (suspended === null) {
      return;
    }

    const keepsForeignFocus = this.#pendingKeepsForeignFocus;

    this.#pendingFocus = null;
    this.#pendingKeepsForeignFocus = false;
    this.#focusCell(suspended, keepsForeignFocus);
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
