function WalkontableScrollbars(instance) {
  if (instance.getSetting('nativeScrollbars')) {
    instance.update('scrollbarWidth', walkontableGetScrollbarWidth());
    instance.update('scrollbarHeight', walkontableGetScrollbarWidth());
    this.vertical = new WalkontableVerticalScrollbarNative(instance);
    this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
    this.corner = new WalkontableCornerScrollbarNative(instance);
  }
  else {
    this.vertical = new WalkontableVerticalScrollbar(instance);
    this.horizontal = new WalkontableHorizontalScrollbar(instance);
  }
}

WalkontableScrollbars.prototype.destroy = function () {
  this.vertical && this.vertical.destroy();
  this.horizontal && this.horizontal.destroy();
};

WalkontableScrollbars.prototype.refresh = function (selectionsOnly) {
  this.horizontal && this.horizontal.readSettings();
  this.vertical && this.vertical.readSettings();
  this.horizontal && this.horizontal.prepare();
  this.vertical && this.vertical.prepare();
  this.horizontal && this.horizontal.refresh(selectionsOnly);
  this.vertical && this.vertical.refresh(selectionsOnly);
  this.corner && this.corner.refresh(selectionsOnly);
};