'use strict';

exports.__esModule = true;

var _unicode = require('./../helpers/unicode');

var _object = require('./../helpers/object');

var _element = require('./../helpers/dom/element');

var _event = require('./../helpers/dom/event');

var _textEditor = require('./textEditor');

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HandsontableEditor = _textEditor2.default.prototype.extend();

/**
 * @private
 * @editor HandsontableEditor
 * @class HandsontableEditor
 * @dependencies TextEditor
 */
HandsontableEditor.prototype.createElements = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  _textEditor2.default.prototype.createElements.apply(this, args);

  var DIV = document.createElement('DIV');
  DIV.className = 'handsontableEditor';
  this.TEXTAREA_PARENT.appendChild(DIV);

  this.htContainer = DIV;
  this.assignHooks();
};

HandsontableEditor.prototype.prepare = function (td, row, col, prop, value, cellProperties) {
  for (var _len2 = arguments.length, args = Array(_len2 > 6 ? _len2 - 6 : 0), _key2 = 6; _key2 < _len2; _key2++) {
    args[_key2 - 6] = arguments[_key2];
  }

  _textEditor2.default.prototype.prepare.apply(this, [td, row, col, prop, value, cellProperties].concat(args));

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
    autoWrapCol: false,
    autoWrapRow: false,
    afterOnCellMouseDown: function afterOnCellMouseDown(_, coords) {
      var sourceValue = this.getSourceData(coords.row, coords.col);

      // if the value is undefined then it means we don't want to set the value
      if (sourceValue !== void 0) {
        parent.setValue(sourceValue);
      }
      parent.instance.destroyEditor();
    }
  };

  if (this.cellProperties.handsontable) {
    (0, _object.extend)(options, cellProperties.handsontable);
  }
  this.htOptions = options;
};

var onBeforeKeyDown = function onBeforeKeyDown(event) {
  if ((0, _event.isImmediatePropagationStopped)(event)) {
    return;
  }
  var editor = this.getActiveEditor();

  var innerHOT = editor.htEditor.getInstance();

  var rowToSelect = void 0;
  var selectedRow = void 0;

  if (event.keyCode === _unicode.KEY_CODES.ARROW_DOWN) {
    if (!innerHOT.getSelectedLast() && !innerHOT.flipped) {
      rowToSelect = 0;
    } else if (innerHOT.getSelectedLast()) {
      if (innerHOT.flipped) {
        rowToSelect = innerHOT.getSelectedLast()[0] + 1;
      } else if (!innerHOT.flipped) {
        var lastRow = innerHOT.countRows() - 1;
        selectedRow = innerHOT.getSelectedLast()[0];
        rowToSelect = Math.min(lastRow, selectedRow + 1);
      }
    }
  } else if (event.keyCode === _unicode.KEY_CODES.ARROW_UP) {
    if (!innerHOT.getSelectedLast() && innerHOT.flipped) {
      rowToSelect = innerHOT.countRows() - 1;
    } else if (innerHOT.getSelectedLast()) {
      if (innerHOT.flipped) {
        selectedRow = innerHOT.getSelectedLast()[0];
        rowToSelect = Math.max(0, selectedRow - 1);
      } else {
        selectedRow = innerHOT.getSelectedLast()[0];
        rowToSelect = selectedRow - 1;
      }
    }
  }

  if (rowToSelect !== void 0) {
    if (rowToSelect < 0 || innerHOT.flipped && rowToSelect > innerHOT.countRows() - 1) {
      innerHOT.deselectCell();
    } else {
      innerHOT.selectCell(rowToSelect, 0);
    }
    if (innerHOT.getData().length) {
      event.preventDefault();
      (0, _event.stopImmediatePropagation)(event);

      editor.instance.listen();
      editor.TEXTAREA.focus();
    }
  }
};

HandsontableEditor.prototype.open = function () {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  _textEditor2.default.prototype.open.apply(this, args);

  if (this.htEditor) {
    this.htEditor.destroy();
  }

  if (this.htContainer.style.display === 'none') {
    this.htContainer.style.display = '';
  }

  // Construct and initialise a new Handsontable
  this.htEditor = new this.instance.constructor(this.htContainer, this.htOptions);
  this.htEditor.init();
  this.htEditor.rootElement.style.display = '';

  if (this.cellProperties.strict) {
    this.htEditor.selectCell(0, 0);
  } else {
    this.htEditor.deselectCell();
  }

  (0, _element.setCaretPosition)(this.TEXTAREA, 0, this.TEXTAREA.value.length);
};

HandsontableEditor.prototype.close = function () {
  this.htEditor.rootElement.style.display = 'none';
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);

  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  _textEditor2.default.prototype.close.apply(this, args);
};

HandsontableEditor.prototype.focus = function () {
  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  _textEditor2.default.prototype.focus.apply(this, args);
};

HandsontableEditor.prototype.beginEditing = function () {
  var onBeginEditing = this.instance.getSettings().onBeginEditing;

  if (onBeginEditing && onBeginEditing() === false) {
    return;
  }

  for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    args[_key6] = arguments[_key6];
  }

  _textEditor2.default.prototype.beginEditing.apply(this, args);
};

HandsontableEditor.prototype.finishEditing = function () {
  if (this.htEditor && this.htEditor.isListening()) {
    // if focus is still in the HOT editor
    this.instance.listen(); // return the focus to the parent HOT instance
  }

  if (this.htEditor && this.htEditor.getSelectedLast()) {
    var value = this.htEditor.getInstance().getValue();

    if (value !== void 0) {
      // if the value is undefined then it means we don't want to set the value
      this.setValue(value);
    }
  }

  for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
    args[_key7] = arguments[_key7];
  }

  return _textEditor2.default.prototype.finishEditing.apply(this, args);
};

HandsontableEditor.prototype.assignHooks = function () {
  var _this = this;

  this.instance.addHook('afterDestroy', function () {
    if (_this.htEditor) {
      _this.htEditor.destroy();
    }
  });
};

exports.default = HandsontableEditor;