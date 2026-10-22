// Only the `#` fields use the package's types; signatures use `gridContract.ts` (see there).
import type { HeaderDragTracker, RangeDragTracker } from 'hyperformula-ui';
import { isMacOS } from '../../helpers/browser';
import {
  getFirstChangedTouch,
  getTouchPointById,
  hasTouchList,
  isLeftClick,
  stopImmediatePropagation,
} from '../../helpers/dom/event';
import { getDeepActiveElement, isHTMLElement } from '../../helpers/dom/element';
import type { HandsontableAdapter } from './handsontableAdapter';
import type { CellRange, HeaderAxis, HeaderPick, PickingEditor } from './gridContract';

/**
 * The `hyperformula-ui` module namespace (see `internalTypes.ts` for why it is not shared).
 */
type CoreModule = typeof import('hyperformula-ui');

/**
 * Row/column coordinates in visual space.
 */
interface GridCoords {
  row: number;
  col: number;
}

/**
 * Handsontable's `beforeOnCellMouseDown`/`beforeOnCellMouseOver` event controller.
 */
interface SelectionController {
  row: boolean;
  column: boolean;
  cell: boolean;
}

/**
 * Dependencies injected by the plugin into {@link CellPickController}.
 */
export interface CellPickControllerDeps {
  /**
   * The injected `hyperformula-ui` module namespace.
   */
  core: unknown;
  /**
   * Returns the live adapter, or `null` before enable/after destroy.
   *
   * @returns {HandsontableAdapter | null}
   */
  getAdapter(): HandsontableAdapter | null;
  /**
   * Returns the live core formula editor, or `null` when not editing.
   *
   * @returns {PickingEditor | null}
   */
  getActiveEditor(): PickingEditor | null;
  /**
   * Returns the visual coordinates of the cell the formula bar edits, or `null`.
   *
   * @returns {GridCoords | null}
   */
  getBarSelected(): GridCoords | null;
  /**
   * Maps visual coordinates to HyperFormula coordinates.
   *
   * @param {GridCoords} coords The visual coordinates.
   * @returns {GridCoords}
   */
  toHfCoords(coords: GridCoords): GridCoords;
  /**
   * Requests the bar-to-inline editing handoff.
   */
  emitSwitchToInline(): void;
  /**
   * Returns Handsontable's active editor instance.
   *
   * @returns {unknown}
   */
  getHostActiveEditor(): unknown;
  /**
   * Returns the master overlay scroll holder, or `null`.
   *
   * @returns {HTMLElement | null}
   */
  getScrollHolder(): HTMLElement | null;
  /**
   * Returns the host document.
   *
   * @returns {Document}
   */
  getRootDocument(): Document;
  /**
   * Returns the visual columns a column header covers: one column, or a nested-header group's span.
   *
   * @param {GridCoords} coords The header coordinates (a negative row).
   * @returns {{ start: number, end: number }}
   */
  getColumnHeaderSpan(coords: GridCoords): { start: number; end: number };
}

/**
 * Whether a press may start a pick: a primary-button mouse press or a touch. A right-click opens the
 * context menu and a middle click scrolls, so neither picks. On macOS Ctrl+click is the context menu
 * gesture too, although it reports the primary button.
 *
 * @param {MouseEvent | undefined} event The press event, or `undefined` for a press made by the API.
 * @returns {boolean}
 */
function isPickPress(event: MouseEvent | undefined): boolean {
  if (event === undefined || hasTouchList(event)) {
    return true;
  }

  return isLeftClick(event) && !(isMacOS() && event.ctrlKey);
}

/**
 * Whether a press appends a reference instead of replacing the one at the caret: Ctrl or Cmd, the
 * modifier the grid adds a selection layer with. A macOS Ctrl+click never gets here, see
 * `isPickPress()`.
 *
 * @param {MouseEvent | undefined} event The press event.
 * @returns {boolean}
 */
function isAppendPress(event: MouseEvent | undefined): boolean {
  return Boolean(event?.metaKey || event?.ctrlKey);
}

/**
 * Reads the viewport position of a press, from the first changed touch of a touch event.
 *
 * @param {MouseEvent | undefined} event The press event.
 * @returns {{ x: number, y: number } | undefined}
 */
function readPressPoint(event: MouseEvent | undefined): { x: number; y: number } | undefined {
  if (event === undefined) {
    return undefined;
  }

  if (hasTouchList(event)) {
    const touch = getFirstChangedTouch(event);

    return touch ? { x: touch.clientX, y: touch.clientY } : undefined;
  }

  return { x: event.clientX, y: event.clientY };
}

/**
 * Owns click/drag reference picking on the grid, cells and headers alike.
 *
 * A pick claims the whole mouse gesture: its listeners run first (order index `-1`, see the
 * plugin's `AGENTS.md`), set every flag of the selection controller, and stop the event's
 * immediate propagation. The core then skips its own selection handling and every
 * `afterOnCell*` listener - so NestedHeaders never selects a group span under a header pick -
 * and DragToScroll, which runs later in the same hook, sees the stopped event and stays out of
 * the drag that the pick's own edge auto-scroller drives.
 *
 * Handsontable reports header coordinates as negative (`{row: -1}` on a column
 * header, `{col: -1}` on a row header, both negative on the corner - bailed on),
 * so a negative-axis mousedown routes to the header tracker instead of the cell
 * tracker. An eligible header mousedown also arms a one-shot document-capture
 * click swallow - the DropdownMenu plugin opens its menu from a root-element
 * `click` on the header's button, which a suppressed mousedown alone does not stop.
 */
export class CellPickController {
  /**
   * Injected plugin dependencies.
   */
  readonly #deps: CellPickControllerDeps;
  /**
   * The injected `hyperformula-ui` module namespace.
   */
  readonly #core: CoreModule;
  /**
   * Cell/range reference drag tracker.
   */
  readonly #tracker: RangeDragTracker;
  /**
   * Header reference drag tracker.
   */
  readonly #headerTracker: HeaderDragTracker;
  /**
   * The element focused before a pick began, restored on drop.
   */
  #focusBeforePick: HTMLElement | null = null;
  /**
   * The axis of the active header drag, or `null`.
   */
  #headerAxis: HeaderAxis | null = null;
  /**
   * Disarms the pending trailing click swallow, when armed.
   */
  #headerClickSwallowCleanup: (() => void) | null = null;
  /**
   * Removes the document and window listeners of the active drag, when one is active. They are
   * bound for the length of a drag only, so an idle grid adds no document `mousemove` listener.
   */
  #removeDragListeners: (() => void) | null = null;
  /**
   * The identifier of the finger a touch pick follows, or `null` for a mouse pick.
   */
  #touchId: number | null = null;
  /**
   * The HyperFormula span of the header a header drag started on (a nested-header group covers
   * several), whether it appends, and the index the header tracker is anchored at now.
   */
  #headerDrag: { start: number; end: number; append: boolean; trackerAnchor: number } | null = null;

  /**
   * `beforeOnCellMouseDown` hook listener.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual cell coordinates.
   * @param {HTMLTableCellElement | undefined} cellEl The clicked cell element.
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   */
  onBeforeMouseDown = (
    event: MouseEvent | undefined,
    coords: GridCoords,
    cellEl: HTMLTableCellElement | undefined,
    eventController: SelectionController,
  ): void => this.#handleBeforeMouseDown(event, coords, eventController);

  /**
   * `beforeOnCellMouseOver` and `beforeOnCellMouseOverOutside` hook listener.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual cell coordinates.
   * @param {HTMLTableCellElement | undefined} cellEl The hovered cell element.
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   */
  onBeforeMouseOver = (
    event: MouseEvent | undefined,
    coords: GridCoords,
    cellEl: HTMLTableCellElement | undefined,
    eventController: SelectionController,
  ): void => {
    if (this.#handleHover(coords, eventController)) {
      this.#claim(event);
    }
  };

  /**
   * Document `mousemove` listener driving drag auto-scroll and stuck-drag recovery.
   *
   * @param {MouseEvent} event The mouse event.
   */
  onDocMouseMove = (event: MouseEvent): void => this.#handleDocMouseMove(event);

  /**
   * Document capture-phase `scroll` listener re-extending an active reference drag.
   */
  onDocScroll = (): void => this.#handleDocScroll();

  /**
   * Window `blur` listener finishing a drag interrupted by focus loss.
   */
  onWindowBlur = (): void => this.#handleWindowBlur();

  /**
   * Document `mouseup` listener finishing the active drag.
   */
  onDocMouseUp = (): void => this.#handleDocMouseUp();

  /**
   * Document `touchend`/`touchcancel` listener finishing a touch pick. On a touch device the press
   * reaches the grid from `touchend` (Walkontable defers it there), and Walkontable then cancels the
   * compatibility mouse events, so no `mouseup` ever finishes the pick.
   *
   * @param {TouchEvent} event The touch event.
   */
  onDocTouchEnd = (event: TouchEvent): void => {
    if (this.#touchId === null || getTouchPointById(event, this.#touchId) === null) {
      this.#handleDocMouseUp();
    }
  };

  /**
   * @param {CellPickControllerDeps} deps Injected plugin dependencies.
   */
  constructor(deps: CellPickControllerDeps) {
    this.#deps = deps;
    this.#core = deps.core as CoreModule;
    this.#tracker = new this.#core.RangeDragTracker({
      getScrollElement: () => this.#deps.getScrollHolder(),
      getCellAddressAt: (x, y) => this.#deps.getAdapter()?.getCellAddressAt(x, y) ?? null,
      onPreview: (range, append) => this.#previewRange(range, append),
      onDragEnd: () => this.#deps.getAdapter()?.clearEphemeralHighlight(),
      onDropCell: pick => this.#deps.getAdapter()?.emitCellPick(pick),
      onDropRange: pick => this.#deps.getAdapter()?.emitRangePick(pick),
    });
    this.#headerTracker = new this.#core.HeaderDragTracker({
      sheet: '',
      onPreview: pick => this.#previewHeader(pick),
      onDrop: pick => this.#deps.getAdapter()?.emitHeaderPick(pick),
      onDragEnd: () => {
        this.#headerAxis = null;
        this.#deps.getAdapter()?.clearEphemeralHighlight();
      },
    });
  }

  /**
   * Whether a header pick drag is in progress (consulted by the `beforeColumnSort` guard).
   *
   * @returns {boolean}
   */
  isHeaderPickActive(): boolean {
    return this.#headerTracker.isActive();
  }

  /**
   * Cancels any active drag and disarms the click swallow.
   */
  reset(): void {
    this.#unlistenDrag();
    this.#tracker.cancel();
    this.#headerTracker.cancel();
    this.#disarmHeaderClickSwallow();
    this.#focusBeforePick = null;
  }

  /**
   * Paints the drag preview highlight for a cell/range pick.
   *
   * @param {CellRange} range The previewed range.
   * @param {boolean} append Whether the pick appends to the formula.
   */
  #previewRange(range: CellRange, append: boolean): void {
    const adapter = this.#deps.getAdapter();
    const editor = this.#deps.getActiveEditor();

    if (!adapter || !editor) {
      return;
    }

    adapter.highlightRange(range, editor.getRefPreviewColor(range, append));
  }

  /**
   * Paints the drag preview highlight for a header pick.
   *
   * @param {HeaderPick} pick The previewed header pick.
   */
  #previewHeader(pick: HeaderPick): void {
    const adapter = this.#deps.getAdapter();
    const editor = this.#deps.getActiveEditor();

    if (!adapter || !editor) {
      return;
    }

    const expanded = this.#core.expandHeaderSpan(pick, adapter.getGridSize());

    adapter.highlightRange(expanded, editor.getRefPreviewColor(expanded, pick.append, pick.axis));
  }

  /**
   * Routes a grid mousedown: header picks to the header tracker, in-ref-mode cell
   * mousedowns to the range tracker, bar-cell clicks to the inline handoff, and
   * everything else to Handsontable's native handling.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual cell coordinates.
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   */
  #handleBeforeMouseDown(
    event: MouseEvent | undefined,
    coords: GridCoords,
    eventController: SelectionController,
  ): void {
    const adapter = this.#deps.getAdapter();
    const editor = this.#deps.getActiveEditor();

    if (coords.row < 0 && coords.col < 0) {
      return;
    }

    if (!isPickPress(event)) {
      return;
    }

    if (coords.row < 0 || coords.col < 0) {
      this.#handleHeaderMouseDown(event, coords, eventController, adapter, editor);

      return;
    }

    if (!editor || !adapter) {
      return;
    }

    if (!editor.isFormula()) {
      return;
    }

    const barSelected = this.#deps.getBarSelected();

    if (barSelected && coords.row === barSelected.row && coords.col === barSelected.col) {
      this.#suppress(eventController);
      event?.preventDefault();
      this.#deps.emitSwitchToInline();

      return;
    }

    if (!editor.isRefSelectionActive()) {
      editor.closeUnbalancedParens();

      return;
    }

    const anchor = this.#deps.toHfCoords(coords);

    if (anchor.row < 0 || anchor.col < 0) {
      return;
    }

    this.#suppress(eventController);
    this.#claim(event);
    this.#focusBeforePick = this.#activeElement();

    this.#listenDrag(event);
    this.#tracker.begin(
      { sheet: '', col: anchor.col, row: anchor.row },
      isAppendPress(event),
      readPressPoint(event),
    );

    // A touch press arrives from `touchend`, with the finger already lifted: the tap is the whole pick.
    if (event !== undefined && hasTouchList(event)) {
      this.#handleDocMouseUp();
    }
  }

  /**
   * Begins a header pick drag from a header mousedown.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual coordinates (one axis negative).
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   * @param {HandsontableAdapter | null} adapter The live adapter.
   * @param {PickingEditor | null} editor The live formula editor.
   */
  #handleHeaderMouseDown(
    event: MouseEvent | undefined,
    coords: GridCoords,
    eventController: SelectionController,
    adapter: HandsontableAdapter | null,
    editor: PickingEditor | null,
  ): void {
    if ((event?.target as HTMLElement | null)?.closest?.('.collapsibleIndicator')) {
      return;
    }

    if (!adapter || !editor) {
      return;
    }

    if (!editor.isFormula()) {
      return;
    }

    if (!editor.isRefSelectionActive()) {
      return;
    }

    const axis: HeaderAxis = coords.col < 0 ? 'row' : 'column';
    // A nested-header group covers several columns, and a pick of it inserts all of them, the way a
    // click on it selects them all.
    const span = axis === 'column' ? this.#deps.getColumnHeaderSpan(coords) : { start: coords.row, end: coords.row };
    const hfStart = this.#toHfAxisIndex(axis, span.start);
    const hfEnd = this.#toHfAxisIndex(axis, span.end);

    if (hfStart < 0 || hfEnd < 0) {
      return;
    }

    this.#suppress(eventController);
    this.#claim(event);
    this.#focusBeforePick = this.#activeElement();

    this.#headerAxis = axis;
    this.#listenDrag(event);
    this.#headerDrag = {
      start: Math.min(hfStart, hfEnd),
      end: Math.max(hfStart, hfEnd),
      append: isAppendPress(event),
      trackerAnchor: Math.min(hfStart, hfEnd),
    };
    this.#headerTracker.begin(axis, this.#headerDrag.start, this.#headerDrag.append);

    if (hfEnd !== hfStart) {
      this.#headerTracker.extendTo(axis, this.#headerDrag.end);
    }

    this.#armHeaderClickSwallow();

    if (event !== undefined && hasTouchList(event)) {
      this.#handleDocMouseUp();
    }
  }

  /**
   * Extends the header drag over a hovered header. The pick always covers the whole header the drag
   * started on and the whole hovered one (a nested-header group spans several columns), so the
   * tracker, which keeps one anchor index, is re-anchored at the far side of the start header when
   * the drag crosses to its other side.
   *
   * @param {GridCoords} coords The hovered coordinates.
   * @param {number} axisCoordinate The hovered visual index on the drag's axis.
   */
  #extendHeaderDrag(coords: GridCoords, axisCoordinate: number): void {
    const axis = this.#headerAxis;
    const drag = this.#headerDrag;

    if (axis === null || drag === null) {
      return;
    }

    const span = axis === 'column' && coords.row < 0 ?
      this.#deps.getColumnHeaderSpan(coords) : { start: axisCoordinate, end: axisCoordinate };
    const hfStart = this.#toHfAxisIndex(axis, span.start);
    const hfEnd = this.#toHfAxisIndex(axis, span.end);

    if (hfStart < 0 || hfEnd < 0) {
      return;
    }

    const towardStart = Math.min(hfStart, hfEnd) < drag.start;
    const anchor = towardStart ? drag.end : drag.start;
    const far = towardStart ? Math.min(hfStart, hfEnd) : Math.max(hfStart, hfEnd, drag.end);

    if (anchor !== drag.trackerAnchor) {
      drag.trackerAnchor = anchor;
      this.#headerTracker.begin(axis, anchor, drag.append);
    }

    this.#headerTracker.extendTo(axis, far);
  }

  /**
   * Maps a visual header index to the HyperFormula index of its axis.
   *
   * @param {HeaderAxis} axis The header axis.
   * @param {number} visualIndex The visual row or column index.
   * @returns {number}
   */
  #toHfAxisIndex(axis: HeaderAxis, visualIndex: number): number {
    return axis === 'row' ?
      this.#deps.toHfCoords({ row: visualIndex, col: 0 }).row :
      this.#deps.toHfCoords({ row: 0, col: visualIndex }).col;
  }

  /**
   * Arms a one-shot document-capture click swallow for header clicks.
   */
  #armHeaderClickSwallow(): void {
    this.#disarmHeaderClickSwallow();

    const swallowDocument = this.#deps.getScrollHolder()?.ownerDocument ??
      this.#deps.getRootDocument();

    this.#headerClickSwallowCleanup = this.#core.armTrailingClickSwallow(
      swallowDocument,
      clickTarget => Boolean(clickTarget.closest('th')),
    );
  }

  /**
   * Disarms the pending click swallow, if any.
   */
  #disarmHeaderClickSwallow(): void {
    this.#headerClickSwallowCleanup?.();
    this.#headerClickSwallowCleanup = null;
  }

  /**
   * Drives drag auto-scroll and recovers from drags whose mouseup was missed.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #handleDocMouseMove(event: MouseEvent): void {
    if (!this.#tracker.isActive() && !this.#headerTracker.isActive()) {
      return;
    }

    if (event.buttons === 0) {
      this.#handleDocMouseUp();

      return;
    }

    if (this.#tracker.isActive()) {
      this.#tracker.updateAutoScroll(event.clientX, event.clientY);
    }
  }

  /**
   * Re-extends the active cell/range drag after a scroll moved the grid under a
   * stationary pointer, which fires no `mousemove` or edge auto-scroll on its own.
   */
  #handleDocScroll(): void {
    if (this.#tracker.isActive()) {
      this.#tracker.reextendFromLastPointer();
    }
  }

  /**
   * Finishes an active drag when the window loses focus.
   */
  #handleWindowBlur(): void {
    if (this.#tracker.isActive() || this.#headerTracker.isActive()) {
      this.#handleDocMouseUp();
    }
  }

  /**
   * Finishes the active drag, emits the pick, and restores focus.
   */
  #handleDocMouseUp(): void {
    const wasActive = this.#tracker.isActive() || this.#headerTracker.isActive();

    this.#unlistenDrag();

    this.#tracker.finish();
    this.#headerTracker.finish();

    if (this.#focusBeforePick) {
      // The drag may have auto-scrolled the grid; focusing the editor must not scroll it back.
      this.#focusBeforePick.focus({ preventScroll: true });
    } else if (wasActive) {
      (this.#deps.getHostActiveEditor() as { focus?: () => void } | undefined)?.focus?.();
    }

    this.#focusBeforePick = null;
    this.#touchId = null;
    this.#headerDrag = null;
  }

  /**
   * Binds the document and window listeners that follow a drag until it ends.
   *
   * @param {MouseEvent | undefined} event The press that started the drag.
   */
  #listenDrag(event: MouseEvent | undefined): void {
    this.#unlistenDrag();

    const rootDocument = this.#deps.getRootDocument();
    const rootWindow = rootDocument.defaultView;

    this.#touchId = event !== undefined && hasTouchList(event) ?
      getFirstChangedTouch(event)?.identifier ?? null : null;

    rootDocument.addEventListener('mouseup', this.onDocMouseUp);
    rootDocument.addEventListener('mousemove', this.onDocMouseMove);
    rootDocument.addEventListener('touchend', this.onDocTouchEnd);
    rootDocument.addEventListener('touchcancel', this.onDocTouchEnd);
    rootDocument.addEventListener('scroll', this.onDocScroll, { capture: true });
    rootWindow?.addEventListener('blur', this.onWindowBlur);

    this.#removeDragListeners = () => {
      rootDocument.removeEventListener('mouseup', this.onDocMouseUp);
      rootDocument.removeEventListener('mousemove', this.onDocMouseMove);
      rootDocument.removeEventListener('touchend', this.onDocTouchEnd);
      rootDocument.removeEventListener('touchcancel', this.onDocTouchEnd);
      rootDocument.removeEventListener('scroll', this.onDocScroll, { capture: true });
      rootWindow?.removeEventListener('blur', this.onWindowBlur);
    };
  }

  /**
   * Removes the listeners the drag bound.
   */
  #unlistenDrag(): void {
    this.#removeDragListeners?.();
    this.#removeDragListeners = null;
  }

  /**
   * Claims the mouse gesture for the pick: keeps the focus in the formula editor and stops the
   * event, so the core skips its selection handling and the `afterOnCell*` listeners, and
   * DragToScroll stays out (see the class description).
   *
   * @param {MouseEvent | undefined} event The mouse event.
   */
  #claim(event: MouseEvent | undefined): void {
    if (!event) {
      return;
    }

    event.preventDefault();
    stopImmediatePropagation(event);
  }

  /**
   * Returns the focused element, looking through open shadow roots - a raw
   * `document.activeElement` names the shadow host when the grid renders inside one, and
   * restoring the focus to the host would not reach the editor.
   *
   * @returns {HTMLElement | null}
   */
  #activeElement(): HTMLElement | null {
    const element = getDeepActiveElement(this.#deps.getRootDocument());

    // `isHTMLElement()`, not `instanceof HTMLElement`: a grid in an iframe has elements of its own realm.
    return isHTMLElement(element) ? element : null;
  }

  /**
   * Suppresses Handsontable's own selection handling for the current event.
   *
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   */
  #suppress(eventController: SelectionController): void {
    eventController.row = true;
    eventController.column = true;
    eventController.cell = true;
  }

  /**
   * Extends the active drag (cell or header) as the pointer moves over cells.
   *
   * @param {GridCoords} coords The visual cell coordinates.
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   * @returns {boolean} Whether an active drag claimed the event.
   */
  #handleHover(coords: GridCoords, eventController: SelectionController): boolean {
    if (this.#headerTracker.isActive() && this.#headerAxis) {
      const axisCoordinate = this.#headerAxis === 'column' ? coords.col : coords.row;

      if (axisCoordinate >= 0) {
        this.#extendHeaderDrag(coords, axisCoordinate);
      }

      this.#suppress(eventController);

      return true;
    }

    const adapter = this.#deps.getAdapter();
    const editor = this.#deps.getActiveEditor();

    if (!editor || !adapter) {
      return false;
    }

    if (!editor.isFormula()) {
      return false;
    }

    if (!this.#tracker.isActive() && !editor.isRefSelectionActive()) {
      return false;
    }

    this.#suppress(eventController);

    if (!this.#tracker.isActive()) {
      return false;
    }

    const clamped = { row: Math.max(coords.row, 0), col: Math.max(coords.col, 0) };
    const mapped = this.#deps.toHfCoords(clamped);

    if (mapped.row >= 0 && mapped.col >= 0) {
      this.#tracker.extendTo({ sheet: '', col: mapped.col, row: mapped.row });
    }

    return true;
  }
}
