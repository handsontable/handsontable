import type {
  CellRange,
  FormulaEditor,
  HeaderAxis,
  HeaderDragTracker,
  HeaderPick,
  RangeDragTracker,
} from 'hyperformula-ui';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { getDeepActiveElement } from '../../helpers/dom/element';
import type { HandsontableAdapter } from './handsontableAdapter';
import type { CoreModule } from './internalTypes';

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
  core: CoreModule;
  /**
   * Returns the live adapter, or `null` before enable/after destroy.
   *
   * @returns {HandsontableAdapter | null}
   */
  getAdapter(): HandsontableAdapter | null;
  /**
   * Returns the live core formula editor, or `null` when not editing.
   *
   * @returns {FormulaEditor | null}
   */
  getActiveEditor(): FormulaEditor | null;
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
   * @param {CellPickControllerDeps} deps Injected plugin dependencies.
   */
  constructor(deps: CellPickControllerDeps) {
    this.#deps = deps;
    this.#tracker = new deps.core.RangeDragTracker({
      getScrollElement: () => this.#deps.getScrollHolder(),
      getCellAddressAt: (x, y) => this.#deps.getAdapter()?.getCellAddressAt(x, y) ?? null,
      onPreview: (range, append) => this.#previewRange(range, append),
      onDragEnd: () => this.#deps.getAdapter()?.clearEphemeralHighlight(),
      onDropCell: pick => this.#deps.getAdapter()?.emitCellPick(pick),
      onDropRange: pick => this.#deps.getAdapter()?.emitRangePick(pick),
    });
    this.#headerTracker = new deps.core.HeaderDragTracker({
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

    const expanded = this.#deps.core.expandHeaderSpan(pick, adapter.getGridSize());

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

    this.#listenDrag();
    this.#tracker.begin(
      { sheet: '', col: anchor.col, row: anchor.row },
      Boolean(event?.metaKey || event?.ctrlKey),
      event ? { x: event.clientX, y: event.clientY } : undefined,
    );
  }

  /**
   * Begins a header pick drag from a header mousedown.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual coordinates (one axis negative).
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   * @param {HandsontableAdapter | null} adapter The live adapter.
   * @param {FormulaEditor | null} editor The live core editor.
   */
  #handleHeaderMouseDown(
    event: MouseEvent | undefined,
    coords: GridCoords,
    eventController: SelectionController,
    adapter: HandsontableAdapter | null,
    editor: FormulaEditor | null,
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
    const hfIndex = axis === 'row' ?
      this.#deps.toHfCoords({ row: coords.row, col: 0 }).row :
      this.#deps.toHfCoords({ row: 0, col: coords.col }).col;

    if (hfIndex < 0) {
      return;
    }

    this.#suppress(eventController);
    this.#claim(event);
    this.#focusBeforePick = this.#activeElement();

    this.#headerAxis = axis;
    this.#listenDrag();
    this.#headerTracker.begin(axis, hfIndex, Boolean(event?.metaKey || event?.ctrlKey));
    this.#armHeaderClickSwallow();
  }

  /**
   * Arms a one-shot document-capture click swallow for header clicks.
   */
  #armHeaderClickSwallow(): void {
    this.#disarmHeaderClickSwallow();

    const swallowDocument = this.#deps.getScrollHolder()?.ownerDocument ??
      this.#deps.getRootDocument();

    this.#headerClickSwallowCleanup = this.#deps.core.armTrailingClickSwallow(
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
      this.#focusBeforePick.focus();
    } else if (wasActive) {
      (this.#deps.getHostActiveEditor() as { focus?: () => void } | undefined)?.focus?.();
    }

    this.#focusBeforePick = null;
  }

  /**
   * Binds the document and window listeners that follow a drag until it ends.
   */
  #listenDrag(): void {
    this.#unlistenDrag();

    const rootDocument = this.#deps.getRootDocument();
    const rootWindow = rootDocument.defaultView;

    rootDocument.addEventListener('mouseup', this.onDocMouseUp);
    rootDocument.addEventListener('mousemove', this.onDocMouseMove);
    rootDocument.addEventListener('scroll', this.onDocScroll, { capture: true });
    rootWindow?.addEventListener('blur', this.onWindowBlur);

    this.#removeDragListeners = () => {
      rootDocument.removeEventListener('mouseup', this.onDocMouseUp);
      rootDocument.removeEventListener('mousemove', this.onDocMouseMove);
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

    return element instanceof HTMLElement ? element : null;
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
        const hfIndex = this.#headerAxis === 'column' ?
          this.#deps.toHfCoords({ row: 0, col: axisCoordinate }).col :
          this.#deps.toHfCoords({ row: axisCoordinate, col: 0 }).row;

        if (hfIndex >= 0) {
          this.#headerTracker.extendTo(this.#headerAxis, hfIndex);
        }
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
