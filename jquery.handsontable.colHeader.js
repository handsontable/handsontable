/**
 * Handsontable ColHeader extension
 * @param {Object} instance
 */
handsontable.ColHeader = function (instance, labels) {
  var that = this;
  this.className = 'htColHeader';
  this.instance = instance;
  setTimeout(function () {
    that.instance.blockedRows.main.on('mousedown', '.htColHeader', function () {
      that.instance.deselectCell();
      var $th = $(this);
      $th.addClass('active');
      that.lastActive = this;
      var index = $th.index();
      var offset = instance.blockedCols ? instance.blockedCols.count() : 0;
      that.instance.selectCell(0, index - offset, that.instance.rowCount - 1, index - offset, false);
    });
    that.instance.container.on('deselect.handsontable', function () {
      that.deselect();
    });
  }, 1);
  this.labels = labels;
};

/**
 * Return custom column label or automatically generate one
 * @param {Number} index Row index
 * @return {String}|{Number}
 */
handsontable.ColHeader.prototype.columnLabel = function (index) {
  if (this.labels[index]) {
    return this.labels[index];
  }
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26);
  }
  return columnLabel;
};

/**
 * Remove current highlight of a currently selected column header
 */
handsontable.ColHeader.prototype.deselect = handsontable.RowHeader.prototype.deselect;