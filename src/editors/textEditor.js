var texteditor = {
  isCellEdited: false,

  /**
   * Returns caret position in edit proxy
   * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
   * @return {Number}
   */
  getCaretPosition: function (keyboardProxy) {
    var el = keyboardProxy[0];
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
  },

  /**
   * Sets caret position in edit proxy
   * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
   * @param {Number}
    */
  setCaretPosition: function (keyboardProxy, pos) {
    var el = keyboardProxy[0];
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
  },

  /**
   * Shows text input in grid cell
   */
  beginEditing: function (instance, td, row, col, prop, keyboardProxy, useOriginalValue, suffix) {
    if (texteditor.isCellEdited) {
      return;
    }

    keyboardProxy.on('cut.editor', function (event) {
      event.stopPropagation();
    });

    keyboardProxy.on('paste.editor', function (event) {
      event.stopPropagation();
    });

    var $td = $(td);

    if (!instance.grid.isCellWritable($td)) {
      return;
    }

    texteditor.isCellEdited = true;

    if (useOriginalValue) {
      var original = instance.getDataAtCell(row, prop);
      original = Handsontable.helper.stringify(original) + (suffix || '');
      keyboardProxy.val(original);
      texteditor.setCaretPosition(keyboardProxy, original.length);
    }
    else {
      keyboardProxy.val('');
    }

    var width = $td.width()
      , height = $td.outerHeight() - 4;

    if (parseInt($td.css('border-top-width')) > 0) {
      height -= 1;
    }
    if (parseInt($td.css('border-left-width')) > 0) {
      if (instance.blockedCols.count() > 0) {
        width -= 1;
      }
    }

    keyboardProxy.autoResize({
      maxHeight: 200,
      minHeight: height,
      minWidth: width,
      maxWidth: Math.max(168, width),
      animate: false,
      extraSpace: 0
    });
    keyboardProxy.parent().removeClass('htHidden');

    instance.rootElement.triggerHandler('beginediting.handsontable');

    setTimeout(function () {
      //async fix for Firefox 3.6.28 (needs manual testing)
      keyboardProxy.parent().css({
        overflow: 'visible'
      });
    }, 1);
  },

  /**
   * Finishes text input in selected cells
   */
  finishEditing: function (instance, td, row, col, prop, keyboardProxy, isCancelled, ctrlDown) {
    if (texteditor.isCellEdited) {
      texteditor.isCellEdited = false;
      var val = [
        [$.trim(keyboardProxy.val())]
      ];
      if (!isCancelled) {
        if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
          var sel = instance.handsontable('getSelected');
          instance.grid.populateFromArray({row: sel[0], col: sel[1]}, val, {row: sel[2], col: sel[3]}, false, 'edit');
        }
        else {
          instance.grid.populateFromArray({row: row, col: col}, val, null, false, 'edit');
        }
      }
    }

    keyboardProxy.css({
      width: 0,
      height: 0
    });
    keyboardProxy.parent().addClass('htHidden').css({
      overflow: 'hidden'
    });

    keyboardProxy.off(".editor");
    $(td).off('.editor');
    instance.container.find('.htBorder.current').off('.editor');

    instance.rootElement.triggerHandler('finishediting.handsontable');
  }
};

/**
 * Default text editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellOptions Cell options (shared by cell renderer and editor)
 */
Handsontable.TextEditor = function (instance, td, row, col, prop, keyboardProxy, cellOptions) {
  texteditor.isCellEdited = false;

  var $current = $(td);
  var currentOffset = $current.offset();
  var containerOffset = instance.container.offset();
  var scrollTop = instance.container.scrollTop();
  var scrollLeft = instance.container.scrollLeft();
  var editTop = currentOffset.top - containerOffset.top + scrollTop - 1;
  var editLeft = currentOffset.left - containerOffset.left + scrollLeft - 1;

  if (editTop < 0) {
    editTop = 0;
  }
  if (editLeft < 0) {
    editLeft = 0;
  }

  if (instance.blockedRows.count() > 0 && parseInt($current.css('border-top-width')) > 0) {
    editTop += 1;
  }
  if (instance.blockedCols.count() > 0 && parseInt($current.css('border-left-width')) > 0) {
    editLeft += 1;
  }

  if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
    editTop -= 1;
  }

  keyboardProxy.parent().addClass('htHidden').css({
    top: editTop,
    left: editLeft,
    overflow: 'hidden'
  });
  keyboardProxy.css({
    width: 0,
    height: 0
  });

  keyboardProxy.on("keydown.editor", function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (Handsontable.helper.isPrintableChar(event.keyCode)) {
      if (!texteditor.isCellEdited && !ctrlDown) { //disregard CTRL-key shortcuts
        texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy);
        event.stopPropagation();
      }
      else if (ctrlDown) {
        if (texteditor.isCellEdited && event.keyCode === 65) { //CTRL + A
          event.stopPropagation();
        }
        else if (texteditor.isCellEdited && event.keyCode === 88 && $.browser.opera) { //CTRL + X
          event.stopPropagation();
        }
        else if (texteditor.isCellEdited && event.keyCode === 86 && $.browser.opera) { //CTRL + V
          event.stopPropagation();
        }
      }
      return;
    }

    switch (event.keyCode) {
      case 38: /* arrow up */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
          event.stopPropagation();
        }
        break;

      case 9: /* tab */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
          event.stopPropagation();
        }
        event.preventDefault();
        break;

      case 39: /* arrow right */
        if (texteditor.isCellEdited) {
          if (texteditor.getCaretPosition(keyboardProxy) === keyboardProxy.val().length) {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);

          }
          else {
            event.stopPropagation();
          }
        }
        break;

      case 37: /* arrow left */
        if (texteditor.isCellEdited) {
          if (texteditor.getCaretPosition(keyboardProxy) === 0) {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
          }
          else {
            event.stopPropagation();
          }
        }
        break;

      case 8: /* backspace */
      case 46: /* delete */
        if (texteditor.isCellEdited) {
          event.stopPropagation();
        }
        break;

      case 40: /* arrow down */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
          event.stopPropagation();
        }
        break;

      case 27: /* ESC */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, true); //hide edit field, restore old value, don't move selection, but refresh routines
          event.stopPropagation();
        }
        break;

      case 113: /* F2 */
        if (!texteditor.isCellEdited) {
          texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true); //show edit field
          event.stopPropagation();
          event.preventDefault(); //prevent Opera from opening Go to Page dialog
        }
        break;

      case 13: /* return/enter */
        if (texteditor.isCellEdited) {
          var selected = instance.getSelected();
          var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
          if ((event.ctrlKey && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
            keyboardProxy.val(keyboardProxy.val() + '\n');
            keyboardProxy[0].focus();
            event.stopPropagation();
          }
          else {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false, ctrlDown);
          }
        }
        else if (cellOptions.enterBeginsEditing) {
          if ((ctrlDown && !selection.isMultiple()) || event.altKey) { //if ctrl+enter or alt+enter, add new line
            texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true, '\n'); //show edit field
          }
          else {
            texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true); //show edit field
          }
          event.stopPropagation();
        }
        event.preventDefault(); //don't add newline to field
        break;

      case 36: /* home */
        event.stopPropagation();
        break;

      case 35: /* end */
        event.stopPropagation();
        break;
    }
  });

  function onDblClick() {
    keyboardProxy[0].focus();
    texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true);
  }

  $current.on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  return function () {
    texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
  }
};