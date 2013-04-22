/**
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter() {
  this.countTH = 0;
}

WalkontableColumnFilter.prototype = new WalkontableCellFilter();

WalkontableColumnFilter.prototype.readSettings = function (instance) {
  this.offset = instance.wtSettings.settings.offsetColumn;
  this.total = instance.getSetting('totalColumns');
  this.countTH = instance.hasSetting('rowHeaders') ? 1 : 0;
};

WalkontableColumnFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableColumnFilter.prototype.unOffsettedTH = function (n) {
  return n + this.countTH;
};

WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function (n) {
  return this.visibleColumnToSourceColumn(this.offsettedTH(n));
};

WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function (n) {
  return this.source(this.unOffsetted(this.unFixed(this.unOffsettedTH(n))));
};