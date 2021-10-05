import { addClass, hasClass } from './../../../helpers/dom/element';
import Border from './border';
import CellCoords from './cell/coords';
import CellRange from './cell/range';

/**
 * @class Selection
 */
class Selection {
  /**
   * @param {object} settings The selection settings object.
   * @param {CellRange} cellRange The cell range instance.
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
   * borders per instance.
   *
   * @param {Walkontable} wotInstance The Walkontable instance.
   * @returns {Border}
   */
  getBorder(wotInstance) {
    if (!this.instanceBorders[wotInstance.guid]) {
      this.instanceBorders[wotInstance.guid] = new Border(wotInstance, this.settings);
    }

    return this.instanceBorders[wotInstance.guid];
  }

  /**
   * Checks if selection is empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.cellRange === null;
  }

  /**
   * Adds a cell coords to the selection.
   *
   * @param {CellCoords} coords The cell coordinates to add.
   * @returns {Selection}
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
   * information about success.
   *
   * @param {CellCoords} oldCoords An old cell coordinates to replace.
   * @param {CellCoords} newCoords The new cell coordinates.
   * @returns {boolean}
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
   * Clears selection.
   *
   * @returns {Selection}
   */
  clear() {
    this.cellRange = null;

    return this;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates.
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getCorners() {
    const topLeft = this.cellRange.getOuterTopLeftCorner();
    const bottomRight = this.cellRange.getOuterBottomRightCorner();

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }

  /**
   * Adds class name to cell element at given coords.
   *
   * @param {Walkontable} wotInstance Walkontable instance.
   * @param {number} sourceRow Cell row coord.
   * @param {number} sourceColumn Cell column coord.
   * @param {string} className Class name.
   * @param {boolean} [markIntersections=false] If `true`, linear className generator will be used to add CSS classes
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
   * the element doesn't have any classNames than the base className will be returned ('area');.
   *
   * @param {string} baseClassName Base className to be used.
   * @param {number} layerLevelOwner Layer level which the instance of the Selection belongs to.
   * @returns {Function}
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
   * @param {Walkontable} wotInstance The Walkontable instance.
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
    const {
      highlightHeaderClassName,
      highlightColumnClassName,
      highlightRowClassName,
      highlightOnlyClosestHeader,
      selectionType,
    } = this.settings;
    const isHeaderSelectionType = selectionType === void 0 || ['active-header', 'header'].includes(selectionType);

    if (isHeaderSelectionType && topColumn !== null && bottomColumn !== null) {
      let selectionColumnCursor = 0;

      for (let column = 0; column < renderedColumns; column += 1) {
        const sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

        if (sourceCol >= topColumn && sourceCol <= bottomColumn) {
          let THs = wotInstance.wtTable.getColumnHeaders(sourceCol);
          const closestHeaderLevel = THs.length - 1;

          if (highlightOnlyClosestHeader && THs.length > 1) {
            THs = [THs[closestHeaderLevel]];
          }

          for (let headerLevel = 0; headerLevel < THs.length; headerLevel += 1) {
            const newClasses = [];
            let TH = THs[headerLevel];

            if (highlightHeaderClassName) {
              newClasses.push(highlightHeaderClassName);
            }

            if (highlightColumnClassName) {
              newClasses.push(highlightColumnClassName);
            }

            headerLevel = highlightOnlyClosestHeader ? closestHeaderLevel : headerLevel;

            const newSourceCol = wotInstance
              .getSetting('onBeforeHighlightingColumnHeader', sourceCol, headerLevel, {
                selectionType,
                columnCursor: selectionColumnCursor,
                selectionWidth: bottomColumn - topColumn + 1,
                classNames: newClasses,
              });

            if (newSourceCol !== sourceCol) {
              TH = wotInstance.wtTable.getColumnHeader(newSourceCol, headerLevel);
            }

            addClass(TH, newClasses);
          }

          selectionColumnCursor += 1;
        }
      }
    }

    if (topRow !== null && bottomRow !== null) {
      let selectionRowCursor = 0;

      for (let row = 0; row < renderedRows; row += 1) {
        const sourceRow = wotInstance.wtTable.rowFilter.renderedToSource(row);

        if (isHeaderSelectionType && sourceRow >= topRow && sourceRow <= bottomRow) {
          let THs = wotInstance.wtTable.getRowHeaders(sourceRow);
          const closestHeaderLevel = THs.length - 1;

          if (highlightOnlyClosestHeader && THs.length > 1) {
            THs = [THs[closestHeaderLevel]];
          }

          for (let headerLevel = 0; headerLevel < THs.length; headerLevel += 1) {
            const newClasses = [];
            let TH = THs[headerLevel];

            if (highlightHeaderClassName) {
              newClasses.push(highlightHeaderClassName);
            }

            if (highlightRowClassName) {
              newClasses.push(highlightRowClassName);
            }

            headerLevel = highlightOnlyClosestHeader ? closestHeaderLevel : headerLevel;

            const newSourceRow = wotInstance
              .getSetting('onBeforeHighlightingRowHeader', sourceRow, headerLevel, {
                selectionType,
                rowCursor: selectionRowCursor,
                selectionHeight: bottomRow - topRow + 1,
                classNames: newClasses,
              });

            if (newSourceRow !== sourceRow) {
              TH = wotInstance.wtTable.getRowHeader(newSourceRow, headerLevel);
            }

            addClass(TH, newClasses);
          }

          selectionRowCursor += 1;
        }

        if (topColumn !== null && bottomColumn !== null) {
          for (let column = 0; column < renderedColumns; column += 1) {
            const sourceCol = wotInstance.wtTable.columnFilter.renderedToSource(column);

            if (sourceRow >= topRow && sourceRow <= bottomRow && sourceCol >= topColumn && sourceCol <= bottomColumn) {
              // selected cell
              if (this.settings.className) {
                this.addClassAtCoords(wotInstance, sourceRow, sourceCol,
                  this.settings.className, this.settings.markIntersections);
              }

            } else if (sourceRow >= topRow && sourceRow <= bottomRow) {
              // selection is in this row
              if (highlightRowClassName) {
                this.addClassAtCoords(wotInstance, sourceRow, sourceCol, highlightRowClassName);
              }
            } else if (sourceCol >= topColumn && sourceCol <= bottomColumn) {
              // selection is in this column
              if (highlightColumnClassName) {
                this.addClassAtCoords(wotInstance, sourceRow, sourceCol, highlightColumnClassName);
              }
            }

            const additionalSelectionClass = wotInstance
              .getSetting('onAfterDrawSelection', sourceRow, sourceCol, this.settings.layerLevel);

            if (typeof additionalSelectionClass === 'string') {
              this.addClassAtCoords(wotInstance, sourceRow, sourceCol, additionalSelectionClass);
            }
          }
        }
      }
    }

    wotInstance.getSetting('onBeforeDrawBorders', corners, this.settings.className);

    if (this.settings.border) {
      // warning! border.appear modifies corners!
      this.getBorder(wotInstance).appear(corners);
    }
  }

  /**
   * Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.
   */
  destroy() {
    Object.values(this.instanceBorders).forEach(border => border.destroy());
  }
}

export default Selection;
