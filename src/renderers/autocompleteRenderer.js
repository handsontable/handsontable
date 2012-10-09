/**
 * Autocomplete renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} rendererOptions Render options
 */
Handsontable.AutocompleteRenderer = function (instance, td, row, col, prop, value, rendererOptions) {
  var $td = $(td);
  var $text = $('<div class="htAutocomplete"></div>');
  var $arrow = $('<div class="htAutocompleteArrow">&#x25BC;</div>');
  $arrow.mouseup(function(){
    $td.triggerHandler('dblclick.editor');
  });

  Handsontable.TextRenderer(instance, $text[0], row, col, prop, value, rendererOptions);

  if($text.html() === '') {
    $text.html('&nbsp;');
  }

  $text.append($arrow);
  $td.empty().append($text);

  return td;
};