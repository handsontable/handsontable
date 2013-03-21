function HandsontableAutocompleteEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

inherit(HandsontableAutocompleteEditorClass, HandsontableTextEditorClass);
/**
 * @see HandsontableTextEditorClass.prototype.createElements
 */
HandsontableAutocompleteEditorClass.prototype.createElements = function () {
  HandsontableTextEditorClass.prototype.createElements.apply(this,arguments);

  this.TEXTAREA.typeahead();
  this.typeahead = this.TEXTAREA.data('typeahead');
  this.typeahead._render = this.typeahead.render;
  this.typeahead.minLength = 0;

  this.typeahead.lookup = function () {
    var items;
    this.query = this.$element.val();
    items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
    return items ? this.process(items) : this;
  };

  this.typeahead.matcher = function () {
    return true;
  };
};

/**
 * @see HandsontableTextEditorClass.prototype.bindEvents
 */
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


  HandsontableTextEditorClass.prototype.bindEvents.apply(this,arguments);
};
/**
 * @see HandsontableTextEditorClass.prototype.bindTemporaryEvents
 */
HandsontableAutocompleteEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {
  var that = this
    , i
    , j;

  this.typeahead.select = function () {
    var output = this.hide(); //need to hide it before destroyEditor, because destroyEditor checks if menu is expanded
    that.instance.destroyEditor(true);
    if (typeof cellProperties.onSelect === 'function') {
      cellProperties.onSelect(row, col, prop, this.$menu.find('.active').attr('data-value'), this.$menu.find('.active').index());
    }
    else {
      that.instance.setDataAtRowProp(row, prop, this.$menu.find('.active').attr('data-value'));
    }
    return output;
  };

  this.typeahead.render = function (items) {
    that.typeahead._render.call(this, items);
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
            this.typeahead.options[j] = cellProperties.options[j];
          }
        }
      }
      else {
        this.typeahead[i] = cellProperties[i];
      }
    }
  }

  HandsontableTextEditorClass.prototype.bindTemporaryEvents.apply(this,arguments);

  function onDblClick() {
    that.beginEditing(row, col, prop, true);
    that.instance.registerTimeout('IE9_align_fix', function () { //otherwise is misaligned in IE9
      that.typeahead.lookup();
    }, 1);
  }

  this.instance.view.wt.update('onCellDblClick', onDblClick);
};
/**
 * @see HandsontableTextEditorClass.prototype.finishEditing
 */
HandsontableAutocompleteEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (!isCancelled) {
    if (this.isMenuExpanded() && this.typeahead.$menu.find('.active').length) {
      this.typeahead.select();
      this.isCellEdited = false; //cell value was updated by this.typeahead.select (issue #405)
    }
    else if (this.cellProperties.strict) {
      this.isCellEdited = false; //cell value was not picked from this.typeahead.select (issue #405)
    }
  }

  HandsontableTextEditorClass.prototype.finishEditing.apply(this,arguments);
};

HandsontableAutocompleteEditorClass.prototype.isMenuExpanded = function () {
  if (this.typeahead.$menu.is(":visible")) {
    return this.typeahead;
  }
  else {
    return false;
  }
};

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
  if (!instance.autocompleteEditor) {
    instance.autocompleteEditor = new HandsontableAutocompleteEditorClass(instance);
  }
  instance.autocompleteEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
  return function (isCancelled) {
    instance.autocompleteEditor.finishEditing(isCancelled);
  }
};