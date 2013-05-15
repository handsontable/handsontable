function WalkontableScrollbars(instance) {
  this.vertical = new WalkontableVerticalScrollbar(instance);
  this.horizontal = new WalkontableHorizontalScrollbar(instance);
}

WalkontableScrollbars.prototype.destroy = function () {
  clearInterval(this.vertical.dragdealer.interval);
  clearInterval(this.horizontal.dragdealer.interval);
};

WalkontableScrollbars.prototype.refresh = function () {
  this.horizontal.readSettings();
  this.vertical.readSettings();
  this.horizontal.prepare();
  this.vertical.prepare();
  this.horizontal.refresh();
  this.vertical.refresh();
};