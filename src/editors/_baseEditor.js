import { CellCoords } from './../3rdparty/walkontable/src';
import { stringify } from './../helpers/mixed';

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
export default class BaseEditor {
  constructor(instance) {
    this.instance = instance;
    this.state = EditorState.VIRGIN;

    this._opened = false;
    this._fullEditMode = false;
    this._closeCallback = null;

    this.init();
  }

  _fireCallbacks(result) {
    if (this._closeCallback) {
      this._closeCallback(result);
      this._closeCallback = null;
    }
  }

  init() {}

  getValue() {
    throw Error('Editor getValue() method unimplemented');
  }

  setValue() {
    throw Error('Editor setValue() method unimplemented');
  }

  open() {
    throw Error('Editor open() method unimplemented');
  }

  close() {
    throw Error('Editor close() method unimplemented');
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;
    this.state = EditorState.VIRGIN;
  }

  extend() {
    return class Editor extends BaseEditor { };
  }

  saveValue(value, ctrlDown) {
    let selection;
    let tmp;

    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      selection = this.instance.getSelectedLast();

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

    this.instance.populateFromArray(selection[0], selection[1], value, selection[2], selection[3], 'edit');
  }

  beginEditing(newInitialValue, event) {
    if (this.state !== EditorState.VIRGIN) {
      return;
    }
    this.instance.view.scrollViewport(new CellCoords(this.row, this.col));
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
    this.instance.view.render();

    this.instance.runHooks('afterBeginEditing', this.row, this.col);
  }

  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    let val;

    if (callback) {
      const previousCloseCallback = this._closeCallback;

      this._closeCallback = (result) => {
        if (previousCloseCallback) {
          previousCloseCallback(result);
        }

        callback(result);
        this.instance.view.render();
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state === EditorState.VIRGIN) {
      this.instance._registerTimeout(() => {
        this._fireCallbacks(true);
      });

      return;
    }

    if (this.state === EditorState.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.instance.view.render();

        return;
      }

      const value = this.getValue();

      if (this.instance.getSettings().trimWhitespace) {
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

      if (this.instance.getCellValidator(this.cellProperties)) {
        this.instance.addHookOnce('postAfterValidate', (result) => {
          this.state = EditorState.FINISHED;
          this.discardEditor(result);
        });
      } else {
        this.state = EditorState.FINISHED;
        this.discardEditor(true);
      }
    }
  }

  cancelChanges() {
    this.state = EditorState.FINISHED;
    this.discardEditor();
  }

  discardEditor(result) {
    if (this.state !== EditorState.FINISHED) {
      return;
    }

    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
      this.instance.selectCell(this.row, this.col);
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

  isOpened() {
    return this._opened;
  }

  isWaiting() {
    return this.state === EditorState.WAITING;
  }

  checkEditorSection() {
    const totalRows = this.instance.countRows();
    let section = '';

    if (this.row < this.instance.getSettings().fixedRowsTop) {
      if (this.col < this.instance.getSettings().fixedColumnsLeft) {
        section = 'top-left-corner';
      } else {
        section = 'top';
      }
    } else if (this.instance.getSettings().fixedRowsBottom && this.row >= totalRows - this.instance.getSettings().fixedRowsBottom) {
      if (this.col < this.instance.getSettings().fixedColumnsLeft) {
        section = 'bottom-left-corner';
      } else {
        section = 'bottom';
      }
    } else if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      section = 'left';
    }

    return section;
  }
}
