/**
 * This is inception. Using Handsontable as Handsontable editor
 */

function HandsontableHandsontableEditorClass(instance) {
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

Handsontable.helper.inherit(HandsontableHandsontableEditorClass, HandsontableTextEditorClass);

HandsontableHandsontableEditorClass.prototype.createElements = function () {
  HandsontableTextEditorClass.prototype.createElements.call(this);

  var DIV = document.createElement('DIV');
  DIV.className = 'handsontableEditor';
  this.TEXTAREA_PARENT.appendChild(DIV);

  this.$htContainer = $(DIV);
};

HandsontableTextEditorClass.prototype.moveSelectedOption = function (rowDelta, colDelta) {
  var HOT = this.$htContainer.handsontable('getInstance');
  var sel = HOT.getSelected();
  HOT.selectCell(sel[0] + rowDelta, sel[1] + colDelta);
  this.wtDom.setCaretPosition(this.$textarea[0], 0, this.$textarea[0].value.length);
};

HandsontableTextEditorClass.prototype.bindEvents = function () {
  var that = this;

  this.$textarea.off('.editor').on('keydown.editor', function (event) {
    if (that.state === that.STATE_WAITING) {
      event.stopImmediatePropagation();
    }
    else {
      that.waitingEvent = null;
    }

    if (that.state !== that.STATE_EDITING) {
      return;
    }

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

    if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
      //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
      event.stopImmediatePropagation();
      return;
    }

    switch (event.keyCode) {
      case 38: /* arrow up */
        that.moveSelectedOption(-1, 0);
        break;

      case 40: /* arrow down */
        that.moveSelectedOption(1, 0);
        break;

      case 9: /* tab */
        that.finishEditing(false);
        event.preventDefault();
        break;

      case 39: /* arrow right */
        that.moveSelectedOption(0, 1);
        break;

      case 37: /* arrow left */
        that.moveSelectedOption(0, -1);
        break;

      case 27: /* ESC */
        that.instance.destroyEditor(true);
        event.stopImmediatePropagation();
        break;

      case 13: /* return/enter */
        that.TEXTAREA.value = that.$htContainer.handsontable('getInstance').getValue();
        that.instance.destroyEditor();
        break;

      default:
        event.stopImmediatePropagation(); //backspace, delete, home, end, CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
        break;
    }

    if (that.state !== that.STATE_FINISHED && !event.isImmediatePropagationStopped()) {
      that.waitingEvent = event;
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
};

HandsontableHandsontableEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {
  var parent = this;

  var options = {
    className: 'listbox',
    cells: function () {
      return {
        readOnly: true
      }
    },
    fillHandle: false,
    width: 2000,
    //width: 'auto',
    afterOnCellMouseDown: function () {
      parent.TEXTAREA.value = this.getValue();
      parent.instance.destroyEditor();
    }
  };

  if (cellProperties.handsontable) {
    options = $.extend(options, cellProperties.handsontable);
  }

  this.$htContainer.handsontable(options);

  HandsontableTextEditorClass.prototype.bindTemporaryEvents.call(this, td, row, col, prop, value, cellProperties);
};

HandsontableHandsontableEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  var onBeginEditing = this.instance.getSettings().onBeginEditing;
  if (onBeginEditing && onBeginEditing() === false) {
    return;
  }

  HandsontableTextEditorClass.prototype.beginEditing.call(this, row, col, prop, useOriginalValue, suffix);

  this.$htContainer.handsontable('render');
  this.$htContainer.handsontable('selectCell', 0, 0);

  this.wtDom.setCaretPosition(this.$textarea[0], 0, this.$textarea[0].value.length);
};

HandsontableHandsontableEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
    this.instance.listen(); //return the focus to the parent HOT instance
  }
  this.$htContainer.handsontable('destroy');
  HandsontableTextEditorClass.prototype.finishEditing.call(this, isCancelled, ctrlDown);
};

HandsontableHandsontableEditorClass.prototype.refreshDimensions = function () {
  if (this.state !== this.STATE_EDITING) {
    return;
  }

  ///start prepare textarea position
  this.TD = this.instance.getCell(this.row, this.col);
  var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport
  var currentOffset = this.wtDom.offset(this.TD);
  var containerOffset = this.wtDom.offset(this.instance.rootElement[0]);
  var scrollTop = this.instance.rootElement.scrollTop();
  var scrollLeft = this.instance.rootElement.scrollLeft();
  var editTop = currentOffset.top - containerOffset.top + scrollTop - 1;
  var editLeft = currentOffset.left - containerOffset.left + scrollLeft - 1;

  var settings = this.instance.getSettings();
  var rowHeadersCount = settings.rowHeaders === false ? 0 : 1;
  var colHeadersCount = settings.colHeaders === false ? 0 : 1;

  if (editTop < 0) {
    editTop = 0;
  }
  if (editLeft < 0) {
    editLeft = 0;
  }

  if (rowHeadersCount > 0 && parseInt($td.css('border-top-width'), 10) > 0) {
    //editTop += 1;
  }
  if (colHeadersCount > 0 && parseInt($td.css('border-left-width'), 10) > 0) {
    //editLeft += 1;
  }

  if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
    editTop -= 1;
  }

  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';
  ///end prepare textarea position

  var width = $td.width()
    , height = $td.outerHeight() - 4;

  if (parseInt($td.css('border-top-width'), 10) > 0) {
    //height -= 1;
  }
  if (parseInt($td.css('border-left-width'), 10) > 0) {
    if (rowHeadersCount > 0) {
      //width -= 1;
    }
  }

  this.$textarea[0].style.width = width + 'px';
  this.$textarea[0].style.height = height + 'px';

  this.textareaParentStyle.display = 'block';
};

/**
 * Handsontable editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.HandsontableEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (!instance.handsontableEditor) {
    instance.handsontableEditor = new HandsontableHandsontableEditorClass(instance);
  }
  instance.handsontableEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);

  instance.registerEditor = instance.handsontableEditor;

  return function (isCancelled) {
    instance.handsontableEditor.finishEditing(isCancelled);
  }
};
