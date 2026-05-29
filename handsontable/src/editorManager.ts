import type { HotInstance } from './core/types';
import type { GridSettings } from './core/settings';
import type { default as SelectionManager } from './selection/selection';
import { isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import type { BaseEditor } from './editors/baseEditor';
import EventManager from './eventManager';

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
  declare cellProperties: Record<string, unknown>;

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
    const modifiedCellCoords = this.hot.runHooks('modifyGetCellCoords', row, col, false, 'meta');
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

    const {
      rowIndexMapper,
      columnIndexMapper
    } = this.hot;
    const isCellHidden = rowIndexMapper.isHidden(this.hot.toPhysicalRow(row)) ||
      columnIndexMapper.isHidden(this.hot.toPhysicalColumn(col));

    if (this.cellProperties.readOnly || !editorClass || isCellHidden) {
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

const instances = new WeakMap();

/**
 * @param {Core} hotInstance The Handsontable instance.
 * @param {TableMeta} tableMeta The table meta class instance.
 * @param {Selection} selection The selection instance.
 * @returns {EditorManager}
 */
(EditorManager as unknown as Record<string, Function>).getInstance = function(
  hotInstance: HotInstance, tableMeta: GridSettings, selection: SelectionManager
) {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, tableMeta, selection);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
