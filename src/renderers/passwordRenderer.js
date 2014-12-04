(function(Handsontable){

  'use strict';

  var PasswordRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);

    value = TD.innerHTML;

    var hash;
    var hashLength = cellProperties.hashLength || value.length;
    var hashSymbol = cellProperties.hashSymbol || '*';

    for (hash = ''; hash.split(hashSymbol).length - 1 < hashLength; hash += hashSymbol) {}

    Handsontable.Dom.fastInnerHTML(TD, hash);

  };

  Handsontable.PasswordRenderer = PasswordRenderer;
  Handsontable.renderers.PasswordRenderer = PasswordRenderer;
  Handsontable.renderers.registerRenderer('password', PasswordRenderer);

})(Handsontable);
