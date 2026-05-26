import { eventTargetEl, hasClass } from '../../helpers/dom/element';
import { isMobileBrowser } from '../../helpers/browser';
import { BasePlugin } from '../base';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

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
  dragged: string[] = [];
  /**
   * @type {null}
   */
  lastSetCell: HTMLElement | null = null;
  /**
   * @type {object}
   */
  declare touchStartRange: { width: number; height: number; direction: string } | undefined;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
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
    function removeFromDragged(query: string) {

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
      const target = eventTargetEl(event)!;

      if (hasClass(target, 'topSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRangeActive();

        if (!selectedRange) {
          return false;
        }

        _this.dragged.push('top');

        _this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;

      } else if (hasClass(target, 'bottomSelectionHandle-HitArea')) {
        selectedRange = _this.hot.getSelectedRangeActive();

        if (!selectedRange) {
          return false;
        }

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
      const target = eventTargetEl(event)!;

      if (hasClass(target, 'topSelectionHandle-HitArea')) {
        removeFromDragged.call(_this, 'top');

        _this.touchStartRange = undefined;

        event.preventDefault();

        return false;

      } else if (hasClass(target, 'bottomSelectionHandle-HitArea')) {
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

      const te = (event as TouchEvent).touches[0];
      const endTarget = rootDocument.elementFromPoint(te.clientX, te.clientY);

      if (!endTarget || endTarget === _this.lastSetCell) {
        return;
      }

      if (endTarget.nodeName === 'TD' || endTarget.nodeName === 'TH') {
        targetCoords = _this.hot.getCoords(endTarget as HTMLElement);

        if (!targetCoords) {
          return;
        }

        if (targetCoords.col === -1) {
          targetCoords.col = 0;
        }

        selectedRange = _this.hot.getSelectedRangeActive();

        if (!selectedRange) {
          return;
        }

        rangeWidth = selectedRange.getWidth();
        rangeHeight = selectedRange.getHeight();
        rangeDirection = selectedRange.getDirection();

        if (rangeWidth === 1 && rangeHeight === 1) {
          _this.hot.selection.setRangeEnd(targetCoords);
        }

        newRangeCoords = _this.getCurrentRangeCoords(
          selectedRange,
          targetCoords,
          _this.touchStartRange!.direction,
          rangeDirection,
          _this.dragged[0]
        );

        if (newRangeCoords.start !== null) {
          _this.hot.selection.setRangeStart(newRangeCoords.start);
        }

        _this.hot.selection.setRangeEnd(newRangeCoords.end!);

        _this.lastSetCell = endTarget as HTMLElement;

      }

      event.preventDefault();
    });
  }

  getCurrentRangeCoords(
    selectedRange: CellRange, currentTouch: CellCoords, touchStartDirection: string,
    currentDirection: string, draggedHandle: string
  ) {
    const topStartCorner = selectedRange.getTopStartCorner();
    const bottomEndCorner = selectedRange.getBottomEndCorner();
    const bottomStartCorner = selectedRange.getBottomStartCorner();
    const topEndCorner = selectedRange.getTopEndCorner();

    let newCoords = {
      start: null as CellCoords | null,
      end: null as CellCoords | null
    };

    switch (touchStartDirection) {
      case 'NE-SW':
        switch (currentDirection) {
          case 'NE-SW':
          case 'NW-SE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, selectedRange.highlight.col ?? 0),
                end: this.hot._createCellCoords(bottomStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(bottomEndCorner.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0)
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
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0),
                end: this.hot._createCellCoords(bottomStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, bottomEndCorner.col ?? 0)
              };
            }
            break;
          // case 'NE-SW':
          //
          //  break;
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, bottomEndCorner.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0),
                end: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topEndCorner.col ?? 0),
                end: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0)
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
  isDragged(): boolean {
    return this.dragged.length > 0;
  }
}
