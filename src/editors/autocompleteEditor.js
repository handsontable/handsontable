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
    keyboardProxy.typeahead();
    typeahead = keyboardProxy.data('typeahead');
  }
  typeahead.source = editorOptions.autoComplete.source(row, col);
  typeahead.highlighter = editorOptions.autoComplete.highlighter || defaultAutoCompleteHighlighter;

  var oneChange = function () {
    if (isAutoComplete(keyboardProxy)) {
      isAutoComplete(keyboardProxy).hide();
    }
    var ev = $.Event('keydown');
    ev.keyCode = event.keyCode;
    keyboardProxy.trigger(ev);
  };

  keyboardProxy.on("keydown.editor", function (event) {
      switch (event.keyCode) {
        case 38: /* arrow up */
        case 40: /* arrow down */
        case 9: /* tab */
        case 13: /* return/enter */
          if (isAutoComplete(keyboardProxy)) {
            if (event.keyCode === 9 || event.keyCode === 13) {
              keyboardProxy.one('change.editor', oneChange);
            }
            event.stopImmediatePropagation();
          }
          event.preventDefault();
          break;
      }
    }
  );

  var textDestroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, editorOptions);

  keyboardProxy.data("typeahead").$menu.off('click.editor', 'li').on('click.editor', 'li', function(){
    setTimeout(function(){
      destroyer();
    }, 1);
  });

  function onDblClick() {
    keyboardProxy.data('typeahead').lookup();
  }

  $(td).on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  var destroyer = function () {
    textDestroyer();
    typeahead.source = [];
    if (isAutoComplete(keyboardProxy) && isAutoComplete(keyboardProxy).shown) {
      isAutoComplete(keyboardProxy).hide();
    }
  };

  return destroyer;
};