import type { HotInstance } from './core/types';
import type { GridSettings } from './core/settings';
import type { CellProperties } from './settings';
import type { default as SelectionManager } from './selection/selection';
import type { IndexesChangeSource } from './translations/indexMapper';
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
   * Whether a structural change stranded the editor during the CURRENT task.
   *
   * `alter()` emits its cache update before `selection.shiftRows()`, so between the two the editor
   * legitimately sits on a coordinate that resolves to nothing while a `prepareEditor()` is still
   * coming. Anything that reconciles inside that window – a plugin trimming from `afterRemoveRow`,
   * say – would otherwise read the editor as unusable and discard an edit that was about to commit.
   *
   * Cleared on a timeout rather than on a paired hook, so nothing a plugin cancels can strand it:
   * the window closes when the task that opened it ends, which is where `alter()` has finished all
   * its synchronous work.
   *
   * @type {boolean}
   */
  #strandedInCurrentTask = false;
  /**
   * Reacts to a ROW index-map cache update.
   *
   * `afterRowSequenceCacheUpdate` is a PUBLIC hook, so `hot.runHooks()` can fire it with no payload
   * at all. The state defaults to all-false for that case, which routes through reconciliation and
   * keeps the hidden-cell guard behind it running.
   *
   * @param {object} [indexesChangesState] The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   * @param {IndexesChangeSource} [indexesChangesState.indexesChangeSource] The sequence change source.
   */
  #onRowSequenceCacheUpdate = (indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean;
    indexesChangeSource?: IndexesChangeSource;
  } = { indexesSequenceChanged: false, trimmedIndexesChanged: false }): void => {
    this.#repairEditor(this.#isStructuralChange(indexesChangesState), indexesChangesState);
  };
  /**
   * Reacts to a COLUMN index-map cache update.
   *
   * Kept separate from the row handler so a structural change on one axis cannot route the other
   * axis's rearrangement into the wrong repair.
   *
   * @param {object} [indexesChangesState] The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   * @param {IndexesChangeSource} [indexesChangesState.indexesChangeSource] The sequence change source.
   */
  #onColumnSequenceCacheUpdate = (indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean;
    indexesChangeSource?: IndexesChangeSource;
  } = { indexesSequenceChanged: false, trimmedIndexesChanged: false }): void => {
    this.#repairEditor(this.#isStructuralChange(indexesChangesState), indexesChangesState);
  };
  /**
   * Determines whether a cache update renumbered the physical index space.
   *
   * @param {object} indexesChangesState The state object of the index mapper's cache update.
   * @param {IndexesChangeSource} [indexesChangesState.indexesChangeSource] The sequence change source.
   * @returns {boolean}
   */
  #isStructuralChange(indexesChangesState: {
    indexesChangeSource?: IndexesChangeSource;
  }): boolean {
    return indexesChangesState.indexesChangeSource === 'insert' ||
      indexesChangesState.indexesChangeSource === 'remove';
  }
  /**
   * Applies the repair one axis's cache update calls for, then lets the hidden-cell guard run.
   *
   * The repair runs BEFORE that guard, so it tests `isHidden()` against corrected coordinates rather
   * than the stale ones the index map just invalidated.
   *
   * @param {boolean} isStructuralChange Whether that axis's physical index space was structurally changed.
   * @param {object} indexesChangesState The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   */
  #repairEditor(isStructuralChange: boolean, indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean;
  }): void {
    // `core.destroy()` tears the manager down and only then force-flushes both mappers, so this is
    // still reachable afterwards. Every other path in this file guards the same way.
    if (this.destroyed) {
      return;
    }

    if (isStructuralChange) {
      this.#recaptureEditedRecord();
    } else {
      this.#reconcileEditorWithIndexMaps(indexesChangesState);
    }

    this.#closeEditorWhenCellHidden();
  }

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
    this.hot.addHook('afterRowSequenceCacheUpdate', this.#onRowSequenceCacheUpdate);
    this.hot.addHook('afterColumnSequenceCacheUpdate', this.#onColumnSequenceCacheUpdate);
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
    // A successful re-prepare is the end of any strand window.
    this.#strandedInCurrentTask = false;

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
      // The cell is rendered, so the column resolves; the fallback keeps the editor receiving the
      // index for the column it was already given before `colToProp()` began answering `null`.
      const prop = this.hot.colToProp(visualColumnToCheck) ?? visualColumnToCheck;
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
   * in `prepareEditor()` now addresses a different record – but the editor's VISUAL coordinate came
   * through intact, because the index mapper moved the visual space with it. So the visual side is
   * the trustworthy one here, and it is what the record is read back from.
   *
   * This never discards. USUALLY core carries the edit across on its own: `alter()` runs
   * `selection.shiftRows()` after the cache update, and the `prepareEditor()` behind it re-derives
   * the editor's coordinates and the captured record together. Where that happens, discarding here
   * would throw away an edit that was about to commit correctly.
   *
   * It does not always happen. `shiftRows()` only shifts a range whose outer top-start corner is at
   * or below the removed row, so a focus moved below that corner – Enter or Tab inside a multi-cell
   * selection – is left where it was, and `core.ts` only closes the editor when the removed range
   * covers the HIGHLIGHT. The editor is then stranded past the last row and the commit appends, the
   * same as it does without this repair. What this method still guarantees in that case is that it
   * does not make things worse: the captured record is cleared rather than left pointing at whatever
   * record inherited its index, so no later trim can resolve a lie and rebind onto a live record.
   */
  #recaptureEditedRecord(): void {
    const editor = this.activeEditor;

    if (!editor || (editor.state !== EDITOR_STATE.EDITING && editor.state !== EDITOR_STATE.VIRGIN) ||
        editor.row === null || editor.col === null) {
      return;
    }

    const physicalRow = this.hot.rowIndexMapper.getPhysicalFromVisualIndex(editor.row);
    const physicalColumn = this.hot.columnIndexMapper.getPhysicalFromVisualIndex(editor.col);

    // A coordinate that no longer resolves means the removal was at or above the edited cell. Leave
    // the EDITOR alone – `shiftRows()` normally moves the highlight and the `prepareEditor()` behind
    // it re-derives everything, and discarding here would throw away an edit about to commit
    // correctly – but drop the captured record, which the renumbering has just invalidated. Where the
    // re-prepare does happen it re-captures anyway; where it does not, the reconciliation early-exits
    // on `null` instead of resolving a stale index onto whatever record inherited it.
    if (physicalRow === null || physicalColumn === null) {
      this.#editedPhysicalRow = null;
      this.#editedPhysicalColumn = null;
      this.#strandedInCurrentTask = true;

      this.hot._registerTimeout(() => {
        this.#strandedInCurrentTask = false;
      }, 0);

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
   * visual space – the rows below a trimmed row shift up and the row count shrinks. A SEQUENCE change
   * (`columnSorting`, `manualRowMove`, `manualColumnFreeze`) permutes it. Either way the editor is
   * left holding the visual coordinates it captured in `prepare()`, and `BaseEditor#saveValue()`
   * writes straight through them with no bounds check, so the pending edit lands on whichever record
   * now occupies that visual slot – or, when a trim left the slot past the shortened row count, on
   * rows that `applyChanges()` APPENDS to the source data to make room for it. Both are silent data
   * corruption.
   *
   * Resolving the stored PHYSICAL index back to a visual one covers every shape with one test: the
   * record is gone (no visual index – discard), the record moved (rebind – the edit still commits, to
   * the right record), or nothing moved (no-op). The last branch is what keeps this from firing
   * spuriously: `BooleanMap#setValues()` emits a change even for a no-op write, so testing "something
   * changed" alone would tear down unrelated edits.
   *
   * A structural change – an inserted or removed row or column – is the one case this reasoning does
   * NOT cover, because it renumbers the physical space and invalidates the captured index while
   * leaving the visual coordinate correct. It raises the same flags, so the state object cannot tell
   * it apart; `#onRowSequenceCacheUpdate()` and its column twin discriminate on the physical index
   * count and route those to `#recaptureEditedRecord()` instead. Without that split, a grid with any
   * trimming map registered would, with a sort active, rebind onto the wrong record on
   * `alter('insert_row_above', ...)`.
   *
   * Runs SYNCHRONOUSLY, unlike `#closeEditorWhenCellHidden()`. `Filters#filter()` re-selects the
   * highlighted column immediately after writing its map, which commits the open editor before any
   * deferred handler could run. Deferring here would let the corrupting write happen first. Neither
   * branch writes data, so nothing reaches `setDataAtCell()` inside a cache update still unwinding.
   *
   * The discard goes through `cancelChanges()` rather than `finishEditing(true)`, which skips the
   * render `finishEditing()` appends – but NOT every render: `AutocompleteEditor#discardEditor()`
   * calls `view.render()` unconditionally, so for the autocomplete family this repaints from inside
   * `IndexMapper#updateCache()`. That is the same nested repaint the pre-existing `outsideClick`
   * teardown already performs, and the render reads the caches this update has already rebuilt.
   *
   * `cancelChanges()` also bypasses editor-level discard policy – `DropdownEditor#finishEditing()`
   * rewrites the restore flag – which is harmless here because a discard is what that override would
   * decide anyway once the edited record is gone from the visual space.
   *
   * A rebind moves the editor's coordinates and NOTHING else – not its pixel position, not the
   * selection. Neither `render()` nor `view.render()` repositions an open editor, so it stays drawn
   * over the row it started on for the rest of the edit; on the Filters path that is invisible
   * because `filter()` closes the editor outright, but on the `trimRows` path it is left painted
   * over a neighboring row.
   *
   * That the selection does not follow bounds what the rebind can promise, and the boundary is worth
   * stating precisely. A plain text commit reads `this.row`/`this.col` and lands on the right record.
   * Two paths do not: an editor whose `finishEditing()` vetoes on a moved range rewrites the commit
   * into a discard (`DropdownEditor` only - `autocomplete` lost that override when #12285 moved it
   * down, and `date` is built on `TextEditor`, not on this line at all), and a Ctrl+Enter commit
   * reads the SELECTION corners rather than the editor's coordinates
   * (`BaseEditor#saveValue()`). On both the edit is lost rather than misplaced – which is what this
   * method exists to guarantee, and strictly better than the row-appending corruption they produced
   * before it – but the value does not survive. Making it survive means moving the selection with the
   * record, which is a larger change than this repair: DEV-2680.
   *
   * Both exceptions are pinned by cases in `tests/e2e/editor-trimmed-row.spec.ts` under `commit paths
   * the rebind cannot reach`. Those cases assert the LOSS on purpose, so a regression back to a write
   * fails – they are not a statement that losing the edit is the desired end state. DEV-2680 inverts
   * them.
   *
   * An editor a structural change stranded past the last row is discarded here rather than rebound:
   * its captured record was cleared as unresolvable, and its own coordinates address nothing, so
   * there is no record left to follow. Discarding is what keeps a following `Filters#filter()` from
   * committing through those coordinates and appending records.
   *
   * Two further limits. An index-map change does NOT adjust the selection – `core.ts` calls
   * `selection.commit()` only for `hiddenIndexesChanged` – so the highlight can be left past the last
   * row, and typing into it grows the data set. That is reachable with no editor involved at all and
   * is a separate defect; this method does not paper over it. And an editor parked in `WAITING` is
   * not reconciled: `finishEditing()` has already run `saveValue()` by then, so there is nothing
   * left to redirect.
   *
   * No core plugin registers a TRIMMING map on the column axis, so that half runs for user-registered
   * maps only; core plugins do permute the column sequence (`manualColumnMove`, `manualColumnFreeze`)
   * and the reconciliation follows those.
   *
   * @param {object} indexesChangesState The state object of the index mapper's cache update.
   * @param {boolean} indexesChangesState.indexesSequenceChanged Whether the indexes sequence changed.
   * @param {boolean} indexesChangesState.trimmedIndexesChanged Whether the trimmed indexes changed.
   */
  #reconcileEditorWithIndexMaps(indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean;
  }): void {
    const editor = this.activeEditor;
    const isEditing = editor?.state === EDITOR_STATE.EDITING;
    // A prepared-but-untyped editor is just as stale as an editing one, and more quietly so: nothing
    // re-prepares it, `openEditor()` skips `prepareEditor()` while a reference exists, and the first
    // keystroke then calls `beginEditing()` on the pre-change coordinates.
    const isPrepared = editor?.state === EDITOR_STATE.VIRGIN;

    if ((!indexesChangesState.trimmedIndexesChanged && !indexesChangesState.indexesSequenceChanged) ||
        !editor || (!isEditing && !isPrepared)) {
      return;
    }

    // No captured record means an earlier structural change renumbered it away. The editor's own
    // coordinates are then the only thing left, so check whether they still address anything: if
    // they do not, that change stranded the editor past the last row and nothing re-prepared it. A
    // commit through those coordinates is what `applyChanges()` satisfies by APPENDING records, so
    // the edit is dropped here rather than at the next keystroke.
    //
    // Not while `#strandedInCurrentTask` is set: inside the `alter()` that stranded it the editor
    // reads as unusable only because `selection.shiftRows()` has not run yet, and the re-prepare
    // behind it is about to make the coordinates good again.
    //
    // Only reached with no captured record. While one exists it is the better guide - it survives a
    // trim that leaves the editor's own stale coordinates unresolvable, which is the ordinary rebind.
    if (this.#editedPhysicalRow === null || this.#editedPhysicalColumn === null) {
      if (!this.#strandedInCurrentTask &&
          (this.hot.rowIndexMapper.getPhysicalFromVisualIndex(editor.row!) === null ||
           this.hot.columnIndexMapper.getPhysicalFromVisualIndex(editor.col!) === null)) {
        if (isEditing) {
          editor.cancelChanges();
        }

        this.clearActiveEditor();
      }

      return;
    }

    const visualRow = this.hot.rowIndexMapper.getVisualFromPhysicalIndex(this.#editedPhysicalRow);
    const visualColumn = this.hot.columnIndexMapper.getVisualFromPhysicalIndex(this.#editedPhysicalColumn);

    if (isPrepared) {
      // Nothing has been typed, so there is no value to carry and no reason to rebind. Dropping the
      // reference is the whole repair: the next keystroke finds no active editor and goes back
      // through `prepareEditor()`, which reads the coordinates, `TD`, `prop`, `originalValue` and
      // cell meta from the post-change state.
      if (visualRow !== editor.row || visualColumn !== editor.col) {
        this.clearActiveEditor();
      }

      return;
    }

    // No visual index means the record itself is trimmed. There is nowhere to commit to, so the edit
    // is dropped rather than written through coordinates that now address a different record.
    if (visualRow === null || visualColumn === null) {
      editor.cancelChanges();
      // Drop the reference too, for the same reason as the prepared case above.
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
   * the repair dispatched before this method on the same two hooks. A trimming map collapses the
   * visual index space instead of preserving it, so `isHidden()` reads `false` for a trimmed row and
   * this method never fires for one.
   *
   * The edit is finished rather than cancelled, which for most editors means it is COMMITTED - the
   * same outcome clicking the pager already produces, since that is an outside click and therefore
   * deselects. The final say still belongs to the editor: `DropdownEditor#finishEditing()` rewrites
   * the flag to a discard when the active range no longer contains the edited cell. On THIS path it
   * does not fire - `core.ts` calls `selection.commit()` for a hiding change, and that re-derives
   * the highlights without moving the range, so the range still contains the edited cell (measured
   * over 600 runs while chasing DEV-2676). A deselect from any other source still makes it fire.
   *
   * DEV-2676 was mistaken for that veto and was not it: the value lost here came from
   * `AutocompleteEditor`'s choice list, whose highlight is moved by a query deferred 10 ms behind
   * the keystrokes, so a commit forced inside that window read the match for the PREVIOUS keystroke
   * and `HandsontableEditor#finishEditing()` copied it over the typed text. The editors now refuse
   * a stale match (`canCommitInnerSelection()`), so this path commits what was typed.
   *
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
