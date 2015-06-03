
import * as dom from './../dom.js';
import * as helper from './../helpers.js';
import autoResize from 'autoResize';
import {BaseEditor} from './_baseEditor.js';
import {eventManager as eventManagerObject} from './../eventManager.js';
import {getEditor, registerEditor} from './../editors.js';

var TextEditor = BaseEditor.prototype.extend();

export {TextEditor};

Handsontable.editors = Handsontable.editors || {};

/**
 * @private
 * @editor
 * @class TextEditor
 * @dependencies autoResize
 */
Handsontable.editors.TextEditor = TextEditor;

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
    keyCodes, ctrlDown;

  keyCodes = helper.keyCode;
  ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
  dom.enableImmediatePropagation(event);

  //Process only events that have been fired in the editor
  if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()) {
    return;
  }

  if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
    //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
    event.stopImmediatePropagation();
    return;
  }

  switch (event.keyCode) {
    case keyCodes.ARROW_RIGHT:
      if (dom.getCaretPosition(that.TEXTAREA) !== that.TEXTAREA.value.length) {
        event.stopImmediatePropagation();
      }
      break;

    case keyCodes.ARROW_LEFT:
      /* arrow left */
      if (dom.getCaretPosition(that.TEXTAREA) !== 0) {
        event.stopImmediatePropagation();
      }
      break;

    case keyCodes.ENTER:
      var selected = that.instance.getSelected();
      var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
      if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
        if (that.isOpened()) {
          var caretPosition = dom.getCaretPosition(that.TEXTAREA),
            value = that.getValue();

          var newValue = value.slice(0, caretPosition) + '\n' + value.slice(caretPosition);

          that.setValue(newValue);

          dom.setCaretPosition(that.TEXTAREA, caretPosition + 1);

        } else {
          that.beginEditing(that.originalValue + '\n');
        }
        event.stopImmediatePropagation();
      }
      event.preventDefault(); //don't add newline to field
      break;

    case keyCodes.A:
    case keyCodes.X:
    case keyCodes.C:
    case keyCodes.V:
      if (ctrlDown) {
        event.stopImmediatePropagation(); //CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
      }
      break;

    case keyCodes.BACKSPACE:
    case keyCodes.DELETE:
    case keyCodes.HOME:
    case keyCodes.END:
      event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
      break;
  }

  that.autoResize.resize(String.fromCharCode(event.keyCode));
};



TextEditor.prototype.open = function() {
  this.refreshDimensions(); //need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348

  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.close = function() {
  this.textareaParentStyle.display = 'none';

  this.autoResize.unObserve();

  if (document.activeElement === this.TEXTAREA) {
    this.instance.listen(); //don't refocus the table if user focused some cell outside of HT on purpose
  }

  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};

TextEditor.prototype.focus = function() {
  this.TEXTAREA.focus();
  dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
};

TextEditor.prototype.createElements = function() {
  //    this.$body = $(document.body);

  this.TEXTAREA = document.createElement('TEXTAREA');

  dom.addClass(this.TEXTAREA, 'handsontableInput');

  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;

  this.TEXTAREA_PARENT = document.createElement('DIV');
  dom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

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

TextEditor.prototype.checkEditorSection = function() {
  if (this.row < this.instance.getSettings().fixedRowsTop) {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'corner';
    } else {
      return 'top';
    }
  } else {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'left';
    }
  }
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
    case 'corner':
      editedCell = this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
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
    default:
      editedCell = this.instance.getCell(this.row, this.col);
      this.textareaParentStyle.zIndex = "";
      break;
  }

  return editedCell != -1 && editedCell != -2 ? editedCell : void 0;
};


TextEditor.prototype.refreshDimensions = function() {
  if (this.state !== Handsontable.EditorState.EDITING) {
    return;
  }

  ///start prepare textarea position
  //    this.TD = this.instance.getCell(this.row, this.col);
  this.TD = this.getEditedCell();

  if (!this.TD) {
    //TD is outside of the viewport. Otherwise throws exception when scrolling the table while a cell is edited
    return;
  }
  //var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport

  var currentOffset = dom.offset(this.TD),
    containerOffset = dom.offset(this.instance.rootElement),
    scrollableContainer = dom.getScrollableElement(this.TD),
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
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'corner':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
  }

  if (editTop < 0) {
    editTop = 0;
  }
  if (editLeft < 0) {
    editLeft = 0;
  }

  if (colHeadersCount && this.instance.getSelected()[0] === 0) {
    editTop += 1;
  }

  if (rowHeadersCount && this.instance.getSelected()[1] === 0) {
    editLeft += 1;
  }

  if (cssTransformOffset && cssTransformOffset != -1) {
    this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
  } else {
    dom.resetCssTransform(this.textareaParentStyle);
  }



  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';

  ///end prepare textarea position


  var cellTopOffset = this.TD.offsetTop - this.instance.view.wt.wtOverlays.topOverlay.getScrollPosition(),
    cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtOverlays.leftOverlay.getScrollPosition();

  var width = dom.innerWidth(this.TD) - 8 //$td.width()
    ,
    maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 10 //10 is TEXTAREAs padding

    ,
    height = this.TD.scrollHeight + 1,
    maxHeight = this.instance.view.maximumVisibleElementHeight(cellTopOffset) - 2; //10 is TEXTAREAs border and padding

  if (parseInt(this.TD.style.borderTopWidth, 10) > 0) {
    height -= 1;
  }
  if (parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
    if (rowHeadersCount > 0) {
      width -= 1;
    }
  }

  this.TEXTAREA.style.fontSize = dom.getComputedStyle(this.TD).fontSize;
  this.TEXTAREA.style.fontFamily = dom.getComputedStyle(this.TD).fontFamily;

  this.TEXTAREA.style.backgroundColor = ''; //RESET STYLE

  this.TEXTAREA.style.backgroundColor = backgroundColor ? backgroundColor : dom.getComputedStyle(this.TEXTAREA).backgroundColor;

  this.autoResize.init(this.TEXTAREA, {
    minHeight: Math.min(height, maxHeight),
    maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    minWidth: Math.min(width, maxWidth),
    maxWidth: maxWidth //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
  }, true);

  this.textareaParentStyle.display = 'block';
};

TextEditor.prototype.bindEvents = function() {
  var editor = this;

  this.eventManager.addEventListener(this.TEXTAREA, 'cut', function(event) {
    helper.stopPropagation(event);
    //event.stopPropagation();
  });

  this.eventManager.addEventListener(this.TEXTAREA, 'paste', function(event) {
    helper.stopPropagation(event);
    //event.stopPropagation();
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
    editor.eventManager.clear();
  });
};

TextEditor.prototype.destroy = function() {
  this.eventManager.clear();
};

registerEditor('text', TextEditor);
