/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter() {
}

WalkontableRowFilter.prototype = new WalkontableAbstractFilter();

WalkontableRowFilter.prototype.readSettings = function (instance) {
  this.instace = instance;
  if (instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    this.offset = 0;
  }
  else {
    this.offset = instance.wtSettings.settings.offsetRow;
  }
  this.total = instance.getSetting('totalRows');
  this.fixedCount = instance.getSetting('fixedRowsTop');
};