import { isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import EventManager from './eventManager';
import { isDefined } from './helpers/mixed';

export const SHORTCUTS_GROUP_NAVIGATION = 'editorManager.navigation';

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
   * Determines if EditorManager is locked.
   *
   * @private
   * @type {boolean}
   */
  lock = false;
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
   * Lock the editor from being prepared and closed. Locking the editor prevents its closing and
   * reinitialized after selecting the new cell. This feature is necessary for a mobile editor.
   */
  lockEditor() {
    this.lock = true;
  }

  /**
   * Unlock the editor from being prepared and closed. This method restores the original behavior of
   * the editors where for every new selection its instances are closed.
   */
  unlockEditor() {
    this.lock = false;
  }

  /**
   * Destroy current editor, if exists.
   *
   * @param {boolean} revertOriginal If `false` and the cell using allowInvalid option,
   *                                 then an editor won't be closed until validation is passed.
   */
  destroyEditor(revertOriginal) {
    if (!this.lock) {
      this.closeEditor(revertOriginal);
    }
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
    if (this.lock) {
      return;
    }

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
    const modifiedCellCoords = this.hot.runHooks('modifyGetCellCoords', row, col);
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
   * Controls selection's behaviour after clicking `Enter`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will move up after hit enter.
   */
  moveSelectionAfterEnter(isShiftPressed) {
    const enterMoves = typeof this.tableMeta.enterMoves === 'function' ?
      this.tableMeta.enterMoves(event) : this.tableMeta.enterMoves;

    if (isShiftPressed) {
      // move selection up
      this.selection.transformStart(-enterMoves.row, -enterMoves.col);
    } else {
      // move selection down (add a new row if needed)
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
        const shortcutManager = this.hot.getShortcutManager();
        const editorContext = shortcutManager.getContext('editor');
        const runOnlySelectedConfig = {
          runOnlyIf: () => isDefined(this.hot.getSelected()),
          group: SHORTCUTS_GROUP_NAVIGATION
        };

        editorContext.addShortcuts([{
          keys: [['ArrowUp']],
          callback: () => {
            this.hot.selection.transformStart(-1, 0);
          },
        }, {
          keys: [['ArrowDown']],
          callback: () => {
            this.hot.selection.transformStart(1, 0);
          },
        }, {
          keys: [['ArrowLeft']],
          callback: () => {
            this.hot.selection.transformStart(0, -1 * this.hot.getDirectionFactor());
          },
        }, {
          keys: [['ArrowRight']],
          callback: () => {
            this.hot.selection.transformStart(0, this.hot.getDirectionFactor());
          },
        }], runOnlySelectedConfig);

        this.openEditor('', event);
      }
    }
  }

  /**
   * OnCellDblClick callback.
   *
   * @param {MouseEvent} event The mouse event object.
   * @param {object} coords The cell coordinates.
   * @param {HTMLTableCellElement|HTMLTableHeaderCellElement} elem The element which triggers the action.
   */
  #onCellDblClick(event, coords, elem) {
    // may be TD or TH
    if (elem.nodeName === 'TD') {
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
