/**
 * Numeric cell renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.NumericRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  if (typeof value === 'number') {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language)
    }
    instance.view.wt.wtDom.empty(TD); //TODO identify under what circumstances this line can be removed
    TD.className = 'htNumeric';
    TD.appendChild(document.createTextNode(numeral(value).format(cellProperties.format || '0'))); //docs: http://numeraljs.com/
    //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
    if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
      TD.className = cellProperties.invalidCellClassName;
    }
  }
  else {
    Handsontable.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
  }
};