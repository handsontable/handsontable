import { isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import EventManager from './eventManager';

class EditorManager {
  /**
   * Instance of {@link Handsontable}.
   *
   * @private
   * @type {Handsontable}
   */
  hot;
  /**
   * Reference to an instance's private GridSettings object.
   *
   * @private
   * @type {GridSettings}
   */
  tableMeta;
  /**
   * Instance of {@link Selection}.
   *
   * @private
   * @type {Selection}
   */
  selection;
  /**
   * Instance of {@link EventManager}.
   *
   * @private
   * @type {EventManager}
   */
  eventManager;
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
  activeEditor;
  /**
   * Keeps a reference to the cell's properties object.
   *
   * @type {object}
   */
  cellProperties;

  /**
   * @param {Core} hotInstance The Handsontable instance.
   * @param {TableMeta} tableMeta The table meta instance.
   * @param {Selection} selection The selection instance.
   */
  constructor(hotInstance, tableMeta, selection) {
    this.hot = hotInstance;
    this.tableMeta = tableMeta;
    this.selection = selection;
    this.eventManager = new EventManager(hotInstance);

    this.hot.addHook('afterDocumentKeyDown', event => this.#onAfterDocumentKeyDown(event));

    // Open editor when text composition is started (IME editor)
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'compositionstart', (event) => {
      if (!this.destroyed && this.hot.isListening()) {
        this.openEditor('', event);
      }
    });

    this.hot.view._wt.update('onCellDblClick', (event, coords, elem) => this.#onCellDblClick(event, coords, elem));
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
      this.closeEditor(false, false, (dataSaved) => {
        if (dataSaved) {
          this.prepareEditor();
        }
      });

      return;
    }

    const highlight = this.hot.getSelectedRangeLast()?.highlight;

    if (!highlight || highlight.isHeader()) {
      return;
    }

    const { row, col } = highlight;
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

      this.activeEditor = getEditorInstance(editorClass, this.hot);
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
  openEditor(newInitialValue, event, enableFullEditMode = false) {
    if (!this.isCellEditable()) {
      this.clearActiveEditor();

      return;
    }

    const selection = this.hot.getSelectedRangeLast();
    let allowOpening = this.hot.runHooks(
      'beforeBeginEditing',
      selection.highlight.row,
      selection.highlight.col,
      newInitialValue,
      event,
      enableFullEditMode,
    );

    // If the above hook does not return boolean then the default behavior is applied which disallows opening
    // an editor after double mouse click for non-contiguous selection (while pressing Ctrl/Cmd) and
    // for multiple selected cells (while pressing SHIFT).
    if (event instanceof MouseEvent && typeof allowOpening !== 'boolean') {
      allowOpening = this.hot.selection.getLayerLevel() === 0 && selection.isSingle();
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
  closeEditor(restoreOriginalValue, isCtrlPressed, callback) {
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
  closeEditorAndSaveChanges(isCtrlPressed) {
    this.closeEditor(false, isCtrlPressed);
  }

  /**
   * Close editor and restore original value.
   *
   * @param {boolean} isCtrlPressed Indication of whether the CTRL button is pressed.
   */
  closeEditorAndRestoreOriginalValue(isCtrlPressed) {
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
    const selection = this.hot.getSelectedRangeLast();

    if (!selection) {
      return false;
    }

    const editorClass = this.hot.getCellEditor(this.cellProperties);
    const { row, col } = selection.highlight;
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
  moveSelectionAfterEnter(event) {
    const enterMoves = { ...typeof this.tableMeta.enterMoves === 'function' ?
      this.tableMeta.enterMoves(event) : this.tableMeta.enterMoves };

    if (event.shiftKey) {
      enterMoves.row = -enterMoves.row;
      enterMoves.col = -enterMoves.col;
    }

    if (this.hot.selection.isMultiple()) {
      this.selection.transformFocus(enterMoves.row, enterMoves.col);
    } else {
      this.selection.transformStart(enterMoves.row, enterMoves.col, true);
    }
  }

  /**
   * OnAfterDocumentKeyDown callback.
   *
   * @param {KeyboardEvent} event The keyboard event object.
   */
  #onAfterDocumentKeyDown(event) {
    const selection = this.hot.getSelectedRangeLast();

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
  #onCellDblClick(event, coords) {
    if (coords.isCell()) {
      this.openEditor(null, event, true);
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
EditorManager.getInstance = function(hotInstance, tableMeta, selection) {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, tableMeta, selection);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
