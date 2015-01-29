(function(Handosntable){

  'use strict';

  var FormatterRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    
    if (cellProperties.fromJstype !== undefined) {
      if (value !== '') {
        value = cellProperties.fromJstype(value);  
      }
    }

    Handsontable.Dom.addClass(TD, 'htFormatter');
    Handsontable.renderers.TextRenderer(instance, TD, row, col, prop, value, cellProperties);

  };

  Handosntable.FormatterRenderer = FormatterRenderer;
  Handosntable.renderers.FormatterRenderer = FormatterRenderer;
  Handosntable.renderers.registerRenderer('formatter', FormatterRenderer);

})(Handsontable);