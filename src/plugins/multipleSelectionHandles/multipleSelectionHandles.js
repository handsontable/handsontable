import Handsontable from './../../browser';
import {getWindowScrollTop, hasClass, getWindowScrollLeft} from './../../helpers/dom/element';
import {isMobileBrowser} from './../../helpers/browser';
import BasePlugin from './../_base';
import {EventManager} from './../../eventManager';
import {registerPlugin} from './../../plugins';

/**
 * @private
 * @plugin MultipleSelectionHandles
 */
class MultipleSelectionHandles extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * @type {Array}
     */
    this.dragged = [];
    /**
     * Instance of EventManager.
     *
     * @type {EventManager}
     */
    this.eventManager = null;
    /**
     * @type {null}
     */
    this.lastSetCell = null;
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return isMobileBrowser();
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }
    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Bind the touch events
   * @private
   */
  registerListeners() {
    var _this = this;

    function removeFromDragged(query) {

      if (_this.dragged.length === 1) {
        // clear array
        _this.dragged.splice(0, _this.dragged.length);

        return true;
      }

      var entryPosition = _this.dragged.indexOf(query);

      if (entryPosition == -1) {
        return false;
      } else if (entryPosition === 0) {
        _this.dragged = _this.dragged.slice(0, 1);
      } else if (entryPosition == 1) {
        _this.dragged = _this.dragged.slice(-1);
      }
    }

    this.eventManager.addEventListener(this.hot.rootElement, 'touchstart', function(event) {
      let selectedRange;

      if (hasClass(event.target, 'topLeftSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRange();

        _this.dragged.push('topLeft');

        _this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();
        return false;

      } else if (hasClass(event.target, 'bottomRightSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRange();

        _this.dragged.push('bottomRight');

        _this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();
        return false;
      }
    });

    this.eventManager.addEventListener(this.hot.rootElement, 'touchend', function(event) {
      if (hasClass(event.target, 'topLeftSelectionHandle-HitArea')) {
        removeFromDragged.call(_this, 'topLeft');

        _this.touchStartRange = void 0;

        event.preventDefault();
        return false;

      } else if (hasClass(event.target, 'bottomRightSelectionHandle-HitArea')) {
        removeFromDragged.call(_this, 'bottomRight');

        _this.touchStartRange = void 0;

        event.preventDefault();
        return false;
      }
    });

    this.eventManager.addEventListener(this.hot.rootElement, 'touchmove', function(event) {
      let scrollTop = getWindowScrollTop(),
        scrollLeft = getWindowScrollLeft(),
        endTarget,
        targetCoords,
        selectedRange,
        rangeWidth,
        rangeHeight,
        rangeDirection,
        newRangeCoords;

      if (_this.dragged.length === 0) {
        return;
      }

      endTarget = document.elementFromPoint(
        event.touches[0].screenX - scrollLeft,
        event.touches[0].screenY - scrollTop);

      if (!endTarget || endTarget === _this.lastSetCell) {
        return;
      }

      if (endTarget.nodeName == 'TD' || endTarget.nodeName == 'TH') {
        targetCoords = _this.hot.getCoords(endTarget);

        if (targetCoords.col == -1) {
          targetCoords.col = 0;
        }

        selectedRange = _this.hot.getSelectedRange();
        rangeWidth = selectedRange.getWidth();
        rangeHeight = selectedRange.getHeight();
        rangeDirection = selectedRange.getDirection();

        if (rangeWidth == 1 && rangeHeight == 1) {
          _this.hot.selection.setRangeEnd(targetCoords);
        }

        newRangeCoords = _this.getCurrentRangeCoords(selectedRange, targetCoords, _this.touchStartRange.direction, rangeDirection, _this.dragged[0]);

        if (newRangeCoords.start !== null) {
          _this.hot.selection.setRangeStart(newRangeCoords.start);
        }

        _this.hot.selection.setRangeEnd(newRangeCoords.end);

        _this.lastSetCell = endTarget;

      }

      event.preventDefault();
    });
  }

  getCurrentRangeCoords(selectedRange, currentTouch, touchStartDirection, currentDirection, draggedHandle) {
    var topLeftCorner = selectedRange.getTopLeftCorner(),
      bottomRightCorner = selectedRange.getBottomRightCorner(),
      bottomLeftCorner = selectedRange.getBottomLeftCorner(),
      topRightCorner = selectedRange.getTopRightCorner();

    var newCoords = {
      start: null,
      end: null
    };

    switch (touchStartDirection) {
      case 'NE-SW':
        switch (currentDirection) {
          case 'NE-SW':
          case 'NW-SE':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, selectedRange.highlight.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle == 'bottomRight') {
              newCoords = {
                start: new WalkontableCellCoords(bottomRightCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          //case 'SW-NE':
          //  break;
        }
        break;
      case 'NW-SE':
        switch (currentDirection) {
          case 'NE-SW':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: currentTouch,
                end: bottomLeftCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'NW-SE':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: currentTouch,
                end: bottomRightCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SW-NE':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: currentTouch,
                end: topRightCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
        }
        break;
      case 'SW-NE':
        switch (currentDirection) {
          case 'NW-SE':
            if (draggedHandle == 'bottomRight') {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            }
            break;
          //case 'NE-SW':
          //
          //  break;
          case 'SW-NE':
            if (draggedHandle == 'topLeft') {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle == 'bottomRight') {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topRightCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            } else if (draggedHandle == 'topLeft') {
              newCoords = {
                start: bottomLeftCorner,
                end: currentTouch
              };
            }
            break;
        }
        break;
      case 'SE-NW':
        switch (currentDirection) {
          case 'NW-SE':
          case 'NE-SW':
          case 'SW-NE':
            if (draggedHandle == 'topLeft') {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle == 'topLeft') {
              newCoords.end = currentTouch;
            } else {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            }
            break;
        }
        break;
    }

    return newCoords;
  }

  /**
   * Check if user is currently dragging the handle.
   *
   * @returns {boolean} Dragging state
   */
  isDragged() {
    return this.dragged.length > 0;
  }
}

export {MultipleSelectionHandles};

registerPlugin('multipleSelectionHandles', MultipleSelectionHandles);
