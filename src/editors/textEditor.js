function HandsontableTextEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

HandsontableTextEditorClass.prototype.createElements = function () {
  this.wtDom = new WalkontableDom();

  this.TEXTAREA = document.createElement('TEXTAREA');
  this.TEXTAREA.className = 'handsontableInput';
  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;
  this.$textarea = $(this.TEXTAREA);

  this.TEXTAREA_PARENT = document.createElement('DIV');
  this.TEXTAREA_PARENT.className = 'handsontableInputHolder';
  this.textareaParentStyle = this.TEXTAREA_PARENT.style;
  this.textareaParentStyle.top = 0;
  this.textareaParentStyle.left = 0;
  this.textareaParentStyle.display = 'none';
  this.$textareaParent = $(this.TEXTAREA_PARENT);

  this.$body = $(document.body);

  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  this.instance.rootElement[0].appendChild(this.TEXTAREA_PARENT);

  var that = this;
  Handsontable.PluginHooks.add('afterRender', function () {
    that.instance.registerTimeout('refresh_editor_dimensions', function () {
      that.refreshDimensions();
    }, 0);
  });
};

HandsontableTextEditorClass.prototype.bindEvents = function () {
  var that = this;
  this.$textareaParent.off('.editor').on('keydown.editor', function (event) {
    //if we are here then isCellEdited === true

    that.instance.PluginHooks.run('beforeKeyDown', event);
    if (event.isImmediatePropagationStopped()) { //event was cancelled in beforeKeyDown
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
      case 40: /* arrow down */
        that.finishEditing(false);
        break;

      case 9: /* tab */
        that.finishEditing(false);
        event.preventDefault();
        break;

      case 39: /* arrow right */
        if (that.getCaretPosition(that.TEXTAREA) === that.TEXTAREA.value.length) {
          that.finishEditing(false);
        }
        else {
          event.stopImmediatePropagation();
        }
        break;

      case 37: /* arrow left */
        if (that.getCaretPosition(that.TEXTAREA) === 0) {
          that.finishEditing(false);
        }
        else {
          event.stopImmediatePropagation();
        }
        break;

      case 27: /* ESC */
        that.instance.destroyEditor(true);
        event.stopImmediatePropagation();
        break;

      case 13: /* return/enter */
        var selected = that.instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((event.ctrlKey && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          that.TEXTAREA.value = that.TEXTAREA.value + '\n';
          that.TEXTAREA.focus();
          event.stopImmediatePropagation();
        }
        else {
          that.finishEditing(false, ctrlDown);
        }
        event.preventDefault(); //don't add newline to field
        break;

      default:
        event.stopImmediatePropagation(); //backspace, delete, home, end, CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
        break;
    }

    if ((that.waiting || that.force) && !event.isImmediatePropagationStopped()) {
      that.waitingEvent = event;
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
};

HandsontableTextEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {
  var that = this;

  function onDblClick() {
    that.TEXTAREA.value = that.originalValue;
    that.instance.destroyEditor();
    that.beginEditing(row, col, prop, true);
  }

  this.instance.view.wt.update('onCellDblClick', onDblClick);

  if (this.isCellEdited || this.waiting) {
    return;
  }

  this.TD = td;
  this.row = row;
  this.col = col;
  this.prop = prop;
  this.originalValue = value;
  this.cellProperties = cellProperties;

  this.$body.on('keydown.editor.' + this.instance.guid, function (event) {

    if (Handsontable.activeGuid === null) {
      return;
    }

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!that.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          that.beginEditing(row, col, prop);
        }
      }
      else if (event.keyCode === 113) { //f2
        that.beginEditing(row, col, prop, true); //show edit field
        event.stopImmediatePropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
      }
      else if (event.keyCode === 13 && that.instance.getSettings().enterBeginsEditing) { //enter
        var selected = that.instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          that.beginEditing(row, col, prop, true, '\n'); //show edit field
        }
        else {
          that.beginEditing(row, col, prop, true); //show edit field
        }
        event.preventDefault(); //prevent new line at the end of textarea
        event.stopImmediatePropagation();
      }
    }
  });
};

HandsontableTextEditorClass.prototype.unbindTemporaryEvents = function () {
  this.$body.off(".editor");
  this.instance.view.wt.update('onCellDblClick', null);
};

/**
 * Returns caret position in edit proxy
 * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @return {Number}
 */
HandsontableTextEditorClass.prototype.getCaretPosition = function (el) {
  if (el.selectionStart) {
    return el.selectionStart;
  }
  else if (document.selection) { //IE8
    el.focus();
    var r = document.selection.createRange();
    if (r == null) {
      return 0;
    }
    var re = el.createTextRange(),
      rc = re.duplicate();
    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);
    return rc.text.length;
  }
  return 0;
};

/**
 * Sets caret position in edit proxy
 * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
 * @param {Element} el
 * @param {Number} pos
 */
HandsontableTextEditorClass.prototype.setCaretPosition = function (el, pos) {
  if (el.setSelectionRange) {
    el.focus();
    el.setSelectionRange(pos, pos);
  }
  else if (el.createTextRange) { //IE8
    var range = el.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
};

HandsontableTextEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  if (this.isCellEdited || this.waiting) {
    return;
  }
  this.isCellEdited = true;
  this.row = row;
  this.col = col;
  this.prop = prop;

  this.$textarea.on('cut.editor', function (event) {
    event.stopPropagation();
  });

  this.$textarea.on('paste.editor', function (event) {
    event.stopPropagation();
  });

  if (useOriginalValue) {
    this.TEXTAREA.value = Handsontable.helper.stringify(this.originalValue) + (suffix || '');
  }
  else {
    this.TEXTAREA.value = '';
  }

  this.refreshDimensions(); //need it instantly, to prevent https://github.com/warpech/jquery-handsontable/issues/348
  this.TEXTAREA.focus();
  this.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);

  var coords = {row: row, col: col};
  this.instance.view.scrollViewport(coords);
  this.instance.view.render();
};

HandsontableTextEditorClass.prototype.refreshDimensions = function () {
  if (!this.isCellEdited) {
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
    editTop += 1;
  }
  if (colHeadersCount > 0 && parseInt($td.css('border-left-width'), 10) > 0) {
    editLeft += 1;
  }

  if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
    editTop -= 1;
  }

  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';
  ///end prepare textarea position

  var width = $td.width()
    , maxWidth = this.instance.view.maximumVisibleElementWidth(editLeft) - 10 //10 is TEXTAREAs border and padding
    , height = $td.outerHeight() - 4
    , maxHeight = this.instance.view.maximumVisibleElementHeight(editTop) - 5; //10 is TEXTAREAs border and padding

  if (parseInt($td.css('border-top-width'), 10) > 0) {
    height -= 1;
  }
  if (parseInt($td.css('border-left-width'), 10) > 0) {
    if (rowHeadersCount > 0) {
      width -= 1;
    }
  }

  //in future may change to pure JS http://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
  this.$textarea.autoResize({
    minHeight: Math.min(height, maxHeight),
    maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    minWidth: Math.min(width, maxWidth),
    maxWidth: maxWidth, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    animate: false,
    extraSpace: 0
  });

  this.textareaParentStyle.display = 'block';
};

HandsontableTextEditorClass.prototype.saveValue = function (val, ctrlDown) {
  if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    var sel = this.instance.getSelected();
    this.instance.populateFromArray(sel[0], sel[1], val, sel[2], sel[3], 'edit');
  }
  else {
    this.instance.populateFromArray(this.row, this.col, val, null, null, 'edit');
  }
};

HandsontableTextEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (this.waiting) {
    return;
  }
  if (this.isCellEdited) {
    this.isCellEdited = false;
    var val;

    if (isCancelled) {
      val = [
        [this.originalValue]
      ];
    } else {
      val = [
        [$.trim(this.TEXTAREA.value)]
      ];
    }

    var hasValidator = this.instance.getCellMeta(this.row, this.col).validator;

    if (hasValidator) {
      this.waiting = true;
      var that = this;
      this.instance.addHookOnce('afterValidate', function (result) {
        that.force = that.waiting;
        that.waiting = false;
        that.discardEditor(result);
      });
    }
    this.saveValue(val, ctrlDown);

  }
  if (!hasValidator) { //otherwise afterValidate will discard the editor
    this.discardEditor();
  }
};

HandsontableTextEditorClass.prototype.discardEditor = function (result) {
  if (this.waiting) {
    return;
  }

  if (result === false && this.cellProperties.allowInvalid !== true) { //validator was defined and failed
    this.isCellEdited = true;
    var that = this;
    setTimeout(function () {
      if (that.instance.view.wt.wtDom.isVisible(that.TEXTAREA)) {
        that.TEXTAREA.focus();
        that.setCaretPosition(that.TEXTAREA, that.TEXTAREA.value.length);
      }
    }, 0);
  }
  else {
    if (document.activeElement === this.TEXTAREA) {
      this.instance.listen(); //don't refocus the table if user focused some cell outside of HT on purpose
    }
    this.unbindTemporaryEvents();

    this.textareaParentStyle.display = 'none';

    if (this.waitingEvent && this.waitingEvent.type) { //this is needed so when you finish editing with Enter key, the default Enter behavior (move selection down) will work after async validation
      var ev = $.Event(this.waitingEvent.type);
      ev.keyCode = this.waitingEvent.keyCode;
      this.waitingEvent = null;
      $(document.activeElement).trigger(ev);
    }
  }
};

/**
 * Default text editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.TextEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (!instance.textEditor) {
    instance.textEditor = new HandsontableTextEditorClass(instance);
  }
  instance.textEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
  return function (isCancelled) {
    instance.textEditor.finishEditing(isCancelled);
  }
};