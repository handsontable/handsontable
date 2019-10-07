import { CellCoords } from './../3rdparty/walkontable/src';
import { stringify } from './../helpers/mixed';
import { mixin } from './../helpers/object';
import hooksRefRegisterer from './../mixins/hooksRefRegisterer';

export const EditorState = {
  VIRGIN: 'STATE_VIRGIN', // before editing
  EDITING: 'STATE_EDITING',
  WAITING: 'STATE_WAITING', // waiting for async validation
  FINISHED: 'STATE_FINISHED'
};

/**
 * @util
 * @class BaseEditor
 */
class BaseEditor {
  constructor(instance) {
    /**
     * A reference to the source instance of the Handsontable.
     *
     * @type {Handsontable}
     */
    this.hot = instance;
    /**
     * A reference to the source instance of the Handsontable.
     * @deprecated
     *
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * Editor's state.
     *
     * @type {String}
     */
    this.state = EditorState.VIRGIN;
    /**
     * Flag to store information about editor's opening status.
     * @private
     *
     * @type {Boolean}
     */
    this._opened = false;
    /**
     * Defines the editor's editing mode. When false, then an editor works in fast editing mode.
     * @private
     *
     * @type {Boolean}
     */
    this._fullEditMode = false;
    /**
     * Callback to call after closing editor.
     *
     * @type {Function}
     */
    this._closeCallback = null;
    /**
     * Currently rendered cell's TD element.
     *
     * @type {HTMLTableCellElement}
     */
    this.TD = null;
    /**
     * Visual row index.
     *
     * @type {Number}
     */
    this.row = null;
    /**
     * Visual column index.
     *
     * @type {Number}
     */
    this.col = null;
    /**
     * Column property name or a column index, if datasource is an array of arrays.
     *
     * @type {Number|String}
     */
    this.prop = null;
    /**
     * Original cell's value.
     *
     * @type {*}
     */
    this.originalValue = null;
    /**
     * Object containing the cell's properties.
     *
     * @type {Object}
     */
    this.cellProperties = null;

    this.init();
  }

  /**
   * Fires callback after closing editor.
   *
   * @private
   * @param {Boolean} result
   */
  _fireCallbacks(result) {
    if (this._closeCallback) {
      this._closeCallback(result);
      this._closeCallback = null;
    }
  }

  /**
   * Initializes an editor's intance.
   */
  init() {}

  /**
   * Required method to get current value from editable element.
   */
  getValue() {
    throw Error('Editor getValue() method unimplemented');
  }

  /**
   * Required method to set new value into editable element.
   */
  setValue() {
    throw Error('Editor setValue() method unimplemented');
  }

  /**
   * Required method to open editor.
   */
  open() {
    throw Error('Editor open() method unimplemented');
  }

  /**
   * Required method to close editor.
   */
  close() {
    throw Error('Editor close() method unimplemented');
  }

  /**
   * Prepares editor's meta data.
   *
   * @param {Number} row
   * @param {Number} col
   * @param {Number|String} prop
   * @param {HTMLTableCellElement} td
   * @param {*} originalValue
   * @param {Object} cellProperties
   */
  prepare(row, col, prop, td, originalValue, cellProperties) {
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;
    this.state = EditorState.VIRGIN;
  }

  /**
   * Fallback method to provide extendable editors in ES5.
   */
  extend() {
    return (class Editor extends this.constructor {});
  }

  /**
   * Saves value from editor into data storage.
   *
   * @param {*} value
   * @param {Boolean} ctrlDown If true, applies value to each cell in the last selected range.
   */
  saveValue(value, ctrlDown) {
    let selection;
    let tmp;

    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      selection = this.hot.getSelectedLast();

      if (selection[0] > selection[2]) {
        tmp = selection[0];
        selection[0] = selection[2];
        selection[2] = tmp;
      }
      if (selection[1] > selection[3]) {
        tmp = selection[1];
        selection[1] = selection[3];
        selection[3] = tmp;
      }
    } else {
      selection = [this.row, this.col, null, null];
    }

    this.hot.populateFromArray(selection[0], selection[1], value, selection[2], selection[3], 'edit');
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue
   * @param {*} event
   */
  beginEditing(newInitialValue, event) {
    if (this.state !== EditorState.VIRGIN) {
      return;
    }
    this.hot.view.scrollViewport(new CellCoords(this.row, this.col));
    this.state = EditorState.EDITING;

    // Set the editor value only in the full edit mode. In other mode the focusable element has to be empty,
    // otherwise IME (editor for Asia users) doesn't work.
    if (this.isInFullEditMode()) {
      const stringifiedInitialValue = typeof newInitialValue === 'string' ? newInitialValue : stringify(this.originalValue);

      this.setValue(stringifiedInitialValue);
    }

    this.open(event);
    this._opened = true;
    this.focus();

    // only rerender the selections (FillHandle should disappear when beginediting is triggered)
    this.hot.view.render();

    this.hot.runHooks('afterBeginEditing', this.row, this.col);
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {Boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {Boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback
   */
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    let val;

    if (callback) {
      const previousCloseCallback = this._closeCallback;

      this._closeCallback = (result) => {
        if (previousCloseCallback) {
          previousCloseCallback(result);
        }

        callback(result);
        this.hot.view.render();
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state === EditorState.VIRGIN) {
      this.hot._registerTimeout(() => {
        this._fireCallbacks(true);
      });

      return;
    }

    if (this.state === EditorState.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.hot.view.render();

        return;
      }

      const value = this.getValue();

      if (this.hot.getSettings().trimWhitespace) {
        // We trim only string values
        val = [
          [typeof value === 'string' ? String.prototype.trim.call(value || '') : value]
        ];
      } else {
        val = [
          [value]
        ];
      }

      this.state = EditorState.WAITING;
      this.saveValue(val, ctrlDown);

      if (this.hot.getCellValidator(this.cellProperties)) {
        this.hot.addHookOnce('postAfterValidate', (result) => {
          this.state = EditorState.FINISHED;
          this.discardEditor(result);
        });
      } else {
        this.state = EditorState.FINISHED;
        this.discardEditor(true);
      }
    }
  }

  /**
   * Finishes editing without singout saving value.
   */
  cancelChanges() {
    this.state = EditorState.FINISHED;
    this.discardEditor();
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {Boolean|undefined} result
   */
  discardEditor(result) {
    if (this.state !== EditorState.FINISHED) {
      return;
    }

    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
      this.hot.selectCell(this.row, this.col);
      this.focus();
      this.state = EditorState.EDITING;
      this._fireCallbacks(false);

    } else {
      this.close();
      this._opened = false;
      this._fullEditMode = false;
      this.state = EditorState.VIRGIN;
      this._fireCallbacks(true);
    }
  }

  /**
   * Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
   * automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.
   */
  enableFullEditMode() {
    this._fullEditMode = true;
  }

  /**
   * Checks if editor is in full edit mode.
   *
   * @returns {Boolean}
   */
  isInFullEditMode() {
    return this._fullEditMode;
  }

  /**
   * Returns information whether the editor is open.
   */
  isOpened() {
    return this._opened;
  }

  /**
   * Returns information whether the editor is waiting, eg.: for async validation.
   */
  isWaiting() {
    return this.state === EditorState.WAITING;
  }

  /**
   * Gets className of the edited cell if exist.
   *
   * @returns {string}
   */
  getEditedCellsLayerClass() {
    const editorSection = this.checkEditorSection();

    switch (editorSection) {
      case 'right':
        return 'ht_clone_right';
      case 'left':
        return 'ht_clone_left';
      case 'bottom':
        return 'ht_clone_bottom';
      case 'bottom-right-corner':
        return 'ht_clone_bottom_right_corner';
      case 'bottom-left-corner':
        return 'ht_clone_bottom_left_corner';
      case 'top':
        return 'ht_clone_top';
      case 'top-right-corner':
        return 'ht_clone_top_right_corner';
      case 'top-left-corner':
        return 'ht_clone_top_left_corner';
      default:
        return 'ht_clone_master';
    }
  }

  /**
   * Gets HTMLTableCellElement of the edited cell if exist.
   *
   * @returns {HTMLTableCellElement|null}
   */
  getEditedCell() {
    return this.hot.getCell(this.row, this.col, true);
  }

  /**
   * Returns name of the overlay, where editor is placed.
   *
   * @private
   */
  checkEditorSection() {
    const totalRows = this.hot.countRows();
    let section = '';

    if (this.row < this.hot.getSettings().fixedRowsTop) {
      if (this.col < this.hot.getSettings().fixedColumnsLeft) {
        section = 'top-left-corner';
      } else {
        section = 'top';
      }
    } else if (this.hot.getSettings().fixedRowsBottom && this.row >= totalRows - this.hot.getSettings().fixedRowsBottom) {
      if (this.col < this.hot.getSettings().fixedColumnsLeft) {
        section = 'bottom-left-corner';
      } else {
        section = 'bottom';
      }
    } else if (this.col < this.hot.getSettings().fixedColumnsLeft) {
      section = 'left';
    }

    return section;
  }
}

mixin(BaseEditor, hooksRefRegisterer);

export default BaseEditor;
