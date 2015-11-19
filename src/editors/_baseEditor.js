
import {stringify} from './../helpers/mixed';
import {WalkontableCellCoords} from './../3rdparty/walkontable/src/cell/coords';

export {BaseEditor};

Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.BaseEditor = BaseEditor;

Handsontable.EditorState = {
  VIRGIN: 'STATE_VIRGIN', //before editing
  EDITING: 'STATE_EDITING',
  WAITING: 'STATE_WAITING', //waiting for async validation
  FINISHED: 'STATE_FINISHED'
};

function BaseEditor(instance) {
  this.instance = instance;
  this.state = Handsontable.EditorState.VIRGIN;

  this._opened = false;
  this._fullEditMode = false;
  this._closeCallback = null;

  this.init();
}

BaseEditor.prototype._fireCallbacks = function(result) {
  if (this._closeCallback) {
    this._closeCallback(result);
    this._closeCallback = null;
  }
};

BaseEditor.prototype.init = function() {};

BaseEditor.prototype.getValue = function() {
  throw Error('Editor getValue() method unimplemented');
};

BaseEditor.prototype.setValue = function(newValue) {
  throw Error('Editor setValue() method unimplemented');
};

BaseEditor.prototype.open = function() {
  throw Error('Editor open() method unimplemented');
};

BaseEditor.prototype.close = function() {
  throw Error('Editor close() method unimplemented');
};

BaseEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties) {
  this.TD = td;
  this.row = row;
  this.col = col;
  this.prop = prop;
  this.originalValue = originalValue;
  this.cellProperties = cellProperties;

  if (this.instance.view.isMouseDown() && document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  } else if (!document.activeElement) { //IE
    document.body.focus();
  }

  this.state = Handsontable.EditorState.VIRGIN;
};

BaseEditor.prototype.extend = function() {
  var baseClass = this.constructor;

  function Editor() {
    baseClass.apply(this, arguments);
  }

  function inherit(Child, Parent) {
    function Bridge() {}
    Bridge.prototype = Parent.prototype;
    Child.prototype = new Bridge();
    Child.prototype.constructor = Child;

    return Child;
  }

  return inherit(Editor, baseClass);
};

BaseEditor.prototype.saveValue = function(val, ctrlDown) {
  var sel, tmp;

  // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
  if (ctrlDown) {
    sel = this.instance.getSelected();

    if (sel[0] > sel[2]) {
      tmp = sel[0];
      sel[0] = sel[2];
      sel[2] = tmp;
    }
    if (sel[1] > sel[3]) {
      tmp = sel[1];
      sel[1] = sel[3];
      sel[3] = tmp;
    }

    this.instance.populateFromArray(sel[0], sel[1], val, sel[2], sel[3], 'edit');
  } else {
    this.instance.populateFromArray(this.row, this.col, val, null, null, 'edit');
  }
};

BaseEditor.prototype.beginEditing = function(initialValue, event) {
  if (this.state != Handsontable.EditorState.VIRGIN) {
    return;
  }
  this.instance.view.scrollViewport(new WalkontableCellCoords(this.row, this.col));
  this.instance.view.render();
  this.state = Handsontable.EditorState.EDITING;

  initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;
  this.setValue(stringify(initialValue));

  this.open(event);
  this._opened = true;
  this.focus();

  // only rerender the selections (FillHandle should disappear when beginediting is triggered)
  this.instance.view.render();
};

BaseEditor.prototype.finishEditing = function(restoreOriginalValue, ctrlDown, callback) {
  var _this = this,
    val;

  if (callback) {
    var previousCloseCallback = this._closeCallback;

    this._closeCallback = function(result) {
      if (previousCloseCallback) {
        previousCloseCallback(result);
      }
      callback(result);
    };
  }

  if (this.isWaiting()) {
    return;
  }

  if (this.state == Handsontable.EditorState.VIRGIN) {
    this.instance._registerTimeout(setTimeout(function() {
      _this._fireCallbacks(true);
    }, 0));

    return;
  }

  if (this.state == Handsontable.EditorState.EDITING) {
    if (restoreOriginalValue) {
      this.cancelChanges();
      this.instance.view.render();

      return;
    }

    if (this.instance.getSettings().trimWhitespace) {
      // String.prototype.trim is defined in Walkontable polyfill.js
      val = [
        // We trim only string values
        [typeof this.getValue() === 'string' ? String.prototype.trim.call(this.getValue() || '') : this.getValue()]];
    } else {
      val = [
        [this.getValue()]
      ];
    }

    this.state = Handsontable.EditorState.WAITING;
    this.saveValue(val, ctrlDown);

    if (this.instance.getCellValidator(this.cellProperties)) {
      this.instance.addHookOnce('postAfterValidate', function(result) {
        _this.state = Handsontable.EditorState.FINISHED;
        _this.discardEditor(result);
      });
    } else {
      this.state = Handsontable.EditorState.FINISHED;
      this.discardEditor(true);
    }
  }
};

BaseEditor.prototype.cancelChanges = function() {
  this.state = Handsontable.EditorState.FINISHED;
  this.discardEditor();
};

BaseEditor.prototype.discardEditor = function(result) {
  if (this.state !== Handsontable.EditorState.FINISHED) {
    return;
  }
  // validator was defined and failed
  if (result === false && this.cellProperties.allowInvalid !== true) {
    this.instance.selectCell(this.row, this.col);
    this.focus();
    this.state = Handsontable.EditorState.EDITING;
    this._fireCallbacks(false);

  } else {
    this.close();
    this._opened = false;
    this._fullEditMode = false;
    this.state = Handsontable.EditorState.VIRGIN;
    this._fireCallbacks(true);
  }
};

/**
 * Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
 * automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.
 */
BaseEditor.prototype.enableFullEditMode = function() {
  this._fullEditMode = true;
};

/**
 * Checks if editor is in full edit mode.
 *
 * @returns {Boolean}
 */
BaseEditor.prototype.isInFullEditMode = function() {
  return this._fullEditMode;
};

BaseEditor.prototype.isOpened = function() {
  return this._opened;
};

BaseEditor.prototype.isWaiting = function() {
  return this.state === Handsontable.EditorState.WAITING;
};

BaseEditor.prototype.checkEditorSection = function() {
  var totalRows = this.instance.countRows();
  var section = '';

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
  } else {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      section = 'left';
    }
  }

  return section;
};
