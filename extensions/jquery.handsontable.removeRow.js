(function ($) {
  "use strict";
  /**
   * Handsontable RemoveRow extension. See `demo/buttons.html` for example usage
   * @param {Object} instance
   * @param {Array|Boolean} [labels]
   */
  Handsontable.extension.RemoveRow = function (instance, labels) {
    var that = this;
    this.priority = 1;
    this.className = 'htRemoveRow htNoFrame';
    this.instance = instance;
    this.labels = labels;

    instance.blockedCols.main.on('mousedown', 'th.htRemoveRow .btn', function () {
      instance.alter("remove_row", $(this).parents('tr').index());
    });
    instance.container.on('mouseover', 'tbody th, tbody td', function () {
      that.getButton(this).show();
    });
    instance.container.on('mouseout', 'tbody th, tbody td', function () {
      that.getButton(this).hide();
    });

    instance.blockedCols.addHeader(this);
    instance.container.addClass('htRemoveRow');
  };

  /**
   * Return custom row label or automatically generate one
   * @param {Number} index Row index
   * @return {String}
   */
  Handsontable.extension.RemoveRow.prototype.columnLabel = function (index) {
    return '<div class="btn">x</div>';
  };

  /**
   * Return button object for a given TD or TH
   * @param {Element} td
   * @return {jQuery}
   */
  Handsontable.extension.RemoveRow.prototype.getButton = function (td) {
    return this.instance.blockedCols.main.find('th.htRemoveRow .btn').eq($(td.parentNode).index());
  };
})(jQuery);