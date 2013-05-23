function WalkontableWheel(instance) {
  if (instance.getSetting('scrollbarModelV') === 'native' || instance.getSetting('scrollbarModelH') === 'native') {
    return;
  }

  $(instance.wtTable.TABLE).on('mousewheel', function (event, delta, deltaX, deltaY) {
    if (deltaY > 0 && instance.getSetting('offsetRow') === 0) {
      return; //attempt to scroll up when it's already showing first row
    }
    else if (deltaY < 0 && instance.wtTable.isLastRowFullyVisible()) {
      return; //attempt to scroll down when it's already showing last row
    }
    else if (deltaX < 0 && instance.getSetting('offsetColumn') === 0) {
      return; //attempt to scroll left when it's already showing first column
    }
    else if (deltaX > 0 && instance.wtTable.isLastColumnFullyVisible()) {
      return; //attempt to scroll right when it's already showing last column
    }

    //now we are sure we really want to scroll
    clearTimeout(instance.wheelTimeout);
    instance.wheelTimeout = setTimeout(function () { //timeout is needed because with fast-wheel scrolling mousewheel event comes dozen times per second
      if (deltaY) {
        //ceil is needed because jquery-mousewheel reports fractional mousewheel deltas on touchpad scroll
        //see http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
        if (instance.wtScrollbars.vertical.visible) { // if we see scrollbar
          instance.scrollVertical(-Math.ceil(deltaY)).draw();
        }
      }
      else if (deltaX) {
        if (instance.wtScrollbars.horizontal.visible) { // if we see scrollbar
          instance.scrollHorizontal(Math.ceil(deltaX)).draw();
        }
      }
    }, 0);

    event.preventDefault();
  });
}