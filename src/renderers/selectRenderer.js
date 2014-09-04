(function(Handosntable){

  'use strict';

  var SelectRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
        if (!(value == null || value == "")){
            var txtValue = value;

            for (var i = 0; i < cellProperties.selectOptions.length; i++) {
                if (cellProperties.selectOptions[i][cellProperties.selectKey] == value) {
                    txtValue = cellProperties.selectOptions[i][cellProperties.selectText];
                    break;
                }
            }
        }
        
        Handsontable.renderers.TextRenderer(instance, TD, row, col, prop, txtValue, cellProperties);
  };

  Handosntable.SelectRenderer = SelectRenderer;
  Handosntable.renderers.SelectRenderer = SelectRenderer;
  Handosntable.renderers.registerRenderer('select', SelectRenderer);

})(Handsontable);
