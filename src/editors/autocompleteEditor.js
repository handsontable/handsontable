function isAutoComplete(keyboardProxy) {
  var typeahead = keyboardProxy.data("typeahead");
  if (typeahead && typeahead.$menu.is(":visible")) {
    return typeahead;
  }
  else {
    return false;
  }
}

/**
 * Copied from bootstrap-typeahead.js for reference
 */
function defaultAutoCompleteHighlighter(item) {
  var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
    return '<strong>' + match + '</strong>';
  })
}

/**
 * Autocomplete editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
  var typeahead = keyboardProxy.data('typeahead')
    , dontHide = false;

  if (!typeahead) {
    keyboardProxy.typeahead();
    typeahead = keyboardProxy.data('typeahead');
  }

  typeahead.minLength = 0;
  typeahead.source = cellProperties.autoComplete.source(row, col);
  typeahead.highlighter = cellProperties.autoComplete.highlighter || defaultAutoCompleteHighlighter;

  if (!typeahead._show) {
    typeahead._show = typeahead.show;
    typeahead._hide = typeahead.hide;
    typeahead._render = typeahead.render;
  }

  typeahead.show = function () {
    if (keyboardProxy.parent().hasClass('htHidden')) {
      return;
    }
    return typeahead._show.call(this);
  };

  typeahead.hide = function () {
    if (!dontHide) {
      dontHide = false; //set to true by dblclick handler, otherwise appears and disappears immediately after double click
      return typeahead._hide.call(this);
    }
  };

  typeahead.lookup = function () {
    var items;
    this.query = this.$element.val();
    items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
    return items ? this.process(items) : this;
  };

  typeahead.matcher = function () {
    return true;
  };

  typeahead.select = function () {
    var val = this.$menu.find('.active').attr('data-value') || keyboardProxy.val();
    destroyer(true);
    instance.setDataAtCell(row, prop, typeahead.updater(val));
    return this.hide();
  };

  typeahead.render = function (items) {
    typeahead._render.call(this, items);
    if (cellProperties.autoComplete.strict) {
      this.$menu.find('li:eq(0)').removeClass('active');
    }
    return this;
  };

  keyboardProxy.on("keydown.editor", function (event) {
    switch (event.keyCode) {
      case 27: /* ESC */
        dontHide = false;
        break;

      case 38: /* arrow up */
      case 40: /* arrow down */
      case 9: /* tab */
      case 13: /* return/enter */
        if (isAutoComplete(keyboardProxy)) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
    }
  });

  keyboardProxy.on("keyup.editor", function (event) {
      switch (event.keyCode) {
        case 9: /* tab */
        case 13: /* return/enter */
          if (!isAutoComplete(keyboardProxy)) {
            var ev = $.Event('keyup');
            ev.keyCode = 113; //113 triggers lookup, in contrary to 13 or 9 which only trigger hide
            keyboardProxy.trigger(ev);
          }
          else {
            setTimeout(function () { //so pressing enter will move one row down after change is applied by 'select' above
              var ev = $.Event('keydown');
              ev.keyCode = event.keyCode;
              keyboardProxy.parent().trigger(ev);
            }, 10);
          }
          break;

        default:
          if (!Handsontable.helper.isPrintableChar(event.keyCode)) { //otherwise Del or F12 would open suggestions list
            event.stopImmediatePropagation();
          }
      }
    }
  );

  var textDestroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);

  function onDblClick() {
    dontHide = true;
    setTimeout(function () { //otherwise is misaligned in IE9
      keyboardProxy.data('typeahead').lookup();
    }, 1);
  }

  $(td).on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  var destroyer = function (isCancelled) {
    textDestroyer(isCancelled);
    typeahead.source = [];
    if (isAutoComplete(keyboardProxy)) {
      isAutoComplete(keyboardProxy).hide();
    }
  };

  return destroyer;
};