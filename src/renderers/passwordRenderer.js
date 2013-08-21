(function(Handosntable){
  Handsontable.PasswordRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    Handsontable.TextRenderer.apply(this, arguments);

    value = TD.innerHTML;

    var hash;
    var hashLength = cellProperties.hashLength || value.length;
    var hashSymbol = cellProperties.hashSymbol || '*';

    for( hash = ''; hash.length < hashLength; hash += hashSymbol);

    instance.view.wt.wtDom.fastInnerText(TD, hash);

  };
})(Handsontable);