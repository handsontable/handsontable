function WalkontableScrollbars(instance) {
  if(instance.getSetting('scrollbarModelV') === 'native') {
    instance.update('scrollbarModelH', 'none');
  }

  switch (instance.getSetting('scrollbarModelV')) {
    case 'dragdealer':
      this.vertical = new WalkontableVerticalScrollbar(instance);
      break;

    case 'native':
      this.vertical = new WalkontableVerticalScrollbarNative(instance);
      break;
  }

  switch (instance.getSetting('scrollbarModelH')) {
    case 'dragdealer':
      this.horizontal = new WalkontableHorizontalScrollbar(instance);
      break;

    case 'native':
      this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
      break;
  }
}

WalkontableScrollbars.prototype.destroy = function () {
  this.vertical && this.vertical.destroy();
  this.horizontal && this.horizontal.destroy();
};

WalkontableScrollbars.prototype.refresh = function () {
  this.horizontal && this.horizontal.readSettings();
  this.vertical && this.vertical.readSettings();
  this.horizontal && this.horizontal.prepare();
  this.vertical && this.vertical.prepare();
  this.horizontal && this.horizontal.refresh();
  this.vertical && this.vertical.refresh();
};