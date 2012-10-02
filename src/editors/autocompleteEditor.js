var priv = {
  lastAutoComplete: null,
  lastChange: null
};

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

Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, keyboardProxy, editorOptions) {
  var typeahead = keyboardProxy.data('typeahead');
  if (!typeahead) {
    keyboardProxy.typeahead({
      updater: function (item) {
        priv.lastAutoComplete = item;
        return item
      }
    });
    typeahead = keyboardProxy.data('typeahead');
  }
  typeahead.source = editorOptions.autoComplete.source(row, col);
  typeahead.highlighter = editorOptions.autoComplete.highlighter || defaultAutoCompleteHighlighter;

  keyboardProxy.on("keydown.editor", function (event) {
    switch (event.keyCode) {
      case 38: /* arrow up */
      case 40: /* arrow down */
      case 9: /* tab */
      case 13: /* return/enter */
        if (isAutoComplete(keyboardProxy)) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
        break;
    }
  });

  keyboardProxy.on('change.editor', function () {
    if (isAutoComplete(keyboardProxy)) { //could this change be from autocomplete
      var val = keyboardProxy.val();
      if (val !== priv.lastChange && val === priv.lastAutoComplete) { //is it change from source (don't trigger on partial)
        texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
      }
      priv.lastChange = val;
    }
  });

  function onDblClick(event) {
    keyboardProxy.data('typeahead').lookup();
    event.stopImmediatePropagation();
  }

  $(td).on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  var destroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, editorOptions);


  return function () {
    destroyer();

    if (isAutoComplete(keyboardProxy) && isAutoComplete(keyboardProxy).shown) {
      isAutoComplete(keyboardProxy).hide();
    }
  }
};