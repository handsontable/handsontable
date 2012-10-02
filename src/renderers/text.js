/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} renderOptions Render options
 */
Handsontable.TextRenderer = function (instance, td, row, col, prop, value, renderOptions) {
  if(typeof renderOptions === "undefined") {
    renderOptions = {};
  }

  var escaped;
  switch (typeof value) {
    case 'string':
      if (!renderOptions.allowHtml) {
        escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
      }
      else {
        escaped = value;
      }
      break;

    case 'number':
      escaped = value + '';
      break;

    case 'object':
      if (value === null) {
        escaped = '';
      }
      break;

    case 'undefined':
      escaped = '';
      break;

    default:
      escaped = value;
  }
  td.innerHTML = escaped.replace(/\n/g, '<br/>');
  return td;
};