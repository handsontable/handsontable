function HandsontableAutocompleteEditorClass(instance) {
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

  this.bindEvents();
}

for (var i in HandsontableTextEditorClass.prototype) {
  if (HandsontableTextEditorClass.prototype.hasOwnProperty(i)) {
    HandsontableAutocompleteEditorClass.prototype[i] = HandsontableTextEditorClass.prototype[i];
  }
}

HandsontableAutocompleteEditorClass.prototype._bindEvents = HandsontableTextEditorClass.prototype.bindEvents;

HandsontableAutocompleteEditorClass.prototype.bindEvents = function () {
  var that = this;

  this.typeahead.listen();

  this.TEXTAREA.off('keydown'); //unlisten
  this.TEXTAREA.off('keyup'); //unlisten
  this.TEXTAREA.off('keypress'); //unlisten

  this.TEXTAREA_PARENT.off('.acEditor').on('keydown.acEditor', function (event) {
    switch (event.keyCode) {
      case 38: /* arrow up */
        that.typeahead.prev();
        event.stopImmediatePropagation();
        break;

      case 40: /* arrow down */
        that.typeahead.next();
        event.stopImmediatePropagation();
        break;

      case 13: /* enter */
        event.preventDefault();
        break;
    }
  });

  this.TEXTAREA_PARENT.on('keyup.acEditor', function (event) {
    if (Handsontable.helper.isPrintableChar(event.keyCode) || event.keyCode === 113 || event.keyCode === 13 || event.keyCode === 8 || event.keyCode === 46) {
      that.typeahead.lookup();
    }
  });

  this._bindEvents();
}

HandsontableAutocompleteEditorClass.prototype._beginEditing = HandsontableTextEditorClass.prototype.beginEditing;

HandsontableAutocompleteEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  this._beginEditing(row, col, prop, useOriginalValue, suffix);
}

HandsontableAutocompleteEditorClass.prototype._finishEditing = HandsontableTextEditorClass.prototype.finishEditing;

HandsontableAutocompleteEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (this.isMenuExpanded() && this.typeahead.$menu.find('.active').length && !isCancelled) {
    this.typeahead.select();
  }
  this._finishEditing(isCancelled, ctrlDown);
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
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, value, cellProperties) {
  var i
    , j;

  if (!instance.autocompleteEditor) {
    instance.autocompleteEditor = new HandsontableAutocompleteEditorClass(instance);
  }

  instance.autocompleteEditor.isCellEdited = false;
  instance.autocompleteEditor.originalValue = value;

  var typeahead = instance.autocompleteEditor.typeahead;

  typeahead.select = function () {
    var output = this.hide(); //need to hide it before destroyEditor, because destroyEditor checks if menu is expanded
    instance.destroyEditor(true);
    if (typeof cellProperties.onSelect === 'function') {
      cellProperties.onSelect(row, col, prop, this.$menu.find('.active').attr('data-value'), this.$menu.find('.active').index());
    }
    else {
      instance.setDataAtCell(row, prop, this.$menu.find('.active').attr('data-value'));
    }
    return output;
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
  instance.$table.on('keydown.editor', function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!instance.autocompleteEditor.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          instance.autocompleteEditor.beginEditing(row, col, prop);
        }
      }
      else if (event.keyCode === 113) { //f2
        instance.autocompleteEditor.beginEditing(row, col, prop, true); //show edit field
        event.stopPropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
      }
      else if (event.keyCode === 13 && instance.getSettings().enterBeginsEditing) { //enter
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
      }
    }
  });

  function onDblClick() {
    instance.autocompleteEditor.beginEditing(row, col, prop, true);
    setTimeout(function () { //otherwise is misaligned in IE9
      instance.autocompleteEditor.typeahead.lookup();
    }, 1);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  var destroyer = function (isCancelled) {
    instance.autocompleteEditor.finishEditing(isCancelled);
  }

  return destroyer;
};