var clonableTEXT = document.createElement('DIV');
clonableTEXT.className = 'htAutocomplete';

var clonableARROW = document.createElement('DIV');
clonableARROW.className = 'htAutocompleteArrow';
clonableARROW.appendChild(document.createTextNode('\u25BC'));
//this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips

/**
 * Autocomplete renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  var TEXT = clonableTEXT.cloneNode(false); //this is faster than createElement
  var ARROW = clonableARROW.cloneNode(true); //this is faster than createElement

  if (!instance.acArrowListener) {
    //not very elegant but easy and fast
    instance.acArrowListener = function () {
      instance.view.wt.getSetting('onCellDblClick');
    };
    instance.rootElement.on('mouseup', '.htAutocompleteArrow', instance.acArrowListener); //this way we don't bind event listener to each arrow. We rely on propagation instead
  }

  Handsontable.TextRenderer(instance, TEXT, row, col, prop, value, cellProperties);

  if (!TEXT.firstChild) { //http://jsperf.com/empty-node-if-needed
    //otherwise empty fields appear borderless in demo/renderers.html (IE)
    TEXT.appendChild(document.createTextNode('\u00A0')); //\u00A0 equals &nbsp; for a text node
    //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  TEXT.appendChild(ARROW);
  instance.view.wt.wtDom.empty(TD); //TODO identify under what circumstances this line can be removed
  TD.appendChild(TEXT);
};