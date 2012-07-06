/**
 * Handsontable RowHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
handsontable.RowHeader = function (instance, labels) {
  var that = this;
  this.className = 'htRowHeader';
  that.instance.blockedCols.main.on('mousedown', 'th.htRowHeader', function (event) {
    if (!$(event.target).hasClass('btn') && !$(event.target).hasClass('btnContainer')) {
      that.instance.deselectCell();
      $(this).addClass('active');
      that.lastActive = this;
      var offset = that.instance.blockedCols.count();
      that.instance.selectCell(this.parentNode.rowIndex - offset, 0, this.parentNode.rowIndex - offset, that.instance.colCount - 1, false);
    }
  });
  that.instance.container.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.labels = labels;
};

/**
 * Return custom row label or automatically generate one
 * @param {Number} index Row index
 * @return {String}|{Number}
 */
handsontable.RowHeader.prototype.columnLabel = function (index) {
  if (this.labels[index]) {
    return this.labels[index];
  }
  return index + 1;
};

/**
 * Remove current highlight of a currently selected row header
 */
handsontable.RowHeader.prototype.deselect = function () {
  if (this.lastActive) {
    $(this.lastActive).removeClass('active');
    this.lastActive = null;
  }
};