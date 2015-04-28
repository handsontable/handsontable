import * as dom from './../../../dom.js';
import {WalkontableOverlay} from './_overlay.js';

export {WalkontableCornerOverlay};

window.WalkontableCornerOverlay = WalkontableCornerOverlay;

function WalkontableCornerOverlay(instance) {
  this.instance = instance;
  this.type = 'corner';
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerOverlay.prototype = new WalkontableOverlay();

WalkontableCornerOverlay.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode,
    finalLeft,
    finalTop;

  if (this.trimmingContainer === window) {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var left = Math.ceil(box.left);
    var bottom = Math.ceil(box.bottom);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }

    dom.setOverlayPosition(elem, finalLeft, finalTop);
  }

  var tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
  var tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);

  elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  elem.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';

  this.hideBorderOnInitialPosition();
};

WalkontableCornerOverlay.prototype.hideBorderOnInitialPosition = function () {
  if(this.instance.getSetting('fixedRowsTop') === 0 && this.instance.getSetting('columnHeaders')) {
    if(this.getVerticalScrollPosition() === 0) {
      dom.removeClass(this.clone.wtTable.holder.parentNode, 'innerBorderTop');
    } else {
      dom.addClass(this.clone.wtTable.holder.parentNode, 'innerBorderTop');
    }
  }

  if(this.instance.getSetting('fixedColumnsLeft') === 0 && this.instance.getSetting('rowHeaders')) {
    if(this.getHorizontalScrollPosition() === 0) {
      dom.removeClass(this.clone.wtTable.holder.parentNode, 'innerBorderLeft');
    } else {
      dom.addClass(this.clone.wtTable.holder.parentNode, 'innerBorderLeft');
    }
  }
};

WalkontableCornerOverlay.prototype.getHorizontalScrollPosition = function () {
  return dom.getScrollLeft(this.mainTableScrollableElement);
};

WalkontableCornerOverlay.prototype.getVerticalScrollPosition = function () {
  return dom.getScrollTop(this.mainTableScrollableElement);
};
