function HandsontableTextEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.originalValue = '';
  this.row;
  this.col;
  this.prop;

  this.createElements();

  /*instance.that.TEXTAREA.on('blur.editor', function () {
   if (that.isCellEdited) {
   that.finishEditing(false);
   }
   });*/

  this.bindEvents();
}

HandsontableTextEditorClass.prototype.createElements = function () {
  this.TEXTAREA = $('<textarea class="handsontableInput">');
  this.TEXTAREA.css({
    width: 0,
    height: 0
  });

  this.TEXTAREA_PARENT = $('<div class="handsontableInputHolder">').append(this.TEXTAREA);
  this.TEXTAREA_PARENT.css({
    top: 0,
    left: 0,
    display: 'none'
  });

  this.instance.rootElement.append(this.TEXTAREA_PARENT);

  var that = this;
  Handsontable.PluginHooks.push('afterRender', function () {
    setTimeout(function () {
      that.refreshDimensions();
    }, 0);
  });
}

HandsontableTextEditorClass.prototype.bindEvents = function () {
  var that = this;
  this.TEXTAREA_PARENT.off('.editor').on('keydown.editor', function (event) {
    //if we are here then isCellEdited === true

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

    if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
      //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
      event.stopPropagation();
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
        if (that.getCaretPosition(that.TEXTAREA[0]) === that.TEXTAREA.val().length) {
          that.finishEditing(false);
        }
        else {
          event.stopPropagation();
        }
        break;

      case 37: /* arrow left */
        if (that.getCaretPosition(that.TEXTAREA[0]) === 0) {
          that.finishEditing(false);
        }
        else {
          event.stopPropagation();
        }
        break;

      case 27: /* ESC */
        that.instance.destroyEditor(true);
        event.stopPropagation();
        break;

      case 13: /* return/enter */
        var selected = that.instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((event.ctrlKey && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          that.TEXTAREA.val(that.TEXTAREA.val() + '\n');
          that.TEXTAREA[0].focus();
          event.stopPropagation();
        }
        else {
          that.finishEditing(false, ctrlDown);
        }
        event.preventDefault(); //don't add newline to field
        break;

      case 8: /* backspace */
      case 46: /* delete */
      case 36: /* home */
      case 35: /* end */
        event.stopPropagation();
        break;
    }
  });
}

/**
 * Returns caret position in edit proxy
 * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @return {Number}
 */
HandsontableTextEditorClass.prototype.getCaretPosition = function (el) {
  if (el.selectionStart) {
    return el.selectionStart;
  }
  else if (document.selection) {
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
}

/**
 * Sets caret position in edit proxy
 * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
 * @param {Number}
 */
HandsontableTextEditorClass.prototype.setCaretPosition = function (el, pos) {
  if (el.setSelectionRange) {
    el.focus();
    el.setSelectionRange(pos, pos);
  }
  else if (el.createTextRange) {
    var range = el.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}

HandsontableTextEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  if (this.isCellEdited) {
    return;
  }
  this.isCellEdited = true;
  this.row = row;
  this.col = col;
  this.prop = prop;

  var coords = {row: row, col: col};
  this.instance.view.scrollViewport(coords);
  this.instance.view.render();

  this.TEXTAREA.on('cut.editor', function (event) {
    event.stopPropagation();
  });

  this.TEXTAREA.on('paste.editor', function (event) {
    event.stopPropagation();
  });

  if (!this.instance.getCellMeta(row, col).isWritable) {
    return;
  }

  if (useOriginalValue) {
    this.TEXTAREA[0].value = Handsontable.helper.stringify(this.originalValue) + (suffix || '');
  }
  else {
    this.TEXTAREA[0].value = '';
  }

  this.refreshDimensions(); //need it instantly, to prevent https://github.com/warpech/jquery-handsontable/issues/348
  this.TEXTAREA[0].focus();
  this.setCaretPosition(this.TEXTAREA[0], this.TEXTAREA[0].value.length);

  if (this.instance.getSettings().asyncRendering) {
    var that = this;
    setTimeout(function () {
      that.refreshDimensions(); //need it after rerender to reposition in case scroll was moved
    }, 0);
  }
}

HandsontableTextEditorClass.prototype.refreshDimensions = function () {
  if (!this.isCellEdited) {
    return;
  }

  ///start prepare textarea position
  var $td = $(this.instance.getCell(this.row, this.col)); //because old td may have been scrolled out with scrollViewport
  var currentOffset = $td.offset();
  var containerOffset = this.instance.rootElement.offset();
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

  if (rowHeadersCount > 0 && parseInt($td.css('border-top-width')) > 0) {
    editTop += 1;
  }
  if (colHeadersCount > 0 && parseInt($td.css('border-left-width')) > 0) {
    editLeft += 1;
  }

  if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
    editTop -= 1;
  }

  this.TEXTAREA_PARENT.css({
    top: editTop,
    left: editLeft
  });
  ///end prepare textarea position

  var width = $td.width()
    , height = $td.outerHeight() - 4;

  if (parseInt($td.css('border-top-width')) > 0) {
    height -= 1;
  }
  if (parseInt($td.css('border-left-width')) > 0) {
    if (rowHeadersCount > 0) {
      width -= 1;
    }
  }

  this.TEXTAREA.autoResize({
    maxHeight: 200,
    minHeight: height,
    minWidth: width,
    maxWidth: Math.max(168, width),
    animate: false,
    extraSpace: 0
  });

  this.TEXTAREA_PARENT[0].style.display = 'block';
}

HandsontableTextEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (this.isCellEdited) {
    this.isCellEdited = false;
    var val;
    if (isCancelled) {
      val = [
        [this.originalValue]
      ];
    }
    else {
      val = [
        [$.trim(this.TEXTAREA[0].value)]
      ];
    }
    if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
      var sel = this.instance.getSelected();
      this.instance.populateFromArray({row: sel[0], col: sel[1]}, val, {row: sel[2], col: sel[3]}, false, 'edit');
    }
    else {
      this.instance.populateFromArray({row: this.row, col: this.col}, val, null, false, 'edit');
    }
  }

  this.instance.$table.off(".editor");
  this.instance.$table[0].focus();
  this.instance.view.wt.update('onCellDblClick', null);

  this.TEXTAREA_PARENT[0].style.display = 'none';
}

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

  instance.textEditor.isCellEdited = false;
  instance.textEditor.originalValue = value;

  instance.$table.on('keydown.editor', function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!instance.textEditor.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          instance.textEditor.beginEditing(row, col, prop);
        }
      }
      else if (event.keyCode === 113) { //f2
        instance.textEditor.beginEditing(row, col, prop, true); //show edit field
        event.stopPropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
      }
      else if (event.keyCode === 13 && instance.getSettings().enterBeginsEditing) { //enter
        var selected = instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          instance.textEditor.beginEditing(row, col, prop, true, '\n'); //show edit field
        }
        else {
          instance.textEditor.beginEditing(row, col, prop, true); //show edit field
        }
        event.preventDefault(); //prevent new line at the end of textarea
        event.stopPropagation();
      }
    }
  });

  function onDblClick() {
    instance.textEditor.beginEditing(row, col, prop, true);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  return function (isCancelled) {
    instance.textEditor.finishEditing(isCancelled);
  }
};