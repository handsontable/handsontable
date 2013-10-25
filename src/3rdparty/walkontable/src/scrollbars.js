function WalkontableScrollbars(instance) {
  switch (instance.getSetting('nativeScrollbars')) {
    case false:
      this.vertical = new WalkontableVerticalScrollbar(instance);
      break;

    case true:
      this.vertical = new WalkontableVerticalScrollbarNative(instance);
      break;
  }

  switch (instance.getSetting('nativeScrollbars')) {
    case false:
      this.horizontal = new WalkontableHorizontalScrollbar(instance);
      break;

    case true:
      this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
      break;
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
};