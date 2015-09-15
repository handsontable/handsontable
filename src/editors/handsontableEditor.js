
import {KEY_CODES} from './../helpers/unicode';
import {extend} from './../helpers/object';
import {setCaretPosition} from './../helpers/dom/element';
import {stopImmediatePropagation, isImmediatePropagationStopped} from './../helpers/dom/event';
import {getEditor, registerEditor} from './../editors';
import {TextEditor} from './textEditor';

var HandsontableEditor = TextEditor.prototype.extend();


/**
 * @private
 * @editor HandsontableEditor
 * @class HandsontableEditor
 * @dependencies TextEditor
 */
HandsontableEditor.prototype.createElements = function() {
  TextEditor.prototype.createElements.apply(this, arguments);

  var DIV = document.createElement('DIV');
  DIV.className = 'handsontableEditor';
  this.TEXTAREA_PARENT.appendChild(DIV);

  this.htContainer = DIV;
  this.assignHooks();
};

HandsontableEditor.prototype.prepare = function(td, row, col, prop, value, cellProperties) {

  TextEditor.prototype.prepare.apply(this, arguments);

  var parent = this;
  var options = {
    startRows: 0,
    startCols: 0,
    minRows: 0,
    minCols: 0,
    className: 'listbox',
    copyPaste: false,
    autoColumnSize: false,
    autoRowSize: false,
    readOnly: true,
    fillHandle: false,
    afterOnCellMouseDown: function() {
      var value = this.getValue();

      // if the value is undefined then it means we don't want to set the value
      if (value !== void 0) {
        parent.setValue(value);
      }
      parent.instance.destroyEditor();
    }
  };

  if (this.cellProperties.handsontable) {
    extend(options, cellProperties.handsontable);
  }
  this.htOptions = options;
};

var onBeforeKeyDown = function(event) {
  if (isImmediatePropagationStopped(event)) {
    return;
  }
  var editor = this.getActiveEditor();

  var innerHOT = editor.htEditor.getInstance(); //Handsontable.tmpHandsontable(editor.htContainer, 'getInstance');

  var rowToSelect;

  if (event.keyCode == KEY_CODES.ARROW_DOWN) {
    if (!innerHOT.getSelected()) {
      rowToSelect = 0;
    } else {
      var selectedRow = innerHOT.getSelected()[0];
      var lastRow = innerHOT.countRows() - 1;
      rowToSelect = Math.min(lastRow, selectedRow + 1);
    }
  } else if (event.keyCode == KEY_CODES.ARROW_UP) {
    if (innerHOT.getSelected()) {
      var selectedRow = innerHOT.getSelected()[0];
      rowToSelect = selectedRow - 1;
    }
  }

  if (rowToSelect !== void 0) {
    if (rowToSelect < 0) {
      innerHOT.deselectCell();
    } else {
      innerHOT.selectCell(rowToSelect, 0);
    }
    if (innerHOT.getData().length) {
      event.preventDefault();
      stopImmediatePropagation(event);

      editor.instance.listen();
      editor.TEXTAREA.focus();
    }
  }
};

HandsontableEditor.prototype.open = function() {

  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

  TextEditor.prototype.open.apply(this, arguments);

  if (this.htEditor) {
    this.htEditor.destroy();
  }
  this.htEditor = new Handsontable(this.htContainer, this.htOptions);

  if (this.cellProperties.strict) {
    this.htEditor.selectCell(0, 0);
    this.TEXTAREA.style.visibility = 'hidden';
  } else {
    this.htEditor.deselectCell();
    this.TEXTAREA.style.visibility = 'visible';
  }

  setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);
};

HandsontableEditor.prototype.close = function() {
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  this.instance.listen();

  TextEditor.prototype.close.apply(this, arguments);
};

HandsontableEditor.prototype.focus = function() {
  this.instance.listen();
  TextEditor.prototype.focus.apply(this, arguments);
};

HandsontableEditor.prototype.beginEditing = function(initialValue) {
  var onBeginEditing = this.instance.getSettings().onBeginEditing;

  if (onBeginEditing && onBeginEditing() === false) {
    return;
  }
  TextEditor.prototype.beginEditing.apply(this, arguments);
};

HandsontableEditor.prototype.finishEditing = function(isCancelled, ctrlDown) {
  if (this.htEditor && this.htEditor.isListening()) { //if focus is still in the HOT editor

    //if (Handsontable.tmpHandsontable(this.htContainer,'isListening')) { //if focus is still in the HOT editor
    //if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
    this.instance.listen(); //return the focus to the parent HOT instance
  }

  if (this.htEditor && this.htEditor.getSelected()) {
    //if (Handsontable.tmpHandsontable(this.htContainer,'getSelected')) {
    //if (this.$htContainer.handsontable('getSelected')) {
    //  var value = this.$htContainer.handsontable('getInstance').getValue();
    var value = this.htEditor.getInstance().getValue();
    //var value = Handsontable.tmpHandsontable(this.htContainer,'getInstance').getValue();
    if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
      this.setValue(value);
    }
  }

  return TextEditor.prototype.finishEditing.apply(this, arguments);
};

HandsontableEditor.prototype.assignHooks = function() {
  var _this = this;

  this.instance.addHook('afterDestroy', function() {
    if (_this.htEditor) {
      _this.htEditor.destroy();
    }
  });
};

export {HandsontableEditor};

registerEditor('handsontable', HandsontableEditor);
