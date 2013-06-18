(function ($) {
  "use strict";

  /**
   * Handsontable RemoveRow extension. See `demo/buttons.html` for example usage
   * See `.../test/jasmine/spec/extensions/removeRowSpec.js` for tests
   */
  Handsontable.PluginHooks.add('beforeInitWalkontable', function (walkontableConfig) {
    var instance = this;

    if (instance.getSettings().removeRowPlugin) {

      var getButton = function (td) {
        return $(td).parent('tr').find('th.htRemoveRow').eq(0).find('.btn');
      };

      instance.rootElement.on('mouseover', 'tbody th, tbody td', function () {
        getButton(this).show();
      });
      instance.rootElement.on('mouseout', 'tbody th, tbody td', function () {
        getButton(this).hide();
      });

      instance.rootElement.addClass('htRemoveRow');

      walkontableConfig.rowHeaders.unshift(function (row, elem) {
        var child
          , div;
        while (child = elem.lastChild) {
          elem.removeChild(child);
        }
        elem.className = 'htNoFrame htRemoveRow';
        if (row > -1) {
          div = document.createElement('div');
          div.className = 'btn';
          div.appendChild(document.createTextNode('x'));
          elem.appendChild(div);

          $(div).on('mouseup', function () {
            instance.alter("remove_row", row);
          });
        }
      });

    }
  });
})(jQuery);