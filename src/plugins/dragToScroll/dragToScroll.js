/**
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of visible viewport
 * @constructor
 */
function DragToScroll() {
  this.boundaries = null;
  this.callback = null;
}

/**
 * @param boundaries {Object} compatible with getBoundingClientRect
 */
DragToScroll.prototype.setBoundaries = function (boundaries) {
  this.boundaries = boundaries;
};

/**
 * @param callback {Function}
 */
DragToScroll.prototype.setCallback = function (callback) {
  this.callback = callback;
};

/**
 * Check if mouse position (x, y) is outside of the viewport
 * @param x
 * @param y
 */
DragToScroll.prototype.check = function (x, y) {
  var diffX = 0;
  var diffY = 0;

  if (y < this.boundaries.top) {
    //y is less than top
    diffY = y - this.boundaries.top;
  }
  else if (y > this.boundaries.bottom) {
    //y is more than bottom
    diffY = y - this.boundaries.bottom;
  }

  if (x < this.boundaries.left) {
    //x is less than left
    diffX = x - this.boundaries.left;
  }
  else if (x > this.boundaries.right) {
    //x is more than right
    diffX = x - this.boundaries.right;
  }

  this.callback(diffX, diffY);
};

var listening = false;
var dragToScroll;
var instance;

if (typeof Handsontable !== 'undefined') {
  var setupListening = function (instance) {
    var scrollHandler = instance.view.wt.wtScrollbars.vertical.scrollHandler; //native scroll
    dragToScroll = new DragToScroll();
    if (scrollHandler === window) {
      //not much we can do currently
      return;
    }
    else if (scrollHandler) {
      dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
    }
    else {
      dragToScroll.setBoundaries(instance.$table[0].getBoundingClientRect());
    }

    dragToScroll.setCallback(function (scrollX, scrollY) {
      if (scrollX < 0) {
        if (scrollHandler) {
          scrollHandler.scrollLeft -= 50;
        }
        else {
          instance.view.wt.scrollHorizontal(-1).draw();
        }
      }
      else if (scrollX > 0) {
        if (scrollHandler) {
          scrollHandler.scrollLeft += 50;
        }
        else {
          instance.view.wt.scrollHorizontal(1).draw();
        }
      }

      if (scrollY < 0) {
        if (scrollHandler) {
          scrollHandler.scrollTop -= 20;
        }
        else {
          instance.view.wt.scrollVertical(-1).draw();
        }
      }
      else if (scrollY > 0) {
        if (scrollHandler) {
          scrollHandler.scrollTop += 20;
        }
        else {
          instance.view.wt.scrollVertical(1).draw();
        }
      }
    });

    listening = true;
  };

  Handsontable.PluginHooks.add('afterInit', function () {
    $(document).on('mouseup.' + this.guid, function () {
      listening = false;
    });

    $(document).on('mousemove.' + this.guid, function (event) {
      if (listening) {
        dragToScroll.check(event.clientX, event.clientY);
      }
    });
  });

  Handsontable.PluginHooks.add('destroy', function () {
    $(document).off('.' + this.guid);
  });

  Handsontable.PluginHooks.add('afterOnCellMouseDown', function () {
    setupListening(this);
  });

  Handsontable.PluginHooks.add('afterOnCellCornerMouseDown', function () {
    setupListening(this);
  });
}
