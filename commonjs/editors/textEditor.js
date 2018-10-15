'use strict';

exports.__esModule = true;

var _element = require('./../helpers/dom/element');

var _autoResize = require('./../../lib/autoResize/autoResize');

var _autoResize2 = _interopRequireDefault(_autoResize);

var _baseEditor = require('./_baseEditor');

var _baseEditor2 = _interopRequireDefault(_baseEditor);

var _eventManager = require('./../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _unicode = require('./../helpers/unicode');

var _event = require('./../helpers/dom/event');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TextEditor = _baseEditor2.default.prototype.extend();

/**
 * @private
 * @editor TextEditor
 * @class TextEditor
 * @dependencies autoResize
 */
TextEditor.prototype.init = function () {
  var that = this;
  this.createElements();
  this.eventManager = new _eventManager2.default(this);
  this.bindEvents();
  this.autoResize = (0, _autoResize2.default)();
  this.holderZIndex = -1;

  this.instance.addHook('afterDestroy', function () {
    that.destroy();
  });
};

TextEditor.prototype.prepare = function (row, col, prop, td, originalValue, cellProperties) {
  var _this = this;

  var previousState = this.state;

  for (var _len = arguments.length, args = Array(_len > 6 ? _len - 6 : 0), _key = 6; _key < _len; _key++) {
    args[_key - 6] = arguments[_key];
  }

  _baseEditor2.default.prototype.prepare.apply(this, [row, col, prop, td, originalValue, cellProperties].concat(args));

  if (!cellProperties.readOnly) {
    this.refreshDimensions(true);

    var allowInvalid = cellProperties.allowInvalid,
        fragmentSelection = cellProperties.fragmentSelection;


    if (allowInvalid) {
      this.TEXTAREA.value = ''; // Remove an empty space from texarea (added by copyPaste plugin to make copy/paste functionality work with IME)
    }

    if (previousState !== _baseEditor.EditorState.FINISHED) {
      this.hideEditableElement();
    }

    // @TODO: The fragmentSelection functionality is conflicted with IME. For this feature refocus has to
    // be disabled (to make IME working).
    var restoreFocus = !fragmentSelection;

    if (restoreFocus) {
      this.instance._registerImmediate(function () {
        return _this.focus();
      });
    }
  }
};

TextEditor.prototype.hideEditableElement = function () {
  this.textareaParentStyle.top = '-9999px';
  this.textareaParentStyle.left = '-9999px';
  this.textareaParentStyle.zIndex = '-1';
  this.textareaParentStyle.position = 'fixed';
};

TextEditor.prototype.showEditableElement = function () {
  this.textareaParentStyle.zIndex = this.holderZIndex >= 0 ? this.holderZIndex : '';
  this.textareaParentStyle.position = '';
};

TextEditor.prototype.getValue = function () {
  return this.TEXTAREA.value;
};

TextEditor.prototype.setValue = function (newValue) {
  this.TEXTAREA.value = newValue;
};

TextEditor.prototype.beginEditing = function () {
  if (this.state !== _baseEditor.EditorState.VIRGIN) {
    return;
  }

  this.TEXTAREA.value = ''; // Remove an empty space from texarea (added by copyPaste plugin to make copy/paste functionality work with IME).

  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  _baseEditor2.default.prototype.beginEditing.apply(this, args);
};

var onBeforeKeyDown = function onBeforeKeyDown(event) {
  var instance = this;
  var that = instance.getActiveEditor();

  // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  // Process only events that have been fired in the editor
  if (event.target !== that.TEXTAREA || (0, _event.isImmediatePropagationStopped)(event)) {
    return;
  }

  switch (event.keyCode) {
    case _unicode.KEY_CODES.ARROW_RIGHT:
      if (that.isInFullEditMode()) {
        if (!that.isWaiting() && !that.allowKeyEventPropagation || !that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode)) {
          (0, _event.stopImmediatePropagation)(event);
        }
      }
      break;

    case _unicode.KEY_CODES.ARROW_LEFT:
      if (that.isInFullEditMode()) {
        if (!that.isWaiting() && !that.allowKeyEventPropagation || !that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode)) {
          (0, _event.stopImmediatePropagation)(event);
        }
      }
      break;

    case _unicode.KEY_CODES.ARROW_UP:
    case _unicode.KEY_CODES.ARROW_DOWN:
      if (that.isInFullEditMode()) {
        if (!that.isWaiting() && !that.allowKeyEventPropagation || !that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode)) {
          (0, _event.stopImmediatePropagation)(event);
        }
      }
      break;

    case _unicode.KEY_CODES.ENTER:
      {
        var isMultipleSelection = this.selection.isMultiple();

        if (ctrlDown && !isMultipleSelection || event.altKey) {
          // if ctrl+enter or alt+enter, add new line
          if (that.isOpened()) {
            var caretPosition = (0, _element.getCaretPosition)(that.TEXTAREA);
            var value = that.getValue();
            var newValue = value.slice(0, caretPosition) + '\n' + value.slice(caretPosition);

            that.setValue(newValue);

            (0, _element.setCaretPosition)(that.TEXTAREA, caretPosition + 1);
          } else {
            that.beginEditing(that.originalValue + '\n');
          }
          (0, _event.stopImmediatePropagation)(event);
        }
        event.preventDefault(); // don't add newline to field
        break;
      }

    case _unicode.KEY_CODES.BACKSPACE:
    case _unicode.KEY_CODES.DELETE:
    case _unicode.KEY_CODES.HOME:
    case _unicode.KEY_CODES.END:
      (0, _event.stopImmediatePropagation)(event); // backspace, delete, home, end should only work locally when cell is edited (not in table context)
      break;

    default:
      break;
  }

  if ([_unicode.KEY_CODES.ARROW_UP, _unicode.KEY_CODES.ARROW_RIGHT, _unicode.KEY_CODES.ARROW_DOWN, _unicode.KEY_CODES.ARROW_LEFT].indexOf(event.keyCode) === -1) {
    that.autoResize.resize(String.fromCharCode(event.keyCode));
  }
};

TextEditor.prototype.open = function () {
  this.refreshDimensions(); // need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348
  this.showEditableElement();

  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.close = function () {
  this.autoResize.unObserve();

  if (document.activeElement === this.TEXTAREA) {
    this.instance.listen(); // don't refocus the table if user focused some cell outside of HT on purpose
  }

  this.hideEditableElement();
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.focus = function () {
  // For IME editor textarea element must be focused using ".select" method. Using ".focus" browser automatically scroll into
  // the focused element which is undesire effect.
  this.TEXTAREA.select();
  (0, _element.setCaretPosition)(this.TEXTAREA, this.TEXTAREA.value.length);
};

TextEditor.prototype.createElements = function () {
  this.TEXTAREA = document.createElement('TEXTAREA');
  this.TEXTAREA.tabIndex = -1;

  (0, _element.addClass)(this.TEXTAREA, 'handsontableInput');

  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;

  this.TEXTAREA_PARENT = document.createElement('DIV');
  (0, _element.addClass)(this.TEXTAREA_PARENT, 'handsontableInputHolder');

  this.textareaParentStyle = this.TEXTAREA_PARENT.style;
  this.textareaParentStyle.zIndex = '-1';

  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

  this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);
};

TextEditor.prototype.getEditedCell = function () {
  var editorSection = this.checkEditorSection();
  var editedCell = void 0;

  switch (editorSection) {
    case 'top':
      editedCell = this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.holderZIndex = 101;
      break;
    case 'top-left-corner':
      editedCell = this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.holderZIndex = 103;
      break;
    case 'bottom-left-corner':
      editedCell = this.instance.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.holderZIndex = 103;
      break;
    case 'left':
      editedCell = this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.holderZIndex = 102;
      break;
    case 'bottom':
      editedCell = this.instance.view.wt.wtOverlays.bottomOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.holderZIndex = 102;
      break;
    default:
      editedCell = this.instance.getCell(this.row, this.col);
      this.holderZIndex = -1;
      break;
  }

  return editedCell !== -1 && editedCell !== -2 ? editedCell : void 0;
};

TextEditor.prototype.refreshValue = function () {
  var physicalRow = this.instance.toPhysicalRow(this.row);
  var sourceData = this.instance.getSourceDataAtCell(physicalRow, this.col);
  this.originalValue = sourceData;

  this.setValue(sourceData);
  this.refreshDimensions();
};

TextEditor.prototype.refreshDimensions = function () {
  var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  if (this.state !== _baseEditor.EditorState.EDITING && !force) {
    return;
  }
  this.TD = this.getEditedCell();

  // TD is outside of the viewport.
  if (!this.TD) {
    if (!force) {
      this.close(true);
    }

    return;
  }

  var currentOffset = (0, _element.offset)(this.TD);
  var containerOffset = (0, _element.offset)(this.instance.rootElement);
  var scrollableContainer = this.instance.view.wt.wtOverlays.topOverlay.mainTableScrollableElement;
  var totalRowsCount = this.instance.countRows();
  var containerScrollTop = scrollableContainer !== window ? scrollableContainer.scrollTop : 0;
  var containerScrollLeft = scrollableContainer !== window ? scrollableContainer.scrollLeft : 0;

  var editorSection = this.checkEditorSection();

  var scrollTop = ['', 'left'].includes(editorSection) ? containerScrollTop : 0;
  var scrollLeft = ['', 'top', 'bottom'].includes(editorSection) ? containerScrollLeft : 0;

  // If colHeaders is disabled, cells in the first row have border-top
  var editTopModifier = currentOffset.top === containerOffset.top ? 0 : 1;

  var settings = this.instance.getSettings();
  var colHeadersCount = this.instance.hasColHeaders();
  var backgroundColor = this.TD.style.backgroundColor;

  var editTop = currentOffset.top - containerOffset.top - editTopModifier - scrollTop;
  var editLeft = currentOffset.left - containerOffset.left - 1 - scrollLeft;
  var cssTransformOffset = void 0;

  // TODO: Refactor this to the new instance.getCell method (from #ply-59), after 0.12.1 is released
  switch (editorSection) {
    case 'top':
      cssTransformOffset = (0, _element.getCssTransform)(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = (0, _element.getCssTransform)(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'top-left-corner':
      cssTransformOffset = (0, _element.getCssTransform)(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom-left-corner':
      cssTransformOffset = (0, _element.getCssTransform)(this.instance.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom':
      cssTransformOffset = (0, _element.getCssTransform)(this.instance.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder.parentNode);
      break;
    default:
      break;
  }

  if (colHeadersCount && this.instance.getSelectedLast()[0] === 0 || settings.fixedRowsBottom && this.instance.getSelectedLast()[0] === totalRowsCount - settings.fixedRowsBottom) {
    editTop += 1;
  }

  if (this.instance.getSelectedLast()[1] === 0) {
    editLeft += 1;
  }

  if (cssTransformOffset && cssTransformOffset !== -1) {
    this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
  } else {
    (0, _element.resetCssTransform)(this.TEXTAREA_PARENT);
  }

  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';
  this.showEditableElement();

  var firstRowOffset = this.instance.view.wt.wtViewport.rowsRenderCalculator.startPosition;
  var firstColumnOffset = this.instance.view.wt.wtViewport.columnsRenderCalculator.startPosition;
  var horizontalScrollPosition = this.instance.view.wt.wtOverlays.leftOverlay.getScrollPosition();
  var verticalScrollPosition = this.instance.view.wt.wtOverlays.topOverlay.getScrollPosition();
  var scrollbarWidth = (0, _element.getScrollbarWidth)();

  var cellTopOffset = this.TD.offsetTop + firstRowOffset - verticalScrollPosition;
  var cellLeftOffset = this.TD.offsetLeft + firstColumnOffset - horizontalScrollPosition;

  var width = (0, _element.innerWidth)(this.TD) - 8;
  var actualVerticalScrollbarWidth = (0, _element.hasVerticalScrollbar)(scrollableContainer) ? scrollbarWidth : 0;
  var actualHorizontalScrollbarWidth = (0, _element.hasHorizontalScrollbar)(scrollableContainer) ? scrollbarWidth : 0;
  var maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 9 - actualVerticalScrollbarWidth;
  var height = this.TD.scrollHeight + 1;
  var maxHeight = Math.max(this.instance.view.maximumVisibleElementHeight(cellTopOffset) - actualHorizontalScrollbarWidth, 23);

  var cellComputedStyle = (0, _element.getComputedStyle)(this.TD);

  this.TEXTAREA.style.fontSize = cellComputedStyle.fontSize;
  this.TEXTAREA.style.fontFamily = cellComputedStyle.fontFamily;
  this.TEXTAREA.style.backgroundColor = backgroundColor;

  this.autoResize.init(this.TEXTAREA, {
    minHeight: Math.min(height, maxHeight),
    maxHeight: maxHeight, // TEXTAREA should never be higher than visible part of the viewport (should not cover the scrollbar)
    minWidth: Math.min(width, maxWidth),
    maxWidth: maxWidth // TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
  }, true);
};

TextEditor.prototype.bindEvents = function () {
  var editor = this;

  this.eventManager.addEventListener(this.TEXTAREA, 'cut', function (event) {
    (0, _event.stopPropagation)(event);
  });
  this.eventManager.addEventListener(this.TEXTAREA, 'paste', function (event) {
    (0, _event.stopPropagation)(event);
  });

  this.instance.addHook('afterScrollHorizontally', function () {
    editor.refreshDimensions();
  });

  this.instance.addHook('afterScrollVertically', function () {
    editor.refreshDimensions();
  });

  this.instance.addHook('afterColumnResize', function () {
    editor.refreshDimensions();
    editor.focus();
  });

  this.instance.addHook('afterRowResize', function () {
    editor.refreshDimensions();
    editor.focus();
  });

  this.instance.addHook('afterDestroy', function () {
    editor.eventManager.destroy();
  });
};

TextEditor.prototype.destroy = function () {
  this.eventManager.destroy();
};

exports.default = TextEditor;