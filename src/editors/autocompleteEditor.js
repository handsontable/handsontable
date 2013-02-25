function HandsontableAutocompleteEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.originalValue = '';
  this.row;
  this.col;
  this.prop;

  this.TEXTAREA = $('<textarea class="handsontableInput">');
  this.TEXTAREA.css({
    width: 0,
    height: 0
  });

  this.TEXTAREA_PARENT = $('<div class="handsontableInputHolder">').append(this.TEXTAREA);
  this.TEXTAREA_PARENT.addClass('htHidden').css({
    top: 0,
    left: 0,
    overflow: 'hidden'
  });

  var that = this;

  this.TEXTAREA.typeahead();
  var typeahead = this.TEXTAREA.data('typeahead');
  this.typeahead = typeahead;
  typeahead._render = typeahead.render;
  typeahead._highlighter = typeahead.highlighter;

  typeahead.minLength = 0;
  typeahead.highlighter = typeahead._highlighter;

  typeahead.lookup = function () {
    var items;
    this.query = this.$element.val();
    items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
    return items ? this.process(items) : this;
  };

  typeahead.matcher = function () {
    return true;
  };

  this.TEXTAREA.on('keydown', function (event) {
    var restorePropagation = event.isPropagationStopped();

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
        event.stopPropagation();
        restorePropagation = false;
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
          restorePropagation = false;
        }
        break;

      case 37: /* arrow left */
        if (that.getCaretPosition(that.TEXTAREA[0]) === 0) {
          that.finishEditing(false);
        }
        else {
          event.stopPropagation();
          restorePropagation = false;
        }
        break;

      case 27: /* ESC */
        that.instance.destroyEditor(true);
        event.stopPropagation();
        restorePropagation = false;
        break;

      case 13: /* return/enter */
        if (!that.isMenuExpanded()) {
          that.finishEditing(false, ctrlDown);
          //event.stopPropagation(); //cancel because typeahead will trigger change
          //restorePropagation = false;
        }
        else {
          //event.stopPropagation(); //cancel because typeahead will trigger change
          //restorePropagation = false;

          var ev = $.Event('keyup'); //because core.js keydown handler moves focus
          ev.keyCode = event.keyCode;
          that.TEXTAREA.triggerHandler(ev);
        }
        event.preventDefault(); //don't add newline to field
        break;

      case 8: /* backspace */
      case 46: /* delete */
      case 36: /* home */
      case 35: /* end */
        event.stopPropagation();
        restorePropagation = false;
        break;
    }

    if (restorePropagation) { //typeahead stops propagation but we don't want that
      var ev = $.Event('keydown');
      ev.keyCode = event.keyCode;
      that.TEXTAREA_PARENT.trigger(ev);
    }
  });
}

for (var i in HandsontableTextEditorClass.prototype) {
  if (HandsontableTextEditorClass.prototype.hasOwnProperty(i)) {
    HandsontableAutocompleteEditorClass.prototype[i] = HandsontableTextEditorClass.prototype[i];
  }
}

HandsontableAutocompleteEditorClass.prototype._beginEditing = HandsontableTextEditorClass.prototype.beginEditing;

HandsontableAutocompleteEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  this._beginEditing(row, col, prop, useOriginalValue, suffix);
  var that = this;
  setTimeout(function () {
    that.typeahead.show(); //otherwise typeahead appears misaligned
  }, 0);
}

HandsontableAutocompleteEditorClass.prototype.isMenuExpanded = function () {
  if (this.typeahead.$menu.is(":visible")) {
    return this.typeahead;
  }
  else {
    return false;
  }
}

/**
 * Autocomplete editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} instance.autocompleteEditor.TEXTAREA jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, __unused_, cellProperties) {
  var i
    , j;

  if (!instance.autocompleteEditor) {
    instance.autocompleteEditor = new HandsontableAutocompleteEditorClass(instance);
  }

  instance.autocompleteEditor.isCellEdited = false;
  instance.autocompleteEditor.originalValue = instance.getDataAtCell(row, prop);

  var typeahead = instance.autocompleteEditor.typeahead;

  typeahead.select = function () {
    if (instance.autocompleteEditor.dontHide) {
      instance.autocompleteEditor.dontHide = false;
      return;
    }
    var val = this.$menu.find('.active').attr('data-value') || instance.autocompleteEditor.TEXTAREA.val();
    destroyer(true);
    instance.setDataAtCell(row, prop, typeahead.updater(val));
    return this.hide();
  };

  typeahead.render = function (items) {
    typeahead._render.call(this, items);
    if (!cellProperties.strict) {
      this.$menu.find('li:eq(0)').removeClass('active');
    }
    return this;
  };

  /* overwrite typeahead options and methods (matcher, sorter, highlighter, updater, etc) if provided in cellProperties */
  for (i in cellProperties) {
    if (cellProperties.hasOwnProperty(i)) {
      if (i === 'options') {
        for (j in cellProperties.options) {
          if (cellProperties.options.hasOwnProperty(j)) {
            typeahead.options[j] = cellProperties.options[j];
          }
        }
      }
      else {
        typeahead[i] = cellProperties[i];
      }
    }
  }

  var that = this;
  instance.autocompleteEditor.dontHide = false;
  instance.$table.on('keydown.editor', function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!instance.autocompleteEditor.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          instance.autocompleteEditor.beginEditing(row, col, prop);
          instance.autocompleteEditor.dontHide = true;
          typeahead.lookup();
        }
      }
      else if (event.keyCode === 113) { //f2
        instance.autocompleteEditor.beginEditing(row, col, prop, true); //show edit field
        event.stopPropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
        instance.autocompleteEditor.dontHide = true;
        typeahead.lookup();
      }
      else if (event.keyCode === 13 && instance.getSettings().enterBeginsEditing) { //enter
        //instance.autocompleteEditor.dontHide = true;
        var selected = instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          instance.autocompleteEditor.beginEditing(row, col, prop, true, '\n'); //show edit field
        }
        else {
          instance.autocompleteEditor.beginEditing(row, col, prop, true); //show edit field
        }
        event.preventDefault(); //prevent new line at the end of textarea
        event.stopPropagation();

        instance.autocompleteEditor.dontHide = true;
        typeahead.lookup();
      }
    }
  });

  function onDblClick() {
    instance.autocompleteEditor.beginEditing(row, col, prop, true);
    setTimeout(function () { //otherwise is misaligned in IE9
      instance.autocompleteEditor.TEXTAREA.data('typeahead').lookup();
    }, 1);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  var destroyer = function (isCancelled) {
    instance.autocompleteEditor.finishEditing(isCancelled);
    if (instance.autocompleteEditor.isMenuExpanded()) {
      instance.autocompleteEditor.isMenuExpanded().hide();
    }
  }

  return destroyer;
};