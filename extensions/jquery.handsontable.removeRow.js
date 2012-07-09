/**
 * Handsontable RemoveRow extension. See `demo/buttons.html` for example usage
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
handsontable.extension.RemoveRow = function (instance, labels) {
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

  this.$style = $('\
    <style type="text/css">\
      .dataTable.htRemoveRow table {\
        border-left-width: 0;\
      }\
      \
      .dataTable.htRemoveRow th.htRemoveRow {\
        background-color: white;\
        border-bottom: 1px solid #FFF;\
        border-left: 1px solid #FFF;\
        border-right: 1px solid #FFF;\
        min-width: 15px;\
      }\
      \
      .dataTable.htRemoveRow th.htRemoveRow div.minWidthProblemFix {\
        width: 15px;\
      }\
      \
      .dataTable.htRemoveRow tr:first-child th.htRemoveRow,\
      .dataTable.htRemoveRow tr:first-child td.htRemoveRow {\
       border-top: 1px solid #FFF;\
      }\
      \
      .dataTable.htRemoveRow th.htRemoveRow .btn {\
        background-color: #BBB;\
        border-radius: 9px;\
        padding: 0 4px 0 4px;\
        color: #FFF;\
        cursor: pointer;\
        font-size: 12px;\
        font-weight: bold;\
        display: none;\
      }\
      \
      .dataTable.htRemoveRow th.htRemoveRow .btn:hover {\
        background-color: #777;\
      }\
    </style>\
  ');
  $('head').append(this.$style);
  instance.container.addClass('htRemoveRow');
};

/**
 * Return custom row label or automatically generate one
 * @param {Number} index Row index
 * @return {String}
 */
handsontable.extension.RemoveRow.prototype.columnLabel = function (index) {
  return '<div class="btn">x</div>';
};

/**
 * Return button object for a given TD or TH
 * @param {Element} td
 * @return {jQuery}
 */
handsontable.extension.RemoveRow.prototype.getButton = function (td) {
  return this.instance.blockedCols.main.find('th.htRemoveRow .btn').eq($(td.parentNode).index());
};