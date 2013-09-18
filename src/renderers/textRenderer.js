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
  if (!value && cellProperties.placeholder) {
    value = cellProperties.placeholder;
    instance.view.wt.wtDom.addClass(TD, 'htPlaceholder');
  }
  var escaped = Handsontable.helper.stringify(value);

  if (cellProperties.rendererTemplate) {
    instance.view.wt.wtDom.empty(TD);
    var TEMPLATE = document.createElement('TEMPLATE');
    TEMPLATE.setAttribute('bind', '{{}}');
    TEMPLATE.innerHTML = cellProperties.rendererTemplate;
    HTMLTemplateElement.decorate(TEMPLATE);
    TEMPLATE.model = instance.getDataAtRow(row);
    TD.appendChild(TEMPLATE);
  }
  else {
    instance.view.wt.wtDom.fastInnerText(TD, escaped); //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  if (cellProperties.readOnly) {
    instance.view.wt.wtDom.addClass(TD, 'htDimmed');
  }
  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    instance.view.wt.wtDom.addClass(TD, cellProperties.invalidCellClassName);
  }
};