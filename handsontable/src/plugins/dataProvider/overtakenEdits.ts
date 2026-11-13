import { isRootInstance } from '../../utils/rootInstance';
import { isValidatorCorrection } from '../../core/writeLedger';
import { readRowIdOrUndefined } from './query/crud';
import type { HotInstance } from '../../core/types';
import type { CellChange } from '../../settings';
import type { RowIdOption } from '../../utils/rowId';

/**
 * The editor that waited for its validator when a refetch that follows a save replaced the data: the cell it
 * edited, the text the user typed, and the change of the set it saved.
 */
interface WaitingEditor {
  row: number;
  col: number;
  typedValue: string;
  change: CellChange;
  highlight: { row: number | null, col: number | null } | null;
}

/**
 * A change set a refetch that follows a save overtook while it waited for its validators.
 */
interface OvertakenSet {
  rowIds: Map<CellChange, unknown>;
  sequence: number;
  editor: WaitingEditor | null;
}

/**
 * Writes again the edits a refetch that follows a save dropped. Core drops a change that waits for its validator
 * when `loadData()` replaces the data, and every save DataProvider makes refetches through `loadData()`, so a
 * second edit committed while the first save refetched was lost. The refetch brings the same records back, so the
 * edit is written again into the record it addressed, found by row id, with its own source, and DataProvider's
 * own `afterChange` path validates and saves it. An edit the user confirmed in an editor that a validator then
 * rejected opens the editor again on the record, with the typed text, as it stays open when no load intervenes.
 *
 * Only a set made with a source DataProvider saves is written again, and only when the load that dropped it is a
 * refetch that follows a save. A sort, a filter, a page change, `fetchData()`, or a load DataProvider did not make
 * drops it for good: they bring other rows.
 */
export class OvertakenEdits {
  /**
   * The Handsontable instance.
   *
   * @type {Core}
   */
  #hot: HotInstance;
  /**
   * Returns the `rowId` option the row ids are read with.
   *
   * @type {Function}
   */
  #getRowIdOption: () => RowIdOption;
  /**
   * The change sets a refetch that follows a save overtook, waiting for the drop that writes them again.
   *
   * @type {Map<Array, object>}
   */
  #overtakenSets: Map<CellChange[], OvertakenSet> = new Map();
  /**
   * The properties, by row id, the overtaken sets write. Only a later write to one of these cells is recorded.
   *
   * @type {Map<*, Set<*>>}
   */
  #overtakenCells: Map<unknown, Set<unknown>> = new Map();
  /**
   * The properties the overtaken sets write, so a later write to another property reads no row id.
   *
   * @type {Set<*>}
   */
  #overtakenProps: Set<unknown> = new Set();
  /**
   * Advances on every set made, and orders the overtaken sets against the writes made after them.
   *
   * @type {number}
   */
  #sequence = 0;
  /**
   * The sequence of the latest write made after an overtaking load to a cell an overtaken set writes, by row id
   * and property. Such a write is newer than the overtaken one and wins.
   *
   * @type {Map<*, Map<*, number>>}
   */
  #laterWrites: Map<unknown, Map<unknown, number>> = new Map();
  /**
   * `true` while a set is written again, so that write does not count as a newer one.
   *
   * @type {boolean}
   */
  #isWritingAgain = false;

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {Function} getRowIdOption Returns the `rowId` option.
   */
  constructor(hot: HotInstance, getRowIdOption: () => RowIdOption) {
    this.#hot = hot;
    this.#getRowIdOption = getRowIdOption;
  }

  /**
   * Notes a change set made through `setDataAtCell()` or `setDataAtRowProp()` while an overtaken set waits to be
   * written again: the cells it shares with an overtaken set are marked as written later. A validator's
   * correction belongs to the change it corrects, so it marks nothing.
   *
   * @param {Array} changes The change set.
   * @param {string} [source] The change source.
   */
  trackSet(changes: CellChange[], source: string | undefined): void {
    this.#sequence += 1;

    if (this.#overtakenSets.size === 0 || this.#isWritingAgain || isValidatorCorrection(source)) {
      return;
    }

    changes.forEach(([row, prop]) => {
      if (!this.#overtakenProps.has(prop)) {
        return;
      }

      const rowId = this.#readRowId(row);

      if (!this.#overtakenCells.get(rowId)?.has(prop)) {
        return;
      }

      if (!this.#laterWrites.has(rowId)) {
        this.#laterWrites.set(rowId, new Map());
      }

      this.#laterWrites.get(rowId)!.set(prop, this.#sequence);
    });
  }

  /**
   * Called right before a refetch that follows a save loads its rows. Every set core still lists as waiting for
   * its validators will be dropped by the load, so the row id each change of a set DataProvider saves addresses is
   * read now, while the rows it was made on are still loaded. An editor that waits for its validator is closed by
   * the load; its cell and the text the user typed are kept with the set it saved.
   *
   * @param {Function} isSaved Tells whether DataProvider saves a set of the given changes and source.
   */
  overtakeWaitingSets(isSaved: (changes: CellChange[], source: string | undefined) => boolean): void {
    const editor = this.#readWaitingEditor();

    this.#hot._getWaitingChangeSets().forEach(({ changes, source }) => {
      if (!isSaved(changes, source)) {
        return;
      }

      const rowIds = new Map<CellChange, unknown>();
      let editorChange: CellChange | undefined;

      changes.forEach((change) => {
        const rowId = this.#readRowId(change[0]);

        rowIds.set(change, rowId);
        this.#addOvertakenCell(rowId, change[1]);

        if (editor && source === 'edit' && change[0] === editor.row && change[1] === editor.prop) {
          editorChange = change;
        }
      });

      this.#overtakenSets.set(changes, {
        rowIds,
        sequence: this.#sequence,
        editor: editor && editorChange ? {
          row: editor.row,
          col: editor.col,
          typedValue: editor.typedValue,
          change: editorChange,
          highlight: editor.highlight,
        } : null,
      });
    });
  }

  /**
   * Forgets every set. Called on a load that is not a refetch that follows a save, and when the plugin is
   * disabled: such a load drops the waiting sets for good.
   */
  reset(): void {
    this.#overtakenSets.clear();
    this.#clearCellIndex();
  }

  /**
   * Writes again a dropped set a refetch that follows a save overtook. Each change goes to the record it
   * addressed, found by its row id, with the set's own source. A change whose record is gone (removed on the
   * server, on another page, or without an id) stays dropped, and so does one whose cell was written again after
   * the load. The change the user confirmed in an editor goes through that editor again, see
   * `#reopenEditor()`.
   *
   * @param {Array} changes The dropped set.
   * @param {string} [source] The change source.
   * @param {Array} rejectedChanges The changes of the set a validator rejected under `allowInvalid: false`.
   */
  writeAgain(changes: CellChange[], source: string | undefined, rejectedChanges: CellChange[]): void {
    const overtaken = this.#overtakenSets.get(changes);

    if (!overtaken) {
      return;
    }

    this.#overtakenSets.delete(changes);

    const { editor } = overtaken;
    const writes: Array<[number, string | number, unknown]> = [];
    let reopensEditor = false;

    changes.forEach((change) => {
      const row = this.#findRecord(overtaken, change);

      if (row === null) {
        return;
      }

      if (change === editor?.change && this.#canReopenEditor(editor)) {
        reopensEditor = true;

        return;
      }

      writes.push([row, change[1] as string | number, change[3]]);
    });

    this.#isWritingAgain = true;

    try {
      if (writes.length > 0) {
        this.#hot.setDataAtRowProp(writes, source);
      }

      if (reopensEditor && !this.#reopenEditor(overtaken, true)) {
        this.#writeEditorChange(overtaken, source);

      } else if (editor && rejectedChanges.includes(editor.change) && this.#canReopenEditor(editor)) {
        this.#reopenEditor(overtaken, false);
      }
    } finally {
      this.#isWritingAgain = false;

      if (this.#overtakenSets.size === 0) {
        this.#clearCellIndex();
      }
    }
  }

  /**
   * Opens the editor again on the record the user edited, with the text they typed, and, for a value the first
   * validation accepted, confirms it, so the editor saves it, waits for the validator, and stays open when the
   * validator rejects it under `allowInvalid: false`, as on a grid no load interrupted. A value the first
   * validation rejected is left open for the user to correct. The selection moves to the record's cell only when
   * the editor opens there: when the cell takes no editor, or the editor declines to open
   * (`beforeBeginEditing`), the selection is put back on the cell it was on.
   *
   * @param {object} overtaken The overtaken set.
   * @param {boolean} confirms Whether to confirm the typed value.
   * @returns {boolean} `false` when the editor did not open, and nothing was written through it.
   */
  #reopenEditor(overtaken: OvertakenSet, confirms: boolean): boolean {
    const hot = this.#hot;
    const editor = overtaken.editor!;
    const row = this.#findRecord(overtaken, editor.change);
    const col = hot.propToCol(editor.change[1] as string | number);

    if (row === null || col === null || col < 0 || !this.#takesEditor(row, col)) {
      return false;
    }

    const editorManager = hot._getEditorManager();

    hot.selectCell(row, col);
    editorManager.prepareEditor();

    const activeEditor = hot.getActiveEditor();

    if (activeEditor?.row === row && activeEditor.col === col) {
      editorManager.openEditor(editor.typedValue, undefined, true);
    }

    if (!activeEditor?.isOpened() || activeEditor.row !== row || activeEditor.col !== col) {
      this.#restoreHighlight(editor);

      return false;
    }

    if (confirms) {
      activeEditor.finishEditing();
    }

    return true;
  }

  /**
   * Puts the selection back on the cell it was on before the editor was to open again.
   *
   * @param {object} editor The editor that waited.
   */
  #restoreHighlight(editor: WaitingEditor): void {
    const { highlight } = editor;

    if (highlight?.row !== null && highlight?.row !== undefined && highlight.col !== null) {
      this.#hot.selectCell(highlight.row, highlight.col, highlight.row, highlight.col, false);
    }
  }

  /**
   * Tells whether a cell can take an editor before the selection moves there: it is shown, not read-only, and has
   * an editor.
   *
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @returns {boolean}
   */
  #takesEditor(row: number, col: number): boolean {
    const hot = this.#hot;

    if (hot.rowIndexMapper.getRenderableFromVisualIndex(row) === null
      || hot.columnIndexMapper.getRenderableFromVisualIndex(col) === null) {
      return false;
    }

    const cellMeta = hot.getCellMetaTransient(row, col);

    return cellMeta.readOnly !== true && Boolean(hot.getCellEditor(cellMeta));
  }

  /**
   * Writes the change the user confirmed in the editor without the editor, when it cannot open again.
   *
   * @param {object} overtaken The overtaken set.
   * @param {string} [source] The change source.
   */
  #writeEditorChange(overtaken: OvertakenSet, source: string | undefined): void {
    const { change } = overtaken.editor!;
    const row = this.#findRecord(overtaken, change);

    if (row !== null) {
      this.#hot.setDataAtRowProp(row, change[1] as string | number, change[3], source);
    }
  }

  /**
   * Tells whether the editor may open again: no editor is open, the grid still listens, nothing covers the grid
   * body (a dialog, the loading overlay), no other focus scope holds the keyboard, and the selection is still on
   * the cell it was on when the load closed the editor (the cell Enter moved it to, for an edit confirmed with
   * Enter). Otherwise the user moved on, and opening the editor would take the focus away from what they do now.
   *
   * @param {object} editor The editor that waited.
   * @returns {boolean}
   */
  #canReopenEditor(editor: WaitingEditor): boolean {
    const hot = this.#hot;

    if (hot._getEditorManager().isEditorOpened() || !hot.isListening()) {
      return false;
    }

    if (isRootInstance(hot)) {
      const scopeManager = hot.getFocusScopeManager();
      const activeScopeId = scopeManager.getActiveScopeId();

      if (scopeManager.isGridBodyCovered() || (activeScopeId !== null && activeScopeId !== 'grid')) {
        return false;
      }
    }

    const highlight = this.#readHighlight();

    return highlight !== null && editor.highlight !== null
      && highlight.row === editor.highlight.row && highlight.col === editor.highlight.col;
  }

  /**
   * Reads the cell the selection highlights, or `null` without a selection.
   *
   * @returns {object|null}
   */
  #readHighlight(): { row: number | null, col: number | null } | null {
    const highlight = this.#hot.getSelectedRangeActive()?.highlight;

    return highlight ? { row: highlight.row, col: highlight.col } : null;
  }

  /**
   * Finds the visual row of the record a change addressed, or `null` when the change stays dropped.
   *
   * @param {object} overtaken The overtaken set.
   * @param {Array} change The change.
   * @returns {number|null}
   */
  #findRecord(overtaken: OvertakenSet, change: CellChange): number | null {
    const rowId = overtaken.rowIds.get(change);

    if (rowId === null || rowId === undefined) {
      return null;
    }

    const laterWrite = this.#laterWrites.get(rowId)?.get(change[1]);

    if (laterWrite !== undefined && laterWrite > overtaken.sequence) {
      return null;
    }

    return this.#hot.getVisualRowById(rowId);
  }

  /**
   * Reads the editor that waits for its validator, if any. Only an editor whose value is text is kept: it is
   * opened again with that text, and a value of another kind (the multi-select editor's array) would not come back
   * from it, so such a change is written without the editor.
   *
   * @returns {object|null}
   */
  #readWaitingEditor(): {
    row: number,
    col: number,
    prop: unknown,
    typedValue: string,
    highlight: { row: number | null, col: number | null } | null,
  } | null {
    const activeEditor = this.#hot.getActiveEditor();

    if (!activeEditor?.isWaiting() || activeEditor.row === null || activeEditor.col === null) {
      return null;
    }

    const value = activeEditor.getValue();

    if (typeof value !== 'string') {
      return null;
    }

    return {
      row: activeEditor.row,
      col: activeEditor.col,
      prop: this.#hot.colToProp(activeEditor.col),
      typedValue: value,
      highlight: this.#readHighlight(),
    };
  }

  /**
   * Indexes a cell an overtaken set writes.
   *
   * @param {*} rowId The record's row id.
   * @param {*} prop The property.
   */
  #addOvertakenCell(rowId: unknown, prop: unknown): void {
    if (rowId === null || rowId === undefined) {
      return;
    }

    if (!this.#overtakenCells.has(rowId)) {
      this.#overtakenCells.set(rowId, new Set());
    }

    this.#overtakenCells.get(rowId)!.add(prop);
    this.#overtakenProps.add(prop);
  }

  /**
   * Forgets the cells of the overtaken sets and the later writes to them.
   */
  #clearCellIndex(): void {
    this.#overtakenCells.clear();
    this.#overtakenProps.clear();
    this.#laterWrites.clear();
  }

  /**
   * Reads the row id of a visual row, or `undefined` when it has none or the `rowId` function throws.
   *
   * @param {number} visualRow The visual row index.
   * @returns {*}
   */
  #readRowId(visualRow: number): unknown {
    return readRowIdOrUndefined(this.#hot, this.#getRowIdOption(), visualRow);
  }
}
