import BasePlugin from './../_base';
import {offset, outerHeight, outerWidth} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords';
import {getDeltas, settingsFactory} from './utils';

const privatePool = new WeakMap();

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated
 * using the small square in the right bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring
 * cells when you drag the small square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells
 * below when you double click the small square.
 *
 * @class Autofill
 * @plugin Autofill
 */

class Autofill extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    this.eventManager = eventManagerObject(this);
    this.addingStarted = false;
    this.mouseDownOnCellCorner = false;
    this.mouseDragOutside = false;
    this.handle = {
      isDragged: 0,
      disabled: false
    };

    privatePool.set(this, {
      settings: settingsFactory(this.hot.getSettings().fillHandle)
    });
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mouseup', () => this.onMouseUp());
    this.eventManager.addEventListener(document.documentElement, 'mousemove', (event) => this.onMouseMove(event));
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().fillHandle === true || this.hot.getSettings().fillHandle === 'horizontal' ||
      this.hot.getSettings().fillHandle === 'vertical';
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.registerEvents();

    this.addHook('afterOnCellCornerMouseDown', (event) => this.onAfterCellCornerMouseDown(event));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD) => this.onBeforeCellMouseOver(coords));

    setTimeout(() => {
      this.hot.view.wt.wtSettings.settings.onCellCornerDblClick = () => {
        this.selectAdjacent();
      };
    }, 200);

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Selects cells down to the last row in the left column, then fills down to that cell
   *
   * @function selectAdjacent
   * @memberof Autofill#
   */
  selectAdjacent() {
    let select;
    const data = this.hot.getData();
    var r, maxR, c;

    if (this.hot.selection.isMultiple()) {
      select = this.hot.view.wt.selections.area.getCorners();

    } else {
      select = this.hot.view.wt.selections.current.getCorners();
    }

    rows: for (r = select[2] + 1; r < this.hot.countRows(); r++) {
      for (c = select[1]; c <= select[3]; c++) {
        if (data[r][c]) {
          break rows;
        }
      }
      if (!!data[r][select[1] - 1] || !!data[r][select[3] + 1]) {
        maxR = r;
      }
    }
    if (maxR) {
      this.hot.view.wt.selections.fill.clear();
      this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(select[0], select[1]));
      this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(maxR, select[3]));
      this.apply();
    }
  }

  /**
   * Apply fill values to the area in fill border, omitting the selection border
   *
   * @function apply
   * @memberof Autofill#
   */
  apply() {
    if (this.hot.view.wt.selections.fill.isEmpty()) {
      return;
    }

    const drag = this.hot.view.wt.selections.fill.getCorners();

    let select, start, end, direction;

    this.handle.isDragged = 0;
    this.hot.view.wt.selections.fill.clear();

    if (this.hot.selection.isMultiple()) {
      select = this.hot.view.wt.selections.area.getCorners();
    } else {
      select = this.hot.view.wt.selections.current.getCorners();
    }

    this.hot.runHooks('afterAutofillApplyValues', select, drag);

    if (drag[0] === select[0] && drag[1] < select[1]) {
      direction = 'left';

      start = new WalkontableCellCoords(drag[0], drag[1]);
      end = new WalkontableCellCoords(drag[2], select[1] - 1);

    } else if (drag[0] === select[0] && drag[3] > select[3]) {
      direction = 'right';

      start = new WalkontableCellCoords(drag[0], select[3] + 1);
      end = new WalkontableCellCoords(drag[2], drag[3]);

    } else if (drag[0] < select[0] && drag[1] === select[1]) {
      direction = 'up';

      start = new WalkontableCellCoords(drag[0], drag[1]);
      end = new WalkontableCellCoords(select[0] - 1, drag[3]);

    } else if (drag[2] > select[2] && drag[1] === select[1]) {
      direction = 'down';

      start = new WalkontableCellCoords(select[2] + 1, drag[1]);
      end = new WalkontableCellCoords(drag[2], drag[3]);
    }

    if (start && start.row > -1 && start.col > -1) {
      const selRange = {
        from: this.hot.getSelectedRange().from,
        to: this.hot.getSelectedRange().to,
      };
      const data = this.hot.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
      const deltas = getDeltas(start, end, data, direction);

      this.hot.runHooks('beforeAutofill', start, end, data);


      this.hot.populateFromArray(start.row, start.col, data, end.row, end.col, 'autofill', null, direction, deltas);

      this.hot.selection.setRangeStart(new WalkontableCellCoords(drag[0], drag[1]));
      this.hot.selection.setRangeEnd(new WalkontableCellCoords(drag[2], drag[3]));

    } else {
      // reset to avoid some range bug
      this.hot.selection.refreshBorders();
    }
  }

  /**
   * Show fill border
   *
   * @function showBorder
   * @memberof Autofill#
   * @param {WalkontableCellCoords} coords `WalkontableCellCoords` coord object.
   */
  showBorder(coords) {
    const topLeft = this.hot.getSelectedRange().getTopLeftCorner();
    const bottomRight = this.hot.getSelectedRange().getBottomRightCorner();
    const priv = privatePool.get(this);

    if (priv.settings('direction') !== 'horizontal' && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
      coords = new WalkontableCellCoords(coords.row, bottomRight.col);

    } else if (priv.settings('direction') !== 'vertical') { // jscs:ignore disallowNotOperatorsInConditionals
      coords = new WalkontableCellCoords(bottomRight.row, coords.col);

    } else {
      // wrong direction
      return;
    }
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().from);
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().to);
    this.hot.view.wt.selections.fill.add(coords);
    this.hot.view.render();
  }

  /**
   * Adds new rows if they are needed to continue auto-filling values
   * @function addNewRowIfNeeded
   * @memberof Autofill#
   */
  addNewRowIfNeeded() {
    const priv = privatePool.get(this);

    if (this.hot.view.wt.selections.fill.cellRange && this.addingStarted === false && priv.settings('autoInsertRow')) {
      const selection = this.hot.getSelected();
      const fillCorners = this.hot.view.wt.selections.fill.getCorners();
      const nrOfTableRows = this.hot.countRows();

      if (selection[2] < nrOfTableRows - 1 && fillCorners[2] === nrOfTableRows - 1) {
        this.addingStarted = true;

        this.hot._registerTimeout(setTimeout(() => {
          this.hot.alter('insert_row');
          this.addingStarted = false;
        }, 200));
      }
    }
  }

  onAfterCellCornerMouseDown() {
    this.handle.isDragged = 1;
    this.mouseDownOnCellCorner = true;
  }

  onBeforeCellMouseOver(coords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handle.isDragged) {
      this.handle.isDragged++;
      this.showBorder(coords);
      this.addNewRowIfNeeded();
    }
  }

  onMouseUp() {
    if (this.handle.isDragged) {
      if (this.handle.isDragged > 1) {
        this.apply();
      }
      this.handle.isDragged = 0;
      this.mouseDownOnCellCorner = false;
    }
  }

  onMouseMove(event) {
    const priv = privatePool.get(this);

    let tableBottom = offset(this.hot.table).top - (window.pageYOffset ||
      document.documentElement.scrollTop) + outerHeight(this.hot.table);
    let tableRight = offset(this.hot.table).left - (window.pageXOffset ||
      document.documentElement.scrollLeft) + outerWidth(this.hot.table);

    // dragged outside bottom
    if (this.addingStarted === false && this.handle.isDragged > 0 && event.clientY > tableBottom && event.clientX <= tableRight) {
      this.mouseDragOutside = true;
      this.addingStarted = true;

    } else {
      this.mouseDragOutside = false;
    }

    if (this.mouseDragOutside && priv.settings('autoInsertRow')) {
      setTimeout(() => {
        this.addingStarted = false;
        this.hot.alter('insert_row');
      }, 200);
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

export {Autofill};

registerPlugin('autofill', Autofill);
