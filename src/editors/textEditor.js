import {
    addClass,
    getCaretPosition,
    getComputedStyle,
    getCssTransform,
    getScrollableElement,
    innerWidth,
    offset,
    resetCssTransform,
    setCaretPosition,
} from './../helpers/dom/element';
import autoResize from 'autoResize';
import {BaseEditor} from './_baseEditor';
import {eventManager as eventManagerObject} from './../eventManager';
import {getEditor, registerEditor} from './../editors';
import {KEY_CODES} from './../helpers/unicode';
import {stopPropagation, stopImmediatePropagation, isImmediatePropagationStopped} from './../helpers/dom/event';

var TextEditor = BaseEditor.prototype.extend();

/**
 * @private
 * @editor TextEditor
 * @class TextEditor
 * @dependencies autoResize
 */
TextEditor.prototype.init = function() {
  var that = this;
  this.createElements();
  this.eventManager = eventManagerObject(this);
  this.bindEvents();
  this.autoResize = autoResize();

  this.instance.addHook('afterDestroy', function() {
    that.destroy();
  });
};

TextEditor.prototype.getValue = function() {
  return this.TEXTAREA.value;
};

TextEditor.prototype.setValue = function(newValue) {
  this.TEXTAREA.value = newValue;
};

var onBeforeKeyDown = function onBeforeKeyDown(event) {
  var instance = this,
      that = instance.getActiveEditor(),
      ctrlDown;

  // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
  ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  // Process only events that have been fired in the editor
  if (event.target !== that.TEXTAREA || isImmediatePropagationStopped(event)) {
    return;
  }

  if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
    // when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
    stopImmediatePropagation(event);
    return;
  }

  switch (event.keyCode) {
    case KEY_CODES.ARROW_RIGHT:
      if (that.isInFullEditMode()) {
        if ((!that.isWaiting() && !that.allowKeyEventPropagation) ||
            (!that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode))) {
          stopImmediatePropagation(event);
        }
      }
      break;
    case KEY_CODES.ARROW_LEFT:
      if (that.isInFullEditMode()) {
        if ((!that.isWaiting() && !that.allowKeyEventPropagation) ||
            (!that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode))) {
          stopImmediatePropagation(event);
        }
      }
      break;
    case KEY_CODES.ARROW_UP:
    case KEY_CODES.ARROW_DOWN:
      if (that.isInFullEditMode()) {
        if ((!that.isWaiting() && !that.allowKeyEventPropagation) ||
            (!that.isWaiting() && that.allowKeyEventPropagation && !that.allowKeyEventPropagation(event.keyCode))) {
          stopImmediatePropagation(event);
        }
      }
      break;

    case KEY_CODES.ENTER:
      var selected = that.instance.getSelected();
      var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
      if ((ctrlDown && !isMultipleSelection) || event.altKey) { // if ctrl+enter or alt+enter, add new line
        if (that.isOpened()) {
          var caretPosition = getCaretPosition(that.TEXTAREA),
              value = that.getValue();

          var newValue = value.slice(0, caretPosition) + '\n' + value.slice(caretPosition);

          that.setValue(newValue);

          setCaretPosition(that.TEXTAREA, caretPosition + 1);

        } else {
          that.beginEditing(that.originalValue + '\n');
        }
        stopImmediatePropagation(event);
      }
      event.preventDefault(); // don't add newline to field
      break;

    case KEY_CODES.A:
    case KEY_CODES.X:
    case KEY_CODES.C:
    case KEY_CODES.V:
      if (ctrlDown) {
        stopImmediatePropagation(event); // CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
      }
      break;

    case KEY_CODES.BACKSPACE:
    case KEY_CODES.DELETE:
    case KEY_CODES.HOME:
    case KEY_CODES.END:
      stopImmediatePropagation(event); // backspace, delete, home, end should only work locally when cell is edited (not in table context)
      break;
  }

  if ([KEY_CODES.ARROW_UP, KEY_CODES.ARROW_RIGHT, KEY_CODES.ARROW_DOWN, KEY_CODES.ARROW_LEFT].indexOf(event.keyCode) === -1) {
    that.autoResize.resize(String.fromCharCode(event.keyCode));
  }
};

TextEditor.prototype.open = function() {
  this.refreshDimensions(); // need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348

  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.close = function(tdOutside) {
  this.textareaParentStyle.display = 'none';

  this.autoResize.unObserve();

  if (document.activeElement === this.TEXTAREA) {
    this.instance.listen(); // don't refocus the table if user focused some cell outside of HT on purpose
  }
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.focus = function() {
  this.TEXTAREA.focus();
  setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
};

TextEditor.prototype.createElements = function() {
  //    this.$body = $(document.body);

  this.TEXTAREA = document.createElement('TEXTAREA');

  addClass(this.TEXTAREA, 'handsontableInput');

  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;

  this.TEXTAREA_PARENT = document.createElement('DIV');
  addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

  this.textareaParentStyle = this.TEXTAREA_PARENT.style;
  this.textareaParentStyle.top = 0;
  this.textareaParentStyle.left = 0;
  this.textareaParentStyle.display = 'none';

  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

  this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);

  var that = this;
  this.instance._registerTimeout(setTimeout(function() {
    that.refreshDimensions();
  }, 0));
};

TextEditor.prototype.getEditedCell = function() {
  var editorSection = this.checkEditorSection(),
      editedCell;

  switch (editorSection) {
    case 'top':
      editedCell = this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 101;
      break;
    case 'top-left-corner':
      editedCell = this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 103;
      break;
    case 'bottom-left-corner':
      editedCell = this.instance.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 103;
      break;
    case 'left':
      editedCell = this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 102;
      break;
    case 'bottom':
      editedCell = this.instance.view.wt.wtOverlays.bottomOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 102;
      break;
    default:
      editedCell = this.instance.getCell(this.row, this.col);
      this.textareaParentStyle.zIndex = '';
      break;
  }

  return editedCell != -1 && editedCell != -2 ? editedCell : void 0;
};

TextEditor.prototype.refreshDimensions = function() {
  if (this.state !== Handsontable.EditorState.EDITING) {
    return;
  }
  this.TD = this.getEditedCell();

  // TD is outside of the viewport.
  if (!this.TD) {
    this.close(true);

    return;
  }
  var currentOffset = offset(this.TD),
      containerOffset = offset(this.instance.rootElement),
      scrollableContainer = getScrollableElement(this.TD),
      totalRowsCount = this.instance.countRows(),
      editTop = currentOffset.top - containerOffset.top - 1 - (scrollableContainer.scrollTop || 0),
      editLeft = currentOffset.left - containerOffset.left - 1 - (scrollableContainer.scrollLeft || 0),

      settings = this.instance.getSettings(),
      rowHeadersCount = settings.rowHeaders ? 1 : 0,
      colHeadersCount = settings.colHeaders ? 1 : 0,
      editorSection = this.checkEditorSection(),
      backgroundColor = this.TD.style.backgroundColor,
      cssTransformOffset;

  // TODO: Refactor this to the new instance.getCell method (from #ply-59), after 0.12.1 is released
  switch (editorSection) {
    case 'top':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'top-left-corner':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom-left-corner':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder.parentNode);
      break;
  }

  if (colHeadersCount && this.instance.getSelected()[0] === 0 ||
      (settings.fixedRowsBottom && this.instance.getSelected()[0] === totalRowsCount - settings.fixedRowsBottom)) {

    editTop += 1;
  }

  if (this.instance.getSelected()[1] === 0) {
    editLeft += 1;
  }

  if (cssTransformOffset && cssTransformOffset != -1) {
    this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
  } else {
    resetCssTransform(this.textareaParentStyle);
  }

  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';
  // end prepare textarea position

  var cellTopOffset = this.TD.offsetTop - this.instance.view.wt.wtOverlays.topOverlay.getScrollPosition(),
      cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtOverlays.leftOverlay.getScrollPosition();

  let width = innerWidth(this.TD) - 8;
  // 10 is TEXTAREAs padding
  let maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 9;
  let height = this.TD.scrollHeight + 1;
  // 10 is TEXTAREAs border and padding
  let maxHeight = Math.max(this.instance.view.maximumVisibleElementHeight(cellTopOffset) - 2, 23);

  const cellComputedStyle = getComputedStyle(this.TD);

  this.TEXTAREA.style.fontSize = cellComputedStyle.fontSize;
  this.TEXTAREA.style.fontFamily = cellComputedStyle.fontFamily;

  this.TEXTAREA.style.backgroundColor = ''; // RESET STYLE

  this.TEXTAREA.style.backgroundColor = backgroundColor ? backgroundColor : getComputedStyle(this.TEXTAREA).backgroundColor;

  this.autoResize.init(this.TEXTAREA, {
    minHeight: Math.min(height, maxHeight),
    maxHeight: maxHeight, // TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    minWidth: Math.min(width, maxWidth),
    maxWidth: maxWidth // TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
  }, true);

  this.textareaParentStyle.display = 'block';
};

TextEditor.prototype.bindEvents = function() {
  var editor = this;

  this.eventManager.addEventListener(this.TEXTAREA, 'cut', function(event) {
    stopPropagation(event);
  });

  this.eventManager.addEventListener(this.TEXTAREA, 'paste', function(event) {
    stopPropagation(event);
  });

  this.instance.addHook('afterScrollHorizontally', function() {
    editor.refreshDimensions();
  });

  this.instance.addHook('afterScrollVertically', function() {
    editor.refreshDimensions();
  });

  this.instance.addHook('afterColumnResize', function() {
    editor.refreshDimensions();
    editor.focus();
  });

  this.instance.addHook('afterRowResize', function() {
    editor.refreshDimensions();
    editor.focus();
  });

  this.instance.addHook('afterDestroy', function() {
    editor.eventManager.destroy();
  });
};

TextEditor.prototype.destroy = function() {
  this.eventManager.destroy();
};

export {TextEditor};

registerEditor('text', TextEditor);
