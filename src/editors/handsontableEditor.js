/**
 * This is inception. Using Handsontable as Handsontable editor
 */

import * as helper from './../helpers.js';
import * as dom from './../dom.js';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';

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
  this.htEditor = new Handsontable(DIV, {
    autoColumnSize: false,
    autoRowSize: false
  });

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
    cells: function() {
      return {
        readOnly: true
      };
    },
    fillHandle: false,
    afterOnCellMouseDown: function() {
      var value = this.getValue();
      if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
        parent.setValue(value);
      }
      parent.instance.destroyEditor();
    }
  };

  if (this.cellProperties.handsontable) {
    helper.extend(options, cellProperties.handsontable);
  }
  if (this.htEditor) {
    this.htEditor.destroy();
  }

  this.htEditor = new Handsontable(this.htContainer, options);

  //this.$htContainer.handsontable('destroy');
  //this.$htContainer.handsontable(options);
};

var onBeforeKeyDown = function(event) {

  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function() {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function() {
      return !this.isImmediatePropagationEnabled;
    };
  }

  if (event.isImmediatePropagationStopped()) {
    return;
  }

  var editor = this.getActiveEditor();

  var innerHOT = editor.htEditor.getInstance(); //Handsontable.tmpHandsontable(editor.htContainer, 'getInstance');

  var rowToSelect;

  if (event.keyCode == helper.keyCode.ARROW_DOWN) {
    if (!innerHOT.getSelected()) {
      rowToSelect = 0;
    } else {
      var selectedRow = innerHOT.getSelected()[0];
      var lastRow = innerHOT.countRows() - 1;
      rowToSelect = Math.min(lastRow, selectedRow + 1);
    }
  } else if (event.keyCode == helper.keyCode.ARROW_UP) {
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

    event.preventDefault();
    event.stopImmediatePropagation();

    editor.instance.listen();
    editor.TEXTAREA.focus();
  }
};

HandsontableEditor.prototype.open = function() {

  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

  TextEditor.prototype.open.apply(this, arguments);

  this.htEditor.render();

  if (this.cellProperties.strict) {
    this.htEditor.selectCell(0, 0);
    this.TEXTAREA.style.visibility = 'hidden';
  } else {
    this.htEditor.deselectCell();
    this.TEXTAREA.style.visibility = 'visible';
  }

  dom.setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);

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
  if (this.htEditor.isListening()) { //if focus is still in the HOT editor

    //if (Handsontable.tmpHandsontable(this.htContainer,'isListening')) { //if focus is still in the HOT editor
    //if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
    this.instance.listen(); //return the focus to the parent HOT instance
  }

  if (this.htEditor.getSelected()) {
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
