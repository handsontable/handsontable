function HandsontableTextEditorClass(instance) {
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

HandsontableTextEditorClass.prototype.createElements = function () {
  this.STATE_VIRGIN = 'STATE_VIRGIN'; //before editing
  this.STATE_EDITING = 'STATE_EDITING';
  this.STATE_WAITING = 'STATE_WAITING'; //waiting for async validation
  this.STATE_FINISHED = 'STATE_FINISHED';

  this.state = this.STATE_VIRGIN;
  this.waitingEvent = null;

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

  this.$textarea.off('.editor').on('keydown.editor', function (event) {
    if(that.state === that.STATE_WAITING) {
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
        that.finishEditing(false);
        break;

      case 40: /* arrow down */
        that.finishEditing(false);
        break;

      case 9: /* tab */
        that.finishEditing(false);
        event.preventDefault();
        break;

      case 39: /* arrow right */
        if (that.wtDom.getCaretPosition(that.TEXTAREA) === that.TEXTAREA.value.length) {
          that.finishEditing(false);
        }
        else {
          event.stopImmediatePropagation();
        }
        break;

      case 37: /* arrow left */
        if (that.wtDom.getCaretPosition(that.TEXTAREA) === 0) {
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

    if (that.state !== that.STATE_FINISHED && !event.isImmediatePropagationStopped()) {
      that.waitingEvent = event;
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
};

HandsontableTextEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {
  var that = this;

  this.state = this.STATE_VIRGIN;

  function onDblClick() {
    that.TEXTAREA.value = that.originalValue;
    that.instance.destroyEditor();
    that.beginEditing(row, col, prop, true);
  }

  this.instance.view.wt.update('onCellDblClick', onDblClick);

  this.TD = td;
  this.row = row;
  this.col = col;
  this.prop = prop;
  this.originalValue = value;
  this.cellProperties = cellProperties;

  this.beforeKeyDownHook = function beforeKeyDownHook (event) {
    if (that.state !== that.STATE_VIRGIN) {
      return;
    }

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

    if (Handsontable.helper.isPrintableChar(event.keyCode)) {
      //here we are whitelisting all possible printable chars that can open the editor.
      //in future, if there are some problems to find out if a char is printable, it would be better to invert this
      //check (blacklist of non-printable chars should be shorter than whitelist of printable chars)

      if (!ctrlDown) { //disregard CTRL-key shortcuts
        that.beginEditing(row, col, prop);
        event.stopImmediatePropagation();
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
    } else if ([9, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(event.keyCode) == -1){ // other non printable character
     that.instance.addHookOnce('beforeKeyDown', beforeKeyDownHook);
    }
  };
  that.instance.addHookOnce('beforeKeyDown', this.beforeKeyDownHook);
};

HandsontableTextEditorClass.prototype.unbindTemporaryEvents = function () {
  this.instance.removeHook('beforeKeyDown', this.beforeKeyDownHook);
  this.instance.view.wt.update('onCellDblClick', null);
};

HandsontableTextEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  if (this.state !== this.STATE_VIRGIN) {
    return;
  }

  this.state = this.STATE_EDITING;

  this.row = row;
  this.col = col;
  this.prop = prop;

  var coords = {row: row, col: col};
  this.instance.view.scrollViewport(coords); //viewport must be scrolled and rerendered before TEXTAREA is positioned
  this.instance.view.render();

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
  this.wtDom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  this.instance.view.render(); //only rerender the selections (FillHandle should disappear when beginediting is triggered)
};

HandsontableTextEditorClass.prototype.refreshDimensions = function () {
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
  var hasValidator = false;

  if (this.state == this.STATE_WAITING || this.state == this.STATE_FINISHED) {
    return;
  }

  if (this.state == this.STATE_EDITING) {
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

    hasValidator = this.instance.getCellMeta(this.row, this.col).validator;

    if (hasValidator) {
      this.state = this.STATE_WAITING;
      var that = this;
      this.instance.addHookOnce('afterValidate', function (result) {
        that.state = that.STATE_FINISHED;
        that.discardEditor(result);
      });
    }
    this.saveValue(val, ctrlDown);
  }

  if (!hasValidator) {
    this.state = this.STATE_FINISHED;
    this.discardEditor();
  }
};

HandsontableTextEditorClass.prototype.discardEditor = function (result) {
  if (this.state !== this.STATE_FINISHED) {
    return;
  }

  if (result === false && this.cellProperties.allowInvalid !== true) { //validator was defined and failed
    this.state = this.STATE_EDITING;
    if (this.instance.view.wt.wtDom.isVisible(this.TEXTAREA)) {
      this.TEXTAREA.focus();
      this.wtDom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
    }
  }
  else {
    this.state = this.STATE_FINISHED;
    if (document.activeElement === this.TEXTAREA) {
      this.instance.listen(); //don't refocus the table if user focused some cell outside of HT on purpose
    }
    this.unbindTemporaryEvents();

    this.textareaParentStyle.display = 'none';

    if (this.waitingEvent) { //this is needed so when you finish editing with Enter key, the default Enter behavior (move selection down) will work after async validation
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
  if (instance.textEditor.state === instance.textEditor.STATE_VIRGIN || instance.textEditor.state === instance.textEditor.STATE_FINISHED) {
    instance.textEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
  }
  return function (isCancelled) {
    instance.textEditor.finishEditing(isCancelled);
  }
};