function WalkontableWheel(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;

  if (instance.getSetting('scrollbarModelV') === 'native' || instance.getSetting('scrollbarModelH') === 'native') {
    return;
  }

  $(this.instance.wtTable.TABLE).on('mousewheel', function (event, delta, deltaX, deltaY) {
    clearTimeout(that.instance.wheelTimeout);
    that.instance.wheelTimeout = setTimeout(function () { //timeout is needed because with fast-wheel scrolling mousewheel event comes dozen times per second
      if (deltaY) {
        //ceil is needed because jquery-mousewheel reports fractional mousewheel deltas on touchpad scroll
        //see http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
        if (that.instance.wtScrollbars.vertical.visible) { // if we see scrollbar
          that.instance.scrollVertical(-Math.ceil(deltaY)).draw();
        }
      }
      else if (deltaX) {
        if (that.instance.wtScrollbars.horizontal.visible) { // if we see scrollbar
          that.instance.scrollHorizontal(Math.ceil(deltaX)).draw();
        }
      }
    }, 0);
    event.preventDefault();
  });
}