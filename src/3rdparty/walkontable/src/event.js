import {
  closestDown,
  hasClass,
  isChildOf,
  getParent,
} from './../../../helpers/dom/element';
import { partial } from './../../../helpers/function';
import { isTouchSupported } from './../../../helpers/feature';
import EventManager from './../../../eventManager';

/**
 * @class Event
 */
class Event {

  constructor(instance) {
    this.selectedCellBeforeTouchEnd = void 0;

    this.dblClickTimeout = [null, null];
    this.dblClickOrigin = [null, null];

    this.instance = instance;
    this.eventManager = new EventManager(instance);

    this.registerEvents();
  }

  registerEvents() {
    this.eventManager.addEventListener(this.instance.wtTable.holder, 'contextmenu', event => this.onContextMenu(event));
    this.eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', event => this.onMouseOver(event));
    this.eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseout', event => this.onMouseOut(event));

    if (isTouchSupported()) {
      const onTouchStartProxy = (event) => {
        this.selectedCellBeforeTouchEnd = this.instance.selections.getCell().cellRange;
        this.instance.touchApplied = true;

        this.onTouchStart(event);
      };
      const onTouchEndProxy = (event) => {
        this.instance.touchApplied = false;

        this.onTouchEnd(event);
      };

      this.eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', event => onTouchStartProxy(event));
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', event => onTouchEndProxy(event));

      if (!this.instance.momentumScrolling) {
        this.instance.momentumScrolling = {};
      }
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', () => {
        clearTimeout(this.instance.momentumScrolling._timeout);

        if (!this.instance.momentumScrolling.ongoing) {
          this.instance.getSetting('onBeforeTouchScroll');
        }
        this.instance.momentumScrolling.ongoing = true;

        this.instance.momentumScrolling._timeout = setTimeout(() => {
          if (!this.instance.touchApplied) {
            this.instance.momentumScrolling.ongoing = false;

            this.instance.getSetting('onAfterMomentumScroll');
          }
        }, 200);
      });

    } else {
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', event => this.onMouseUp(event));
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', event => this.onMouseDown(event));
    }

    this.eventManager.addEventListener(window, 'resize', () => {
      if (this.instance.getSetting('stretchH') !== 'none') {
        this.instance.draw();
      }
    });
  }

  selectedCellWasTouched(touchTarget) {
    const cellUnderFinger = this.parentCell(touchTarget);
    const coordsOfCellUnderFinger = cellUnderFinger.coords;

    if (this.selectedCellBeforeTouchEnd && coordsOfCellUnderFinger) {
      const [rowTouched, rowSelected] = [coordsOfCellUnderFinger.row, this.selectedCellBeforeTouchEnd.from.row];
      const [colTouched, colSelected] = [coordsOfCellUnderFinger.col, this.selectedCellBeforeTouchEnd.from.col];

      return rowTouched === rowSelected && colTouched === colSelected;
    }

    return false;
  }

  onMouseDown(event) {
    const activeElement = document.activeElement;
    const getParentNode = partial(getParent, event.realTarget);
    const realTarget = event.realTarget;

    // ignore focusable element from mouse down processing (https://github.com/handsontable/handsontable/issues/3555)
    if (realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement) {
      return;
    }

    const cell = this.parentCell(realTarget);

    if (hasClass(realTarget, 'corner')) {
      this.instance.getSetting('onCellCornerMouseDown', event, realTarget);
    } else if (cell.TD && this.instance.hasSetting('onCellMouseDown')) {
      this.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, this.instance);
    }

    if (event.button !== 2 && cell.TD) { // if not right mouse button
      this.dblClickOrigin[0] = cell.TD;

      clearTimeout(this.dblClickTimeout[0]);

      this.dblClickTimeout[0] = setTimeout(() => {
        this.dblClickOrigin[0] = null;
      }, 1000);
    }
  }

  onContextMenu(event) {
    if (this.instance.hasSetting('onCellContextMenu')) {
      const cell = this.parentCell(event.realTarget);

      if (cell.TD) {
        this.instance.getSetting('onCellContextMenu', event, cell.coords, cell.TD, this.instance);
      }
    }
  }

  onMouseOver(event) {
    if (!this.instance.hasSetting('onCellMouseOver')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const td = closestDown(event.realTarget, ['TD', 'TH'], table);
    const mainWOT = this.instance.cloneSource || this.instance;

    if (td && td !== mainWOT.lastMouseOver && isChildOf(td, table)) {
      mainWOT.lastMouseOver = td;

      this.instance.getSetting('onCellMouseOver', event, this.instance.wtTable.getCoords(td), td, this.instance);
    }
  }

  onMouseOut(event) {
    if (!this.instance.hasSetting('onCellMouseOut')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const lastTD = closestDown(event.realTarget, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget, ['TD', 'TH'], table);

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
      this.instance.getSetting('onCellMouseOut', event, this.instance.wtTable.getCoords(lastTD), lastTD, this.instance);
    }
  }

  onMouseUp(event) {
    if (event.button !== 2) { // if not right mouse button
      const cell = this.parentCell(event.realTarget);

      if (cell.TD && this.instance.hasSetting('onCellMouseUp')) {
        this.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, this.instance);
      }

      if (cell.TD === this.dblClickOrigin[0] && cell.TD === this.dblClickOrigin[1]) {
        if (hasClass(event.realTarget, 'corner')) {
          this.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, this.instance);
        } else {
          this.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, this.instance);
        }

        this.dblClickOrigin[0] = null;
        this.dblClickOrigin[1] = null;

      } else if (cell.TD === this.dblClickOrigin[0]) {
        this.dblClickOrigin[1] = cell.TD;

        clearTimeout(this.dblClickTimeout[1]);

        this.dblClickTimeout[1] = setTimeout(() => {
          this.dblClickOrigin[1] = null;
        }, 500);
      }
    }
  }

  onTouchStart(event) {
    this.onMouseDown(event);
  }

  onTouchEnd(event) {
    const excludeTags = ['A', 'BUTTON', 'INPUT'];
    const target = event.target;

    // When the standard event was performed on the link element (a cell which contains HTML `a` element) then here
    // we check if it should be canceled. Click is blocked in a situation when the element is rendered outside
    // selected cells. This prevents accidentally page reloads while selecting adjacent cells.
    if (this.selectedCellWasTouched(target) === false && excludeTags.includes(target.tagName)) {
      event.preventDefault();
    }

    this.onMouseUp(event);
  }

  destroy() {
    clearTimeout(this.dblClickTimeout[0]);
    clearTimeout(this.dblClickTimeout[1]);

    this.eventManager.destroy();
  }

  parentCell(elem) {
    const cell = {};
    const TABLE = this.instance.wtTable.TABLE;
    const TD = closestDown(elem, ['TD', 'TH'], TABLE);

    if (TD) {
      cell.coords = this.instance.wtTable.getCoords(TD);
      cell.TD = TD;

    } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'current')) {
      cell.coords = this.instance.selections.getCell().cellRange.highlight;
      cell.TD = this.instance.wtTable.getCell(cell.coords);

    } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'area')) {
      if (this.instance.selections.createOrGetArea().cellRange) {
        cell.coords = this.instance.selections.createOrGetArea().cellRange.to;
        cell.TD = this.instance.wtTable.getCell(cell.coords);
      }
    }

    return cell;
  }
}

export default Event;
