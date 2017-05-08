import Hooks from './../../pluginHooks';
import EventManager from './../../eventManager';
import {registerPlugin} from './../../plugins';

/**
 * @description
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.
 *
 * @private
 * @class DragToScroll
 * @plugin DragToScroll
 */
function DragToScroll() {
  this.boundaries = null;
  this.callback = null;
}

/**
 * @param boundaries {Object} compatible with getBoundingClientRect
 */
DragToScroll.prototype.setBoundaries = function(boundaries) {
  this.boundaries = boundaries;
};

/**
 * @param callback {Function}
 */
DragToScroll.prototype.setCallback = function(callback) {
  this.callback = callback;
};

/**
 * Check if mouse position (x, y) is outside of the viewport
 * @param x
 * @param y
 */
DragToScroll.prototype.check = function(x, y) {
  var diffX = 0;
  var diffY = 0;

  if (y < this.boundaries.top) {
    // y is less than top
    diffY = y - this.boundaries.top;
  } else if (y > this.boundaries.bottom) {
    // y is more than bottom
    diffY = y - this.boundaries.bottom;
  }

  if (x < this.boundaries.left) {
    // x is less than left
    diffX = x - this.boundaries.left;
  } else if (x > this.boundaries.right) {
    // x is more than right
    diffX = x - this.boundaries.right;
  }

  this.callback(diffX, diffY);
};

var dragToScroll;
var instance;

var setupListening = function(instance) {
  instance.dragToScrollListening = false;
  var scrollHandler = instance.view.wt.wtTable.holder; // native scroll
  dragToScroll = new DragToScroll();

  if (scrollHandler === window) {
    // not much we can do currently
    return;
  }

  dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
  dragToScroll.setCallback((scrollX, scrollY) => {
    if (scrollX < 0) {
      scrollHandler.scrollLeft -= 50;
    } else if (scrollX > 0) {
      scrollHandler.scrollLeft += 50;
    }

    if (scrollY < 0) {
      scrollHandler.scrollTop -= 20;
    } else if (scrollY > 0) {
      scrollHandler.scrollTop += 20;
    }
  });

  instance.dragToScrollListening = true;
};

Hooks.getSingleton().add('afterInit', function() {
  var instance = this;
  var eventManager = new EventManager(this);

  eventManager.addEventListener(document, 'mouseup', () => {
    instance.dragToScrollListening = false;
  });

  eventManager.addEventListener(document, 'mousemove', (event) => {
    if (instance.dragToScrollListening) {
      dragToScroll.check(event.clientX, event.clientY);
    }
  });
});

Hooks.getSingleton().add('afterDestroy', function() {
  (new EventManager(this)).clear();
});

Hooks.getSingleton().add('afterOnCellMouseDown', function() {
  setupListening(this);
});

Hooks.getSingleton().add('afterOnCellCornerMouseDown', function() {
  setupListening(this);
});

export default DragToScroll;
