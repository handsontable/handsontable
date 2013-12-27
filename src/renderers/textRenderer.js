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
(function (Handsontable) {
  'use strict';

  var TextRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    Handsontable.renderers.cellDecorator.apply(this, arguments);

    if (!value && cellProperties.placeholder) {
      value = cellProperties.placeholder;
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

  };

  //Handsontable.TextRenderer = TextRenderer; //Left for backward compatibility
  Handsontable.renderers.TextRenderer = TextRenderer;
  Handsontable.renderers.registerRenderer('text', TextRenderer);

})(Handsontable);