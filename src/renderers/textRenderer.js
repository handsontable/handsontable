/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} rendererOptions Render options
 */
Handsontable.TextRenderer = function (instance, td, row, col, prop, value, rendererOptions) {
  if (typeof rendererOptions === "undefined") {
    rendererOptions = {};
  }
  var escaped = Handsontable.helper.stringify(value);
  if (!rendererOptions.allowHtml) {
    escaped = escaped.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
  }
  td.innerHTML = escaped.replace(/\n/g, '<br/>');
  return td;
};