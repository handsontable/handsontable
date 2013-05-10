(function ($) {
  "use strict";

  /**
   * Handsontable RemoveRow extension. See `demo/buttons.html` for example usage
   */
  Handsontable.PluginHooks.add('beforInitWalkontable', function (walkontableConfig) {
    var instance = this;

    if (instance.getSettings().removeRowPlugin) {

      var getButton = function (td) {
        return $(td).parents('tr').find('th.htRemoveRow').eq(0).find('.btn');
      };

      instance.rootElement.on('mouseover', 'tbody th, tbody td', function () {
        getButton(this).show();
      });
      instance.rootElement.on('mouseout', 'tbody th, tbody td', function () {
        getButton(this).hide();
      });

      instance.rootElement.addClass('htRemoveRow');

      walkontableConfig.rowHeaders = function (row, elem) {
        var div = document.createElement('div');
        var child;

        div.className = 'btn';
        div.appendChild(document.createTextNode('x'));

        while (child = elem.lastChild) {
          elem.removeChild(child);
        }

        elem.className = 'htRemoveRow';
        elem.appendChild(div);

        $(div).on('mouseup', function() {
          instance.alter("remove_row", row);
        });
      };

    }
  });
})(jQuery);