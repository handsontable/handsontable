
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {registerPlugin} from './../../plugins.js';

export {DragToScroll};

//registerPlugin('dragToScroll', DragToScroll);

Handsontable.plugins.DragToScroll = DragToScroll;

/**
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of visible viewport
 * @constructor
 */
function DragToScroll() {
  this.boundaries = null;
  this.callback = null;
}
//
//DragToScroll.prototype.beforeInit = function(hotInstance) {
//  var _this = this;
//
//  this.hot = hotInstance;
//
//  var setupListening = function () {
//    this.dragToScrollListening = false;
//
//    var scrollHandler = this.view.wt.wtScrollbars.vertical.scrollHandler; //native scroll
//
//    if (scrollHandler === window) {
//      //not much we can do currently
//      return;
//    }
//    else {
//      _this.setBoundaries(scrollHandler.getBoundingClientRect());
//    }
//    _this.setCallback(function (scrollX, scrollY) {
//
//      if (scrollX < 0) {
//        scrollHandler.scrollLeft -= 50;
//      }
//      else if (scrollX > 0) {
//        scrollHandler.scrollLeft += 50;
//      }
//
//      if (scrollY < 0) {
//        scrollHandler.scrollTop -= 20;
//      }
//      else if (scrollY > 0) {
//        scrollHandler.scrollTop += 20;
//      }
//    });
//    this.dragToScrollListening = true;
//  };
//
//  Handsontable.hooks.add('afterInit', function () {
//    var eventManager = eventManagerObject(this);
//
//    eventManager.addEventListener(document, 'mouseup', function () {
//      _this.hot.dragToScrollListening = false;
//    });
//
//    eventManager.addEventListener(document, 'mousemove', function () {
//      if (_this.hot.dragToScrollListening) {
//        _this.check(event.clientX, event.clientY);
//      }
//    });
//  });
//
//  Handsontable.hooks.add('afterDestroy', function () {
//    eventManagerObject(this).clear();
//  });
//
//  Handsontable.hooks.add('afterOnCellMouseDown', setupListening);
//  Handsontable.hooks.add('afterOnCellCornerMouseDown', setupListening);
//};

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

var dragToScroll;
var instance;

if (typeof Handsontable !== 'undefined') {
  var setupListening = function (instance) {
    instance.dragToScrollListening = false;
    var scrollHandler = instance.view.wt.wtScrollbars.vertical.scrollHandler; //native scroll
    dragToScroll = new DragToScroll();
    if (scrollHandler === window) {
      //not much we can do currently
      return;
    }
    else {
      dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
    }

    dragToScroll.setCallback(function (scrollX, scrollY) {
      if (scrollX < 0) {
          scrollHandler.scrollLeft -= 50;
      }
      else if (scrollX > 0) {
          scrollHandler.scrollLeft += 50;
      }

      if (scrollY < 0) {
          scrollHandler.scrollTop -= 20;
      }
      else if (scrollY > 0) {
          scrollHandler.scrollTop += 20;
      }
    });

    instance.dragToScrollListening = true;
  };

  Handsontable.hooks.add('afterInit', function () {
    var instance = this;
    var eventManager = Handsontable.eventManager(this);

    eventManager.addEventListener(document,'mouseup', function () {
      instance.dragToScrollListening = false;
    });

    eventManager.addEventListener(document,'mousemove', function () {
      if (instance.dragToScrollListening) {
        dragToScroll.check(event.clientX, event.clientY);
      }
    });
  });

  Handsontable.hooks.add('afterDestroy', function () {
    var eventManager = Handsontable.eventManager(this);
    eventManager.clear();
  });

  Handsontable.hooks.add('afterOnCellMouseDown', function () {
    setupListening(this);
  });

  Handsontable.hooks.add('afterOnCellCornerMouseDown', function () {
    setupListening(this);
  });

  Handsontable.plugins.DragToScroll = DragToScroll;
}
