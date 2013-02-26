/**
 * Numeric cell renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.NumericRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  if (typeof value === 'number') {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language)
    }
    td.innerHTML = numeral(value).format(cellProperties.format || '0'); //docs: http://numeraljs.com/
    td.className = 'htNumeric';
  }
  else {
    Handsontable.TextRenderer(instance, td, row, col, prop, value, cellProperties);
  }
};