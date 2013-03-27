/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.TextRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  var escaped = Handsontable.helper.stringify(value);
  if (escaped.match(/\n/)) {
    escaped = escaped.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
    TD.innerHTML = escaped.replace(/\n/g, '<br/>');
  }
  else {
    Handsontable.helper.empty(TD); //TODO identify under what circumstances this line can be removed
    TD.appendChild(document.createTextNode(escaped));
    //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
};