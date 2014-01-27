(function () {
  'use strict';

  var SearchResultRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    Handsontable.renderers.TextRenderer.apply(this, arguments);

    if(cellProperties.isSearchResult){
      Handsontable.Dom.addClass(TD, 'htSearchResult');
    } else {
      Handsontable.Dom.removeClass(TD, 'htSearchResult');
    }

  };

  Handsontable.renderers.registerRenderer('search-result', SearchResultRenderer);
  Handsontable.renderers.SearchResultRenderer = SearchResultRenderer;

})();