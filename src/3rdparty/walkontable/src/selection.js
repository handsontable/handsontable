import { addClass, hasClass } from './../../../helpers/dom/element';
import Border from './border';
import CellCoords from './cell/coords';
import CellRange from './cell/range';

/**
 * @class Selection
 */
class Selection {
  /**
   * @param {Object} settings
   * @param {CellRange} cellRange
   */
  constructor(settings, cellRange) {
    this.settings = settings;
    this.cellRange = cellRange || null;
    this.instanceBorders = {};
    this.classNames = [this.settings.className];
    this.classNameGenerator = this.linearClassNameGenerator(this.settings.className, this.settings.layerLevel);
  }

  /**
   * Each Walkontable clone requires it's own border for every selection. This method creates and returns selection
   * borders per instance
   *
   * @param {Walkontable} wotInstance
   * @returns {Border}
   */
  getBorder(wotInstance) {
    if (!this.instanceBorders[wotInstance.guid]) {
      this.instanceBorders[wotInstance.guid] = new Border(wotInstance, this.settings);
    }

    return this.instanceBorders[wotInstance.guid];
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
   * @param {CellCoords} coords
   */
  add(coords) {
    if (this.isEmpty()) {
      this.cellRange = new CellRange(coords);

    } else {
      this.cellRange.expand(coords);
    }

    return this;
  }

  /**
   * If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
   * information about success
   *
   * @param {CellCoords} oldCoords
   * @param {CellCoords} newCoords
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
   *
   * @returns {Selection}
   */
  clear() {
    this.cellRange = null;

    return this;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`
   */
  getCorners() {
    const topLeft = this.cellRange.getTopLeftCorner();
    const bottomRight = this.cellRange.getBottomRightCorner();

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
   * @param {Boolean} [markIntersections=false] If `true`, linear className generator will be used to add CSS classes
   *                                            in a continuous way.
   * @returns {Selection}
   */
  addClassAtCoords(wotInstance, sourceRow, sourceColumn, className, markIntersections = false) {
    const TD = wotInstance.wtTable.getCell(new CellCoords(sourceRow, sourceColumn));

    if (typeof TD === 'object') {
      let cellClassName = className;

      if (markIntersections) {
        cellClassName = this.classNameGenerator(TD);

        if (!this.classNames.includes(cellClassName)) {
          this.classNames.push(cellClassName);
        }
      }

      addClass(TD, cellClassName);
    }

    return this;
  }

  /**
   * Generate helper for calculating classNames based on previously added base className.
   * The generated className is always generated as a continuation of the previous className. For example, when
   * the currently checked element has 'area-2' className the generated new className will be 'area-3'. When
   * the element doesn't have any classNames than the base className will be returned ('area');
   *
   * @param {String} baseClassName Base className to be used.
   * @param {Number} layerLevelOwner Layer level which the instance of the Selection belongs to.
   * @return {Function}
   */
  linearClassNameGenerator(baseClassName, layerLevelOwner) {
    // TODO: Make this recursive function Proper Tail Calls (TCO/PTC) friendly.
    return function calcClassName(element, previousIndex = -1) {
      if (layerLevelOwner === 0 || previousIndex === 0) {
        return baseClassName;
      }

      let index = previousIndex >= 0 ? previousIndex : layerLevelOwner;
      let className = baseClassName;

      index -= 1;

      const previousClassName = index === 0 ? baseClassName : `${baseClassName}-${index}`;

      if (hasClass(element, previousClassName)) {
        const currentLayer = index + 1;

        className = `${baseClassName}-${currentLayer}`;

      } else {
        className = calcClassName(element, index);
      }

      return className;
    };
  }

  /**
   * @param wotInstance
   */
  draw(wotInstance) {
    if (this.isEmpty()) {
      if (this.settings.border) {
        this.getBorder(wotInstance).disappear();
      }

      return;
    }

    const renderedRows = wotInstance.wtTable.getRenderedRowsCount();
    const renderedColumns = wotInstance.wtTable.getRenderedColumnsCount();
    const corners = this.getCorners();
    const [topRow, topColumn, bottomRow, bottomColumn] = corners;

    for (let column = 0; column < renderedColumns; column += 1) {
      const sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

      if (sourceCol >= topColumn && sourceCol <= bottomColumn) {
        const TH = wotInstance.wtTable.getColumnHeader(sourceCol);

        if (TH) {
          const newClasses = [];

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

    for (let row = 0; row < renderedRows; row += 1) {
      const sourceRow = wotInstance.wtTable.rowFilter.renderedToSource(row);

      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const TH = wotInstance.wtTable.getRowHeader(sourceRow);

        if (TH) {
          const newClasses = [];

          if (this.settings.highlightHeaderClassName) {
            newClasses.push(this.settings.highlightHeaderClassName);
          }

          if (this.settings.highlightRowClassName) {
            newClasses.push(this.settings.highlightRowClassName);
          }

          addClass(TH, newClasses);
        }
      }

      for (let column = 0; column < renderedColumns; column += 1) {
        const sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

        if (sourceRow >= topRow && sourceRow <= bottomRow && sourceCol >= topColumn && sourceCol <= bottomColumn) {
          // selected cell
          if (this.settings.className) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.className, this.settings.markIntersections);
          }

        } else if (sourceRow >= topRow && sourceRow <= bottomRow) {
          // selection is in this row
          if (this.settings.highlightRowClassName) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.highlightRowClassName);
          }
        } else if (sourceCol >= topColumn && sourceCol <= bottomColumn) {
          // selection is in this column
          if (this.settings.highlightColumnClassName) {
            this.addClassAtCoords(wotInstance, sourceRow, sourceCol, this.settings.highlightColumnClassName);
          }
        }

        const additionalSelectionClass = wotInstance.getSetting('onAfterDrawSelection', sourceRow, sourceCol, corners, this.settings.layerLevel);

        if (typeof additionalSelectionClass === 'string') {
          this.addClassAtCoords(wotInstance, sourceRow, sourceCol, additionalSelectionClass);
        }

      }
    }

    wotInstance.getSetting('onBeforeDrawBorders', corners, this.settings.className);

    if (this.settings.border) {
      // warning! border.appear modifies corners!
      this.getBorder(wotInstance).appear(corners);
    }
  }
}

export default Selection;
