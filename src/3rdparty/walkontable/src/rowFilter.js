/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter() {
}

WalkontableRowFilter.prototype = new WalkontableCellFilter();

WalkontableRowFilter.prototype.readSettings = function (instance) {
  this.offset = instance.wtSettings.settings.offsetRow;
  this.total = instance.getSetting('totalRows');
  this.fixedCount = instance.getSetting('fixedRowsTop');
};