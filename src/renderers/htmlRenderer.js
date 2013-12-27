(function (Handsontable) {

  function HtmlRenderer(instance, TD, row, col, prop, value, cellProperties){

    Handsontable.renderers.cellDecorator.apply(this, arguments);

    Handsontable.Dom.fastInnerHTML(TD, value);
  }

  Handsontable.renderers.registerRenderer('html', HtmlRenderer);
  Handsontable.renderers.HtmlRenderer = HtmlRenderer;

})(Handsontable);
