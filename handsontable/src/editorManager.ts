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
   * The PHYSICAL row index of the record the active editor was prepared for, or `null` when no
   * editor is prepared. Captured because the editor itself stores only VISUAL coordinates, which a
   * trimming index map invalidates without notice.
   *
   * @type {number|null}
   */
  #editedPhysicalRow: number | null = null;
  /**
   * The PHYSICAL column index of the record the active editor was prepared for, or `null` when no
   * editor is prepared. The column counterpart of `#editedPhysicalRow`.
   *
   * @type {number|null}
   */
  #editedPhysicalColumn: number | null = null;
  /**
   * The size of each PHYSICAL index space as of the last cache update.
   *
   * Only a structural change - an inserted or removed row or column - changes these. A trim, a
   * permutation and a hide all leave the physical space the same size, so a difference here is the
   * signal that `#editedPhysicalRow` has just been renumbered out from under the editor.
   *
   * Seeded in the constructor rather than from a sentinel: the manager is built after the index
   * mappers are initialized, so the first cache update it ever sees is a real one, and a sentinel
   * would make that update look structural.
   *
   * @type {number}
   */
  #lastRowIndexCount = 0;
  /**
   * The column counterpart of `#lastRowIndexCount`.
   *
   * @type {number}
   */
  #lastColumnIndexCount = 0;
  /**
   * Reacts to an index-map cache update on either axis.
   *
   * A structural change and a rearrangement need opposite repairs - one invalidates the captured
   * PHYSICAL index and keeps the visual coordinate, the other does the reverse - and the state object
   * cannot tell them apart, because `insertIndexes()`/`removeIndexes()` raise the same flags a filter
   * does. The SIZE of the physical space can: only an insert or a remove changes it. Comparing it
   * against the previous update picks the right repair without relying on hook ordering, and nothing
   * a plugin vetoes can strand it - a cancelled `beforeCreateRow` never changes the count either.
   *
   * The one shape this misses is a structural change that leaves the count where it started - an
   * insert and a removal batched into a single cache update. `alter()` performs one operation per
   * call, so nothing in core produces it.
   *
   * The chosen repair runs BEFORE the hidden-cell guard, so that guard tests `isHidden()` against
   * corrected coordinates rather than the stale ones the index map just invalidated.
   *
   * @param {object} indexesChangesState The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   * @param {boolean} indexesChangesState.hiddenIndexesChanged Whether the hidden indexes changed.
   */
  #onSequenceCacheUpdate = (indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean;
  }): void => {
    const rowIndexCount = this.hot.rowIndexMapper.getNumberOfIndexes();
    const columnIndexCount = this.hot.columnIndexMapper.getNumberOfIndexes();
    const isStructuralChange = rowIndexCount !== this.#lastRowIndexCount ||
      columnIndexCount !== this.#lastColumnIndexCount;

    this.#lastRowIndexCount = rowIndexCount;
    this.#lastColumnIndexCount = columnIndexCount;

    if (isStructuralChange) {
      this.#recaptureEditedRecord();
    } else {
      this.#reconcileEditorWithIndexMaps(indexesChangesState);
    }

    this.#closeEditorWhenCellHidden();
  };

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
    this.#lastRowIndexCount = hotInstance.rowIndexMapper.getNumberOfIndexes();
    this.#lastColumnIndexCount = hotInstance.columnIndexMapper.getNumberOfIndexes();

    this.hot.addHook('afterDocumentKeyDown', (event: KeyboardEvent) => this.#onAfterDocumentKeyDown(event));
    this.hot.addHook('beforeCompositionStart', (event: KeyboardEvent) => this.#onAfterDocumentKeyDown(event));
    this.hot.addHook('afterRowSequenceCacheUpdate', this.#onSequenceCacheUpdate);
    this.hot.addHook('afterColumnSequenceCacheUpdate', this.#onSequenceCacheUpdate);
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
    // A new edit cycle always re-arms the hidden-cell guard. Without this the latch is
    // instance-scoped, so one editor left stuck in `WAITING` with no `postAfterValidate` (a
    // `beforeChange` that cancels the change, for instance) would disable the guard for the rest
    // of the instance's life rather than for that one edit.
    this.#hiddenCellCloseArmed = false;

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
      // Remember which RECORD this edit belongs to. The editor keeps visual coordinates only, and a
      // trimming map rebinds those to a different record; see `#reconcileEditorWithIndexMaps()`.
      this.#editedPhysicalRow = this.hot.rowIndexMapper.getPhysicalFromVisualIndex(row);
      this.#editedPhysicalColumn = this.hot.columnIndexMapper.getPhysicalFromVisualIndex(col);
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
    this.#editedPhysicalRow = null;
    this.#editedPhysicalColumn = null;
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
   * Re-derives the edited record after a structural change has renumbered the physical space.
   *
   * Runs INSTEAD of the reconciliation, never after it, so the stale captured index is never acted on.
   *
   * Inserting or removing rows shifts the physical indexes of everything below, so the index captured
   * in `prepareEditor()` now addresses a different record - but the editor's VISUAL coordinate came
   * through intact, because the index mapper moved the visual space with it. So the visual side is
   * the trustworthy one here, and it is what the record is read back from.
   *
   * A visual coordinate that no longer resolves means the change left the editor past the last row.
   * There is nothing to commit to, so the edit is dropped rather than written through a coordinate
   * that `applyChanges()` would satisfy by appending records.
   */
  #recaptureEditedRecord(): void {
    const editor = this.activeEditor;

    if (!editor || editor.state !== EDITOR_STATE.EDITING || editor.row === null || editor.col === null) {
      return;
    }

    const physicalRow = this.hot.rowIndexMapper.getPhysicalFromVisualIndex(editor.row);
    const physicalColumn = this.hot.columnIndexMapper.getPhysicalFromVisualIndex(editor.col);

    if (physicalRow === null || physicalColumn === null) {
      editor.cancelChanges();
      this.clearActiveEditor();

      return;
    }

    this.#editedPhysicalRow = physicalRow;
    this.#editedPhysicalColumn = physicalColumn;
  }

  /**
   * Keeps an open editor bound to the RECORD it was opened on when an index map rearranges the
   * visual index space underneath it.
   *
   * Two kinds of change do that. A TRIMMING map (Filters, `trimRows`, `nestedRows`) COLLAPSES the
   * visual space - the rows below a trimmed row shift up and the row count shrinks. A SEQUENCE change
   * (`columnSorting`, `manualRowMove`, `manualColumnFreeze`) permutes it. Either way the editor is
   * left holding the visual coordinates it captured in `prepare()`, and `BaseEditor#saveValue()`
   * writes straight through them with no bounds check, so the pending edit lands on whichever record
   * now occupies that visual slot - or, when a trim left the slot past the shortened row count, on
   * rows that `applyChanges()` APPENDS to the source data to make room for it. Both are silent data
   * corruption.
   *
   * Resolving the stored PHYSICAL index back to a visual one covers every shape with one test: the
   * record is gone (no visual index - discard), the record moved (rebind - the edit still commits, to
   * the right record), or nothing moved (no-op). The last branch is what keeps this from firing
   * spuriously: `BooleanMap#setValues()` emits a change even for a no-op write, so testing "something
   * changed" alone would tear down unrelated edits.
   *
   * A structural change - an inserted or removed row or column - is the one case this reasoning does
   * NOT cover, because it renumbers the physical space and invalidates the captured index while
   * leaving the visual coordinate correct. It raises the same flags and cannot be told apart from the
   * state object, so `#onSequenceCacheUpdate()` routes those to `#recaptureEditedRecord()` instead,
   * discriminating on the physical index count. Without that split, a grid with any trimming map
   * registered would discard a valid edit on `alter('remove_row', ...)` and, with a sort active,
   * rebind onto the wrong record on `alter('insert_row_above', ...)`.
   *
   * Runs SYNCHRONOUSLY, unlike `#closeEditorWhenCellHidden()`. `Filters#filter()` re-selects the
   * highlighted column immediately after writing its map, which commits the open editor before any
   * deferred handler could run. Deferring here would let the corrupting write happen first. Nothing
   * re-enters the manager as a result: the rebind writes no data, and the discard goes through
   * `cancelChanges()` rather than `finishEditing(true)` to skip the render the latter appends, so
   * neither branch reaches `setDataAtCell()` inside a cache update that is still unwinding.
   *
   * `cancelChanges()` also bypasses editor-level discard policy - `DropdownEditor#finishEditing()`
   * rewrites the restore flag - which is harmless here because a discard is what that override would
   * decide anyway once the edited record is gone from the visual space.
   *
   * A rebind moves the editor's coordinates, NOT its pixel position or the selection - neither
   * `render()` nor `view.render()` repositions an open editor, so it stays drawn over the row it
   * started on for the rest of the edit. On the Filters path that is invisible because `filter()`
   * closes the editor outright, but on the `trimRows` path the editor is left painted over a
   * neighbouring row. The commit still lands on the right record; only the position is wrong.
   *
   * Three limits, all deliberate. An index-map change does NOT adjust the selection - `core.ts` calls
   * `selection.commit()` only for `hiddenIndexesChanged` - so the highlight can be left past the last
   * row, and typing into it grows the data set. That is reachable with no editor involved at all and
   * is a separate defect; this method does not paper over it. No core plugin registers a TRIMMING map
   * on the column axis, so the column half of that case runs for user-registered maps only, though
   * core plugins do permute the column sequence (`manualColumnMove`, `manualColumnFreeze`).
   *
   * And an editor parked in `WAITING` is not reconciled: `finishEditing()` has already run
   * `saveValue()` by then, so there is nothing left to redirect.
   *
   * @param {object} indexesChangesState The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   * @param {boolean} indexesChangesState.hiddenIndexesChanged Whether the hidden indexes changed.
   */
  #reconcileEditorWithIndexMaps(indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean;
  }): void {
    const editor = this.activeEditor;

    if ((!indexesChangesState.trimmedIndexesChanged && !indexesChangesState.indexesSequenceChanged) ||
        !editor ||
        editor.state !== EDITOR_STATE.EDITING ||
        this.#editedPhysicalRow === null || this.#editedPhysicalColumn === null) {
      return;
    }

    const visualRow = this.hot.rowIndexMapper.getVisualFromPhysicalIndex(this.#editedPhysicalRow);
    const visualColumn = this.hot.columnIndexMapper.getVisualFromPhysicalIndex(this.#editedPhysicalColumn);

    // No visual index means the record itself is trimmed. There is nowhere to commit to, so the edit
    // is dropped rather than written through coordinates that now address a different record.
    if (visualRow === null || visualColumn === null) {
      editor.cancelChanges();
      // Drop the reference too. `openEditor()` re-prepares only when there is no active editor, so a
      // lingering one would let the next keystroke reuse this editor's pre-trim `TD`, `prop`,
      // `originalValue` and cell meta. Clearing sends the next edit back through `prepareEditor()`,
      // which reads them from the post-trim state.
      this.clearActiveEditor();

      return;
    }

    editor.row = visualRow;
    editor.col = visualColumn;
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
   * A TRIMMING map (Filters, `trimRows`) needs the opposite treatment and is handled separately by
   * `#reconcileEditorWithIndexMaps()`, which runs first on the same two hooks. It collapses the
   * visual index space instead of preserving it, so `isHidden()` reads `false` for a trimmed row and
   * this method never fires for one.
   *
   * The edit is finished rather than cancelled, which for most editors means it is COMMITTED - the
   * same outcome clicking the pager already produces, since that is an outside click and therefore
   * deselects. The final say belongs to the editor: `DropdownEditor#finishEditing()` rewrites the
   * flag to a discard when the active range no longer contains the edited cell, and
   * `selection.commit()` runs before these hooks, so a dropdown can legitimately discard here.
   * Where the commit is REJECTED - a validator returned `false` under `allowInvalid: false`, which
   * re-selects the hidden cell and restores `EDITING` - the edit is reverted instead, because an
   * editor surviving on a cell the user cannot see is the bug being fixed.
   *
   * @param {BaseEditor} [pendingEditor] The editor this call is retrying for. Supplied only by the
   *                                     async-validation retry below.
   */
  #closeEditorWhenCellHidden(pendingEditor?: BaseEditor): void {
    // Fall back to the captured reference: a rejected validation re-selects the hidden cell, which
    // drives `prepareEditor()` -> `clearActiveEditor()`, so `this.activeEditor` can already be gone
    // by the time a retry lands even though the editor object is still open.
    const editor = this.activeEditor ?? pendingEditor;

    if (!editor || editor.row === null || editor.col === null ||
        !this.#isCellHidden(editor.row, editor.col)) {
      return;
    }

    // `finishEditing()` is a silent no-op while an async validator is in flight, which would leave
    // the editor orphaned. Re-enter at the top once validation settles rather than assuming the
    // wait is over: `postAfterValidate` is instance-wide and may fire for an unrelated cell.
    if (editor.isWaiting()) {
      if (!this.#hiddenCellCloseArmed) {
        this.#hiddenCellCloseArmed = true;

        this.hot.addHookOnce('postAfterValidate', () => {
          this.#hiddenCellCloseArmed = false;
          this.hot._registerTimeout(() => this.#closeEditorWhenCellHidden(editor), 0);
        });
      }

      return;
    }

    if (editor.state !== EDITOR_STATE.EDITING || this.#hiddenCellCloseArmed) {
      return;
    }

    this.#hiddenCellCloseArmed = true;

    // Committing writes through `setDataAtCell`, which re-enters this manager (`closeEditor()`,
    // `render()`, `prepareEditor()`). Defer so the write never lands inside the cache update that
    // is still unwinding.
    this.hot._registerTimeout(() => {
      this.#hiddenCellCloseArmed = false;

      if (this.destroyed || editor.state !== EDITOR_STATE.EDITING ||
          editor.row === null || editor.col === null || !this.#isCellHidden(editor.row, editor.col)) {
        return;
      }

      // Drive the captured editor directly rather than `closeEditor()`, for the same reason as
      // the fallback above: `this.activeEditor` may already have been cleared.
      editor.finishEditing(false, false, (dataSaved: boolean) => {
        if (dataSaved) {
          return;
        }

        // Nothing is lost by reverting - the rejected value never reached the dataset,
        // `validateChanges()` splices it out first.
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
