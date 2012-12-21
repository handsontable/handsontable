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
    , i
    , dontHide = false;

  if (!typeahead) {
    keyboardProxy.typeahead(cellProperties.options || {});
    typeahead = keyboardProxy.data('typeahead');
    typeahead._show = typeahead.show;
    typeahead._hide = typeahead.hide;
    typeahead._render = typeahead.render;
    typeahead._highlighter = typeahead.highlighter;
  }
  else {
    if (cellProperties.options) {
      /* overwrite typeahead options (most importantly `items`) */
      for (i in cellProperties) {
        if (cellProperties.hasOwnProperty(i)) {
          typeahead.options[i] = cellProperties.options[i];
        }
      }
    }
    typeahead.$menu.off(); //remove previous typeahead bindings
    keyboardProxy.off(); //remove previous typeahead bindings. Removing this will cause prepare to register 2 keydown listeners in typeahead
    typeahead.listen(); //add typeahead bindings
  }

  typeahead.minLength = 0;
  typeahead.highlighter = typeahead._highlighter;

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
    if (!cellProperties.strict) {
      this.$menu.find('li:eq(0)').removeClass('active');
    }
    return this;
  };

  /* overwrite typeahead methods (matcher, sorter, highlighter, updater, etc) if provided in cellProperties */
  for (i in cellProperties) {
    if (cellProperties.hasOwnProperty(i)) {
      typeahead[i] = cellProperties[i];
    }
  }

  var wasDestroyed = false;

  keyboardProxy.on("keydown.editor", function (event) {
    switch (event.keyCode) {
      case 27: /* ESC */
        dontHide = false;
        break;

      case 37: /* arrow left */
      case 39: /* arrow right */
      case 38: /* arrow up */
      case 40: /* arrow down */
      case 9: /* tab */
      case 13: /* return/enter */
        if (!keyboardProxy.parent().hasClass('htHidden')) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
    }
  });

  keyboardProxy.on("keyup.editor", function (event) {
      switch (event.keyCode) {
        case 9: /* tab */
        case 13: /* return/enter */
          if (!wasDestroyed && !isAutoComplete(keyboardProxy)) {
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
          if (!wasDestroyed && !Handsontable.helper.isPrintableChar(event.keyCode)) { //otherwise Del or F12 would open suggestions list
            event.stopImmediatePropagation();
          }
      }
    }
  );

  var textDestroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);

  function onDblClick() {
    keyboardProxy[0].focus();
    texteditor.beginEditing(instance, null, row, col, prop, keyboardProxy, true);
    dontHide = true;
    setTimeout(function () { //otherwise is misaligned in IE9
      keyboardProxy.data('typeahead').lookup();
    }, 1);
  }

  instance.view.wt.update('onCellDblClick', onDblClick); //no need to destroy it here because it will be destroyed by TextEditor destroyer

  var destroyer = function (isCancelled) {
    wasDestroyed = true;
    keyboardProxy.off(); //remove typeahead bindings
    textDestroyer(isCancelled);
    dontHide = false;
    if (isAutoComplete(keyboardProxy)) {
      isAutoComplete(keyboardProxy).hide();
    }
  };

  return destroyer;
};