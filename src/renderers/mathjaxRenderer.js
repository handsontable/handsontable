/**
 * Math cell renderer using MathJax
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

  var MathjaxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    var syntax = cellProperties.syntax || "";
    if (syntax) {
      var $math = $('<script>');
      $math.attr('type', 'math/'+syntax);
      $math.text(value);
      $(TD).empty().append($math);
    } else {
      $(TD).empty().text(value);
    }
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, TD]);
    return TD;
  };

  Handsontable.renderers.MathjaxRenderer = MathjaxRenderer;
  Handsontable.renderers.registerRenderer('mathjax', MathjaxRenderer);

})(Handsontable);