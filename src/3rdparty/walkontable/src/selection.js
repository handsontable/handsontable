
import {addClass} from './../../../helpers/dom/element';
import {WalkontableBorder} from './border';
import {WalkontableCellCoords} from './cell/coords';
import {WalkontableCellRange} from './cell/range';

/**
 * @class WalkontableSelection
 */
class WalkontableSelection {
  /**
   * @param {Object} settings
   * @param {WalkontableCellRange} cellRange
   */
  constructor(settings, cellRange) {
    this.settings = settings;
    this.cellRange = cellRange || null;
    this.instanceBorders = {};
  }

  /**
   * Each Walkontable clone requires it's own border for every selection. This method creates and returns selection
   * borders per instance
   *
   * @param {Walkontable} wotInstance
   * @returns {WalkontableBorder}
   */
  getBorder(wotInstance) {
    if (this.instanceBorders[wotInstance.guid]) {
      return this.instanceBorders[wotInstance.guid];
    }

    // where is this returned?
    this.instanceBorders[wotInstance.guid] = new WalkontableBorder(wotInstance, this.settings);
  }

  /**
   * Checks if selection is empty
   *
   * @returns {Boolean}
   */
  isEmpty() {
    return this.cellRange === null;
  }

  /**
   * Adds a cell coords to the selection
   *
   * @param {WalkontableCellCoords} coords
   */
  add(coords) {
    if (this.isEmpty()) {
      this.cellRange = new WalkontableCellRange(coords, coords, coords);

    } else {
      this.cellRange.expand(coords);
    }
  }

  /**
   * If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
   * information about success
   *
   * @param {WalkontableCellCoords} oldCoords
   * @param {WalkontableCellCoords} newCoords
   * @returns {Boolean}
   */
  replace(oldCoords, newCoords) {
    if (!this.isEmpty()) {
      if (this.cellRange.from.isEqual(oldCoords)) {
        this.cellRange.from = newCoords;

        return true;
      }
      if (this.cellRange.to.isEqual(oldCoords)) {
        this.cellRange.to = newCoords;

        return true;
      }
    }

    return false;
  }

  /**
   * Clears selection
   */
  clear() {
    this.cellRange = null;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`
   */
  getCorners() {
    let topLeft = this.cellRange.getTopLeftCorner();
    let bottomRight = this.cellRange.getBottomRightCorner();

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }

  /**
   * Adds class name to cell element at given coords
   *
   * @param {Walkontable} wotInstance Walkontable instance
   * @param {Number} sourceRow Cell row coord
   * @param {Number} sourceColumn Cell column coord
   * @param {String} className Class name
   */
  addClassAtCoords(wotInstance, sourceRow, sourceColumn, className) {
    let TD = wotInstance.wtTable.getCell(new WalkontableCellCoords(sourceRow, sourceColumn));

    if (typeof TD === 'object') {
      addClass(TD, className);
    }
  }

  /**
   * @param wotInstance
   */
  draw(wotInstance) {
    if (this.isEmpty()) {
      if (this.settings.border) {
        let border = this.getBorder(wotInstance);

        if (border) {
          border.disappear();
        }
      }

      return;
    }
    let renderedRows = wotInstance.wtTable.getRenderedRowsCount();
    let renderedColumns = wotInstance.wtTable.getRenderedColumnsCount();
    let corners = this.getCorners();
    let sourceRow, sourceCol, TH;

    for (let column = 0; column < renderedColumns; column++) {
      sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

      if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
        TH = wotInstance.wtTable.getColumnHeader(sourceCol);

        if (TH) {
          let newClasses = [];

          if (this.settings.highlightHeaderClassName) {
            newClasses.push(this.settings.highlightHeaderClassName);
          }

          if (this.settings.highlightColumnClassName) {
            newClasses.push(this.settings.highlightColumnClassName);
          }

          addClass(TH, newClasses);
        }
      }
    }

    for (let row = 0; row < renderedRows; row++) {
      sourceRow = wotInstance.wtTable.rowFilter.renderedToSource(row);

      if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
        TH = wotInstance.wtTable.getRowHeader(sourceRow);

        if (TH) {
          let newClasses = [];

          if (this.settings.highlightHeaderClassName) {
            newClasses.push(this.settings.highlightHeaderClassName);
          }

          if (this.settings.highlightRowClassName) {
            newClasses.push(this.settings.highlightRowClassName);
          }

          addClass(TH, newClasses);
        }
      }

      for (let column = 0; column < renderedColumns; column++) {
        sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

        if (sourceRow >= corners[0] && sourceRow <= corners[2] && sourceCol >= corners[1] && sourceCol <= corners[3]) {
          // selected cell
          if (this.settings.className) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.className);
          }
        } else if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
          // selection is in this row
          if (this.settings.highlightRowClassName) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.highlightRowClassName);
          }
        } else if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
          // selection is in this column
          if (this.settings.highlightColumnClassName) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.highlightColumnClassName);
          }
        }
      }
    }
    wotInstance.getSetting('onBeforeDrawBorders', corners, this.settings.className);

    if (this.settings.border) {
      let border = this.getBorder(wotInstance);

      if (border) {
        // warning! border.appear modifies corners!
        border.appear(corners);
      }
    }
  }
}

export {WalkontableSelection};

window.WalkontableSelection = WalkontableSelection;
