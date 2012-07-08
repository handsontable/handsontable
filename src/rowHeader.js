/**
 * Handsontable RowHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
handsontable.RowHeader = function (instance, labels) {
  var that = this;
  this.className = 'htRowHeader';
  instance.blockedCols.main.on('mousedown', 'th.htRowHeader', function (event) {
    if (!$(event.target).hasClass('btn') && !$(event.target).hasClass('btnContainer')) {
      instance.deselectCell();
      $(this).addClass('active');
      that.lastActive = this;
      var offset = instance.blockedRows.count();
      instance.selectCell(this.parentNode.rowIndex - offset, 0, this.parentNode.rowIndex - offset, instance.colCount - 1, false);
    }
  });
  instance.container.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.labels = labels;
  this.instance = instance;
  instance.blockedCols.addHeader(this);
};

/**
 * Return custom row label or automatically generate one
 * @param {Number} index Row index
 * @return {String}|{Number}
 */
handsontable.RowHeader.prototype.columnLabel = function (index) {
  if (this.labels[index]) {
    return '&nbsp;<span class="small">' + this.labels[index] + '</span>&nbsp;';
  }
  return '&nbsp;<span class="small">' + (index + 1) + '</span>&nbsp;';
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

/**
 *
 */
handsontable.RowHeader.prototype.destroy = function () {
  this.instance.blockedCols.destroyHeader(this.className);
};