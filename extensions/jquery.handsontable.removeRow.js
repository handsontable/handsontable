(function ($) {
  "use strict";

  /**
   * Handsontable RemoveRow extension. See `demo/buttons.html` for example usage
   */
  Handsontable.PluginHooks.push('walkontableConfig', function (walkontableConfig) {
    var instance = this;

    var getButton = function (td) {
      return $(td).parents('tr').find('th.htRemoveRow:eq(0) .btn');
    };

    instance.rootElement.on('mouseover', 'tbody th, tbody td', function () {
      getButton(this).show();
    });
    instance.rootElement.on('mouseout', 'tbody th, tbody td', function () {
      getButton(this).hide();
    });

    instance.rootElement.addClass('htRemoveRow');

    if(!walkontableConfig.rowHeaders) {
      walkontableConfig.rowHeaders = [];
    }
    walkontableConfig.rowHeaders.unshift(function(row, elem){
      if(elem.nodeName == 'COL') {
        $(elem).addClass('htRemoveRow');
        return;
      }

      var $div = $('<div class="btn">x</div>');
      $div.on('mouseup', function(){
        instance.alter("remove_row", row);
      });

      var $th = $(elem);
      $th.addClass('htRemoveRow htNoFrame').html($div);
    });
  });
})(jQuery);