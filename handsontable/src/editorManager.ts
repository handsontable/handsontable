import type { HotInstance } from './core/types';
import type { GridSettings } from './core/settings';
import type { CellProperties } from './settings';
import type { default as SelectionManager } from './selection/selection';
import { isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import { EDITOR_STATE } from './editors/baseEditor';
import type { BaseEditor } from './editors/baseEditor';
import EventManager from './eventManager';

/**
 * Manages the lifecycle of cell editors — opening, closing, and delegating keyboard events to
 * the active editor during user interaction with the grid.
 */
class EditorManager {
  /**
   * Instance of {@link Handsontable}.
   *
   * @private
   * @type {Handsontable}
   */
  declare hot: HotInstance;
  /**
   * Reference to an instance's private GridSettings object.
   *
   * @private
   * @type {GridSettings}
   */
  declare tableMeta: GridSettings;
  /**
   * Instance of {@link Selection}.
   *
   * @private
   * @type {Selection}
   */
  declare selection: SelectionManager;
  /**
   * Instance of {@link EventManager}.
   *
   * @private
   * @type {EventManager}
   */
  declare eventManager: EventManager;
  /**
   * Determines if EditorManager is destroyed.
   *
   * @private
   * @type {boolean}
   */
  destroyed = false;
  /**
   * A reference to an instance of the activeEditor.
   *
   * @private
   * @type {BaseEditor}
   */
  declare activeEditor: BaseEditor | undefined;
  /**
   * Keeps a reference to the cell's properties object.
   *
   * @type {object}
   */
  declare cellProperties: CellProperties;
  /**
   * Whether a close of an editor stranded on a hidden cell is already pending, either scheduled on
   * the next tick or waiting on an async validator to settle. Suppresses duplicate work when one
   * page turn emits the cache-update hook more than once.
   *
   * @type {boolean}
   */
  #hiddenCellCloseArmed = false;

  /**
   * @param {Core} hotInstance The Handsontable instance.
   * @param {TableMeta} tableMeta The table meta instance.
   * @param {Selection} selection The selection instance.
   */
  constructor(hotInstance: HotInstance, tableMeta: GridSettings, selection: SelectionManager) {
    this.hot = hotInstance;
    this.tableMeta = tableMeta;
    this.selection = selection;
    this.eventManager = new EventManager(hotInstance);

    this.hot.addHook('afterDocumentKeyDown', (event: KeyboardEvent) => this.#onAfterDocumentKeyDown(event));
    this.hot.addHook('beforeCompositionStart', (event: KeyboardEvent) => this.#onAfterDocumentKeyDown(event));
    this.hot.addHook('afterRowSequenceCacheUpdate', () => this.#closeEditorWhenCellHidden());
    this.hot.addHook('afterColumnSequenceCacheUpdate', () => this.#closeEditorWhenCellHidden());
    this.hot.view._wt.update(
      'onCellDblClick', (event: MouseEvent, coords: { isCell: () => boolean }, _elem: HTMLElement) =>
        this.#onCellDblClick(event, coords)
    );
  }

  /**
   * Get active editor.
   *
   * @returns {BaseEditor}
   */
  getActiveEditor() {
    return this.activeEditor;
  }

  /**
   * Prepare text input to be displayed at given grid cell.
   */
  prepareEditor() {
    if (this.activeEditor && this.activeEditor.isWaiting()) {
      this.closeEditor(false, false, (dataSaved: boolean) => {
        if (dataSaved) {
          this.prepareEditor();
        }
      });

      return;
    }

    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    if (!highlight || highlight.isHeader()) {
      return;
    }

    const { row: rowNullable, col: colNullable } = highlight;
    const row = rowNullable!;
    const col = colNullable!;
    const modifiedCellCoords = this.hot.runHooks<void | [number, number] | [number, number, number, number]>(
      'modifyGetCellCoords', row, col, false, 'meta'
    );
    let visualRowToCheck = row;
    let visualColumnToCheck = col;

    if (Array.isArray(modifiedCellCoords)) {
      [visualRowToCheck, visualColumnToCheck] = modifiedCellCoords;
    }

    // Getting values using the modified coordinates.
    this.cellProperties = this.hot.getCellMeta(visualRowToCheck, visualColumnToCheck);

    if (!this.isCellEditable()) {
      this.clearActiveEditor();

      return;
    }

    const td = this.hot.getCell(row, col, true);

    // Skip the preparation when the cell is not rendered in the DOM. The cell is scrolled out of
    // the table's viewport.
    if (td) {
      const editorClass = this.hot.getCellEditor(this.cellProperties);
      const prop = this.hot.colToProp(visualColumnToCheck);
      const originalValue =
        this.hot.getSourceDataAtCell(this.hot.toPhysicalRow(visualRowToCheck), visualColumnToCheck);

      this.activeEditor = getEditorInstance(editorClass, this.hot) as BaseEditor;
      // Using not modified coordinates, as we need to get the table element using selection coordinates.
      // There is an extra translation in the editor for saving value.
      this.activeEditor.prepare(row, col, prop, td, originalValue, this.cellProperties);
    }
  }

  /**
   * Check is editor is opened/showed.
   *
   * @returns {boolean}
   */
  isEditorOpened() {
    return this.activeEditor && this.activeEditor.isOpened();
  }

  /**
   * Open editor with initial value.
   *
   * @param {null|string} newInitialValue New value from which editor will start if handled property it's not the `null`.
   * @param {Event} event The event object.
   * @param {boolean} [enableFullEditMode=false] When true, an editor works in full editing mode. Mode disallows closing an editor
   *                                             when arrow keys are pressed.
   */
  openEditor(newInitialValue: string | null, event: Event, enableFullEditMode = false) {
    if (!this.isCellEditable()) {
      this.clearActiveEditor();

      return;
    }

    const selection = this.hot.getSelectedRangeActive();
    let allowOpening = this.hot.runHooks(
      'beforeBeginEditing',
      selection!.highlight.row,
      selection!.highlight.col,
      newInitialValue,
      event,
      enableFullEditMode,
    );

    // If the above hook does not return boolean then the default behavior is applied which disallows opening
    // an editor after double mouse click for non-contiguous selection (while pressing Ctrl/Cmd) and
    // for multiple selected cells (while pressing SHIFT).
    if (event instanceof MouseEvent && typeof allowOpening !== 'boolean') {
      allowOpening = this.hot.selection.getLayerLevel() === 0 && selection!.isSingle();
    }

    if (allowOpening === false) {
      this.clearActiveEditor();

      return;
    }

    if (!this.activeEditor) {
      this.hot.scrollToFocusedCell();
      this.prepareEditor();
    }

    if (this.activeEditor) {
      if (enableFullEditMode) {
        this.activeEditor.enableFullEditMode();
      }

      this.activeEditor.beginEditing(newInitialValue, event);
    }
  }

  /**
   * Close editor, finish editing cell.
   *
   * @param {boolean} restoreOriginalValue If `true`, then closes editor without saving value from the editor into a cell.
   * @param {boolean} isCtrlPressed If `true`, then editor will save value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  closeEditor(restoreOriginalValue = false, isCtrlPressed = false, callback?: Function) {
    if (this.activeEditor) {
      this.activeEditor.finishEditing(restoreOriginalValue, isCtrlPressed, callback);

    } else if (callback) {
      callback(false);
    }
  }

  /**
   * Close editor and save changes.
   *
   * @param {boolean} isCtrlPressed If `true`, then editor will save value to each cell in the last selected range.
   */
  closeEditorAndSaveChanges(isCtrlPressed?: boolean) {
    this.closeEditor(false, isCtrlPressed);
  }

  /**
   * Close editor and restore original value.
   *
   * @param {boolean} isCtrlPressed Indication of whether the CTRL button is pressed.
   */
  closeEditorAndRestoreOriginalValue(isCtrlPressed: boolean) {
    this.closeEditor(true, isCtrlPressed);
  }

  /**
   * Clears reference to an instance of the active editor.
   *
   * @private
   */
  clearActiveEditor() {
    this.activeEditor = undefined;
  }

  /**
   * Checks if the currently selected cell (pointed by selection highlight coords) is editable.
   * Editable cell is when:
   *   - the cell has defined an editor type;
   *   - the cell is not marked as read-only;
   *   - the cell is not hidden.
   *
   * @private
   * @returns {boolean}
   */
  isCellEditable() {
    const selection = this.hot.getSelectedRangeActive();

    if (!selection) {
      return false;
    }

    const editorClass = this.hot.getCellEditor(this.cellProperties);
    const { row, col } = selection.highlight;

    if (row === null || col === null) {
      return false;
    }

    if (this.cellProperties.readOnly || !editorClass || this.#isCellHidden(row, col)) {
      return false;
    }

    return true;
  }

  /**
   * Controls selection's behavior after clicking `Enter`.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  moveSelectionAfterEnter(event: KeyboardEvent) {
    if (!this.hot.getSelected()) {
      return;
    }

    const enterMoves = { ...typeof this.tableMeta.enterMoves === 'function' ?
      this.tableMeta.enterMoves(event) : this.tableMeta.enterMoves };

    if (event.shiftKey) {
      enterMoves.row = -(enterMoves.row ?? 0);
      enterMoves.col = -(enterMoves.col ?? 0);
    }

    if (this.hot.selection.isMultiple()) {
      this.selection.transformFocus(enterMoves.row ?? 0, enterMoves.col ?? 0);
    } else {
      this.selection.transformStart(enterMoves.row ?? 0, enterMoves.col ?? 0, true);
    }
  }

  /**
   * Checks whether the cell at the given VISUAL coordinates is hidden by a hiding index map
   * (Pagination's page map, `hiddenRows`, `hiddenColumns`).
   *
   * `IndexMapper#isHidden()` is keyed by PHYSICAL index, so both coordinates are converted. The two
   * index spaces coincide only while no sorting, move or trimming map is active; under
   * `columnSorting` a raw visual index reads a different row's hidden flag, which would both tear
   * down an edit on a fully visible cell and miss the hidden cell this check exists for.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   * @returns {boolean}
   */
  #isCellHidden(visualRow: number, visualColumn: number): boolean {
    return this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(visualRow)) ||
      this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(visualColumn));
  }

  /**
   * Ends an edit when a HIDING index map removes the edited cell from the DOM while the editor is
   * still open.
   *
   * Pagination turning the page, `hiddenRows` and `hiddenColumns` all register a `hiding` map,
   * which drops the cell from the render while its visual index stays valid. The editor used to
   * stay open, pinned to its original pixel position over whatever row slid into that spot, still
   * bound to its original coordinates, and to commit only on a later click - to a row the user
   * could no longer see.
   *
   * This lives in the manager rather than in an editor so that it covers every editor.
   * `SelectEditor` and `MultiSelectEditor` extend `BaseEditor` directly, as does anything built
   * through `editors/factory.ts`, so an editor-level hook reaches none of them.
   *
   * Test on `isHidden()`, NOT on whether the `TD` still resolves. A cell merely scrolled out of the
   * rendered window has no `TD` either, and closing there would silently commit an in-progress edit
   * on every scroll away. That is long-standing behavior in the other direction: the editor hides
   * itself on scroll but keeps `state` at `EDITING`, so the edit survives until the user scrolls
   * back. These hooks never fire on scroll, so that case cannot reach here at all.
   *
   * A TRIMMING map (Filters, `trimRows`) is deliberately out of scope. It collapses the visual
   * index space instead of preserving it, so the edited coordinates silently rebind to a different
   * row that is still rendered and `isHidden()` reads `false`. That defect predates this method.
   *
   * The edit is COMMITTED, not discarded, because that is what both existing paths already do:
   * clicking the pager is an outside click, which deselects and therefore commits, and an editor
   * orphaned by any other route commits on the next click. Only when the commit is REJECTED is the
   * edit reverted instead - see below.
   */
  #closeEditorWhenCellHidden(): void {
    const activeEditor = this.activeEditor;

    if (!activeEditor || activeEditor.row === null || activeEditor.col === null ||
        !this.#isCellHidden(activeEditor.row, activeEditor.col)) {
      return;
    }

    // `finishEditing()` is a silent no-op while an async validator is in flight, which would leave
    // the editor orphaned. Re-enter at the top once validation settles rather than assuming the
    // wait is over: `postAfterValidate` is instance-wide and may fire for an unrelated cell.
    if (activeEditor.isWaiting()) {
      if (!this.#hiddenCellCloseArmed) {
        this.#hiddenCellCloseArmed = true;

        this.hot.addHookOnce('postAfterValidate', () => {
          this.#hiddenCellCloseArmed = false;
          this.hot._registerTimeout(() => this.#closeEditorWhenCellHidden(), 0);
        });
      }

      return;
    }

    if (activeEditor.state !== EDITOR_STATE.EDITING || this.#hiddenCellCloseArmed) {
      return;
    }

    this.#hiddenCellCloseArmed = true;

    // Committing writes through `setDataAtCell`, which re-enters this manager (`closeEditor()`,
    // `render()`, `prepareEditor()`). Defer so the write never lands inside the cache update that
    // is still unwinding.
    this.hot._registerTimeout(() => {
      this.#hiddenCellCloseArmed = false;

      const editor = this.activeEditor;

      if (this.destroyed || !editor || editor.state !== EDITOR_STATE.EDITING ||
          editor.row === null || editor.col === null || !this.#isCellHidden(editor.row, editor.col)) {
        return;
      }

      this.closeEditor(false, false, (dataSaved: boolean) => {
        if (dataSaved) {
          return;
        }

        // Validation rejected the value and `allowInvalid: false` re-selected the hidden cell and
        // put the editor back into `EDITING`. Revert through the CAPTURED reference, not through
        // `closeEditor()`: that re-selection synchronously drives `prepareEditor()`, which finds
        // the cell hidden and has already run `clearActiveEditor()`, so `this.activeEditor` is
        // `undefined` by now and `closeEditor()` would be a no-op. Nothing is lost - the rejected
        // value never reached the dataset, `validateChanges()` splices it out first.
        editor.finishEditing(true);
      });
    }, 0);
  }

  /**
   * OnAfterDocumentKeyDown callback.
   *
   * @param {KeyboardEvent} event The keyboard event object.
   */
  #onAfterDocumentKeyDown(event: KeyboardEvent) {
    const selection = this.hot.getSelectedRangeActive();

    if (!this.hot.isListening() || !selection || selection.highlight.isHeader() ||
        isImmediatePropagationStopped(event)) {
      return;
    }

    const { keyCode } = event;

    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (!this.activeEditor || (this.activeEditor && !this.activeEditor.isWaiting())) {
      if (!isFunctionKey(keyCode) && !isCtrlMetaKey(keyCode) && !isCtrlPressed && !this.isEditorOpened()) {
        this.openEditor('', event);
      }
    }
  }

  /**
   * OnCellDblClick callback.
   *
   * @param {MouseEvent} event The mouse event object.
   * @param {object} coords The cell coordinates.
   */
  #onCellDblClick(event: MouseEvent, coords: { isCell: () => boolean } | null) {
    if (coords?.isCell()) {
      if (this.hot.getShortcutManager().isCtrlPressed()) {
        this.clearActiveEditor();
      } else {
        this.openEditor(null, event, true);
      }
    }
  }

  /**
   * Destroy the instance.
   */
  destroy() {
    this.destroyed = true;
    this.eventManager.destroy();
  }
}

const instances = new WeakMap<object, EditorManager>();

/**
 * @param {Core} hotInstance The Handsontable instance.
 * @param {TableMeta} tableMeta The table meta class instance.
 * @param {Selection} selection The selection instance.
 * @returns {EditorManager}
 */
(EditorManager as unknown as Record<string, Function>).getInstance = function(
  hotInstance: HotInstance, tableMeta: GridSettings, selection: SelectionManager
): EditorManager {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, tableMeta, selection);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
