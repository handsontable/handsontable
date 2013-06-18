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
  if (Handsontable.helper.isNumeric(value)) {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language)
    }
    value = numeral(value).format(cellProperties.format || '0'); //docs: http://numeraljs.com/
    instance.view.wt.wtDom.addClass(TD, 'htNumeric');
  }
  Handsontable.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
};