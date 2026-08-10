import type {
  CellRange,
  FormulaEditor,
  HeaderAxis,
  HeaderDragTracker,
  HeaderPick,
  RangeDragTracker,
} from '@hfe/core';
import type { HandsontableAdapter } from './handsontableAdapter';
import type { CoreModule } from './types';

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
   * The injected `@hfe/core` module namespace.
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
  /**
   * Disables the DragToScroll plugin while a reference drag is active.
   */
  suspendDragToScroll(): void;
  /**
   * Re-enables the DragToScroll plugin after a reference drag ends.
   */
  resumeDragToScroll(): void;
}

/**
 * Owns click/drag reference picking on the grid, cells and headers alike.
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
   * `beforeOnCellMouseOver` hook listener.
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
    this.#handleHover(coords, eventController);
  };

  /**
   * `beforeOnCellMouseOverOutside` hook listener.
   *
   * @param {MouseEvent | undefined} event The mouse event.
   * @param {GridCoords} coords The visual cell coordinates.
   * @param {HTMLTableCellElement | undefined} cellEl The hovered cell element.
   * @param {SelectionController} eventController Handsontable's selection suppressor.
   */
  onBeforeMouseOverOutside = (
    event: MouseEvent | undefined,
    coords: GridCoords,
    cellEl: HTMLTableCellElement | undefined,
    eventController: SelectionController,
  ): void => {
    this.#handleHover(coords, eventController);
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
    if (this.#tracker.isActive() || this.#headerTracker.isActive()) {
      this.#deps.resumeDragToScroll();
    }

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
      event?.preventDefault?.();
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
    event?.preventDefault?.();
    this.#focusBeforePick = this.#deps.getRootDocument().activeElement as HTMLElement | null;
    this.#deps.suspendDragToScroll();

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
    event?.preventDefault?.();
    this.#focusBeforePick = this.#deps.getRootDocument().activeElement as HTMLElement | null;
    this.#deps.suspendDragToScroll();

    this.#headerAxis = axis;
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

    this.#tracker.finish();
    this.#headerTracker.finish();

    if (this.#focusBeforePick) {
      this.#focusBeforePick.focus();
    } else if (wasActive) {
      (this.#deps.getHostActiveEditor() as { focus?: () => void } | undefined)?.focus?.();
    }

    if (wasActive) {
      this.#deps.resumeDragToScroll();
    }

    this.#focusBeforePick = null;
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
   */
  #handleHover(coords: GridCoords, eventController: SelectionController): void {
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

      return;
    }

    const adapter = this.#deps.getAdapter();
    const editor = this.#deps.getActiveEditor();

    if (!editor || !adapter) {
      return;
    }

    if (!editor.isFormula()) {
      return;
    }

    if (!this.#tracker.isActive() && !editor.isRefSelectionActive()) {
      return;
    }

    this.#suppress(eventController);

    if (!this.#tracker.isActive()) {
      return;
    }

    const clamped = { row: Math.max(coords.row, 0), col: Math.max(coords.col, 0) };
    const mapped = this.#deps.toHfCoords(clamped);

    if (mapped.row < 0 || mapped.col < 0) {
      return;
    }

    this.#tracker.extendTo({ sheet: '', col: mapped.col, row: mapped.row });
  }
}
