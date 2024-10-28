import { hasClass } from '../../helpers/dom/element';
import { isMobileBrowser } from '../../helpers/browser';
import { BasePlugin } from '../base';

export const PLUGIN_KEY = 'multipleSelectionHandles';
export const PLUGIN_PRIORITY = 160;

/**
 * @private
 * @plugin MultipleSelectionHandles
 * @class MultipleSelectionHandles
 */
export class MultipleSelectionHandles extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * @type {Array}
   */
  dragged = [];
  /**
   * @type {null}
   */
  lastSetCell = null;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
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

    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Bind the touch events.
   *
   * @private
   */
  registerListeners() {
    const _this = this;
    const { rootElement } = this.hot;

    /**
     * @private
     * @param {string} query Query for the position.
     * @returns {boolean}
     */
    function removeFromDragged(query) {

      if (_this.dragged.length === 1) {
        // clear array
        _this.dragged.splice(0, _this.dragged.length);

        return true;
      }

      const entryPosition = _this.dragged.indexOf(query);

      if (entryPosition === -1) {
        return false;
      } else if (entryPosition === 0) {
        _this.dragged = _this.dragged.slice(0, 1);
      } else if (entryPosition === 1) {
        _this.dragged = _this.dragged.slice(-1);
      }
    }

    this.eventManager.addEventListener(rootElement, 'touchstart', (event) => {
      let selectedRange;

      if (hasClass(event.target, 'topSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRangeLast();

        _this.dragged.push('top');

        _this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;

      } else if (hasClass(event.target, 'bottomSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRangeLast();

        _this.dragged.push('bottom');

        _this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(rootElement, 'touchend', (event) => {
      if (hasClass(event.target, 'topSelectionHandle-HitArea')) {
        removeFromDragged.call(_this, 'top');

        _this.touchStartRange = undefined;

        event.preventDefault();

        return false;

      } else if (hasClass(event.target, 'bottomSelectionHandle-HitArea')) {
        removeFromDragged.call(_this, 'bottom');

        _this.touchStartRange = undefined;

        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(rootElement, 'touchmove', (event) => {
      const { rootDocument } = this.hot;
      let targetCoords;
      let selectedRange;
      let rangeWidth;
      let rangeHeight;
      let rangeDirection;
      let newRangeCoords;

      if (_this.dragged.length === 0) {
        return;
      }

      const endTarget = rootDocument.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);

      if (!endTarget || endTarget === _this.lastSetCell) {
        return;
      }

      if (endTarget.nodeName === 'TD' || endTarget.nodeName === 'TH') {
        targetCoords = _this.hot.getCoords(endTarget);

        if (targetCoords.col === -1) {
          targetCoords.col = 0;
        }

        selectedRange = _this.hot.getSelectedRangeLast();
        rangeWidth = selectedRange.getWidth();
        rangeHeight = selectedRange.getHeight();
        rangeDirection = selectedRange.getDirection();

        if (rangeWidth === 1 && rangeHeight === 1) {
          _this.hot.selection.setRangeEnd(targetCoords);
        }

        newRangeCoords = _this.getCurrentRangeCoords(
          selectedRange,
          targetCoords,
          _this.touchStartRange.direction,
          rangeDirection,
          _this.dragged[0]
        );

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
    const topStartCorner = selectedRange.getTopStartCorner();
    const bottomEndCorner = selectedRange.getBottomEndCorner();
    const bottomStartCorner = selectedRange.getBottomStartCorner();
    const topEndCorner = selectedRange.getTopEndCorner();

    let newCoords = {
      start: null,
      end: null
    };

    switch (touchStartDirection) {
      case 'NE-SW':
        switch (currentDirection) {
          case 'NE-SW':
          case 'NW-SE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row, selectedRange.highlight.col),
                end: this.hot._createCellCoords(bottomStartCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: this.hot._createCellCoords(currentTouch.row, topStartCorner.col)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(bottomEndCorner.row, currentTouch.col),
                end: this.hot._createCellCoords(currentTouch.row, topStartCorner.col)
              };
            }
            break;
          default:
            break;
        }
        break;
      case 'NW-SE':
        switch (currentDirection) {
          case 'NE-SW':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: bottomStartCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'NW-SE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: bottomEndCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: topStartCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: topEndCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          default:
            break;
        }
        break;
      case 'SW-NE':
        switch (currentDirection) {
          case 'NW-SE':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row, topStartCorner.col),
                end: this.hot._createCellCoords(bottomStartCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(topStartCorner.row, currentTouch.col),
                end: this.hot._createCellCoords(currentTouch.row, bottomEndCorner.col)
              };
            }
            break;
          // case 'NE-SW':
          //
          //  break;
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: this.hot._createCellCoords(currentTouch.row, bottomEndCorner.col)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row, topStartCorner.col),
                end: this.hot._createCellCoords(topStartCorner.row, currentTouch.col)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row, topEndCorner.col),
                end: this.hot._createCellCoords(topStartCorner.row, currentTouch.col)
              };
            } else if (draggedHandle === 'top') {
              newCoords = {
                start: bottomStartCorner,
                end: currentTouch
              };
            }
            break;
          default:
            break;
        }
        break;
      case 'SE-NW':
        switch (currentDirection) {
          case 'NW-SE':
          case 'NE-SW':
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'top') {
              newCoords.end = currentTouch;
            } else {
              newCoords = {
                start: currentTouch,
                end: topStartCorner
              };
            }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }

    return newCoords;
  }

  /**
   * Check if user is currently dragging the handle.
   *
   * @returns {boolean} Dragging state.
   */
  isDragged() {
    return this.dragged.length > 0;
  }
}
