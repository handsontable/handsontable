/**
 * Autocomplete renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var $td = $(td);
  var $text = $('<div class="htAutocomplete"></div>');
  var $arrow = $('<div class="htAutocompleteArrow">&#x25BC;</div>');

  $arrow.mousedown(function (event) {
    instance.view.wt.getSetting('onCellDblClick');
    event.stopPropagation(); //otherwise can confuse mousedown handler
  });

  $arrow.mouseup(function (event) {
    event.stopPropagation(); //otherwise can confuse dblclick handler
  });

  Handsontable.TextCell.renderer(instance, $text[0], row, col, prop, value, cellProperties);

  if ($text.html() === '') {
    $text.html('&nbsp;');
  }

  $text.append($arrow);
  $td.empty().append($text);
};