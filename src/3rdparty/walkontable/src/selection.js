import { addClass, hasClass } from './../../../helpers/dom/element';
import SelectionHandle from './selectionHandle';
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
    this.instanceSelectionHandles = new Map();
    this.classNames = [this.settings.className];
    this.classNameGenerator = this.linearClassNameGenerator(this.settings.className, this.settings.layerLevel);
    this.selectedCellsDescriptor = [];
  }

  /**
   * Returns information if the current selection is configured to display a corner or a selection handle
   */
  hasSelectionHandle() {
    return this.settings.border && typeof this.settings.border.cornerVisible === 'function';
  }

  /**
   * Each Walkontable clone requires it's own selection handle for every selection. This method creates and returns selection
   * handles per instance
   *
   * @param {Walkontable} wotInstance
   * @returns {SelectionHandle}
   */
  getSelectionHandle(wotInstance) {
    const found = this.getSelectionHandleIfExists(wotInstance);

    if (found) {
      return found;
    }

    const selectionHandle = new SelectionHandle(wotInstance, this.settings);

    this.instanceSelectionHandles.set(wotInstance, selectionHandle);

    return selectionHandle;
  }

  /**
   * Return an existing intance of Border class if defined for a given Walkontable instance
   *
   * @param {Walkontable} wotInstance
   * @returns {SelectionHandle|undefined}
   */
  getSelectionHandleIfExists(wotInstance) {
    return this.instanceSelectionHandles.get(wotInstance);
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

  getSelectedCellsDescriptor() {
    return this.selectedCellsDescriptor;
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
   * Add CSS class names to an element, but only if the element exists
   *
   * @param {HTMLElement} elem
   * @param {Array} classNames
   */
  addClassIfElemExists(elem, classNames) {
    if (elem) {
      addClass(elem, classNames);
    }
  }

  /**
   * @param wotInstance
   */
  draw(wotInstance) {
    this.selectedCellsDescriptor = [];

    if (this.isEmpty()) {
      if (this.hasSelectionHandle()) {
        const found = this.getSelectionHandleIfExists(wotInstance);

        if (found) {
          found.disappear();
        }
      }

      return;
    }

    const renderedRows = wotInstance.wtTable.getRenderedRowsCount();
    const renderedColumns = wotInstance.wtTable.getRenderedColumnsCount();

    const { highlightHeaderClassName, highlightRowClassName, highlightColumnClassName } = this.settings;
    const corners = this.getCorners();
    const [firstRow, firstColumn, lastRow, lastColumn] = corners; // row/column values can be negative if row/column header was clicked

    const tableFirstRenderedRow = wotInstance.wtTable.getFirstRenderedRow(); // -1 when there are no rendered rows
    const tableFirstRenderedColumn = wotInstance.wtTable.getFirstRenderedColumn(); // -1 when there are no rendered columns
    const tableLastRenderedRow = wotInstance.wtTable.getLastRenderedRow(); // null when there are no rendered rows
    const tableLastRenderedColumn = wotInstance.wtTable.getLastRenderedColumn(); // null when there are no rendered columns

    const highlightFirstRenderedRow = Math.max(firstRow, tableFirstRenderedRow);
    const highlightFirstRenderedColumn = Math.max(firstColumn, tableFirstRenderedColumn);
    const highlightLastRenderedRow = Math.min(lastRow, tableLastRenderedRow);
    const highlightLastRenderedColumn = Math.min(lastColumn, tableLastRenderedColumn);

    if (renderedColumns && (highlightHeaderClassName || highlightColumnClassName)) {
      for (let sourceColumn = highlightFirstRenderedColumn; sourceColumn <= highlightLastRenderedColumn; sourceColumn += 1) {
        this.addClassIfElemExists(wotInstance.wtTable.getColumnHeader(sourceColumn), [highlightHeaderClassName, highlightColumnClassName]);

        if (highlightColumnClassName) {
          for (let renderedRow = 0; renderedRow < renderedRows; renderedRow += 1) {
            if (renderedRow < highlightFirstRenderedRow || renderedRow > highlightLastRenderedRow) {
              const sourceRow = wotInstance.wtTable.rowFilter.renderedToSource(renderedRow);

              this.addClassAtCoords(wotInstance, sourceRow, sourceColumn, highlightColumnClassName);
            }
          }
        }
      }
    }

    if (renderedRows && (highlightHeaderClassName || highlightRowClassName)) {
      for (let sourceRow = highlightFirstRenderedRow; sourceRow <= highlightLastRenderedRow; sourceRow += 1) {
        this.addClassIfElemExists(wotInstance.wtTable.getRowHeader(sourceRow), [highlightHeaderClassName, highlightRowClassName]);

        if (highlightRowClassName) {
          for (let renderedColumn = 0; renderedColumn < renderedColumns; renderedColumn += 1) {
            if (renderedColumn < highlightFirstRenderedColumn || renderedColumn > highlightLastRenderedColumn) {
              const sourceColumn = wotInstance.wtTable.columnFilter.renderedToSource(renderedColumn);

              this.addClassAtCoords(wotInstance, sourceRow, sourceColumn, highlightRowClassName);
            }
          }
        }
      }
    }

    if (renderedRows && renderedColumns) {
      if (this.settings.border && highlightFirstRenderedRow <= highlightLastRenderedRow && highlightFirstRenderedColumn <= highlightLastRenderedColumn) {
        const hasTopEdge = highlightFirstRenderedRow === firstRow;
        const hasRightEdge = highlightLastRenderedColumn === lastColumn;
        const hasBottomEdge = highlightLastRenderedRow === lastRow;
        const hasLeftEdge = highlightFirstRenderedColumn === firstColumn;

        const firstTd = wotInstance.wtTable.getCell({ row: highlightFirstRenderedRow, col: highlightFirstRenderedColumn });
        let lastTd;

        if (highlightFirstRenderedRow === highlightLastRenderedRow && highlightFirstRenderedColumn === highlightLastRenderedColumn) {
          lastTd = firstTd;
        } else {
          lastTd = wotInstance.wtTable.getCell({ row: highlightLastRenderedRow, col: highlightLastRenderedColumn });
        }

        this.selectedCellsDescriptor = [this.settings, firstTd, lastTd, hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge];
      }

      for (let sourceRow = highlightFirstRenderedRow; sourceRow <= highlightLastRenderedRow; sourceRow += 1) {
        for (let sourceColumn = highlightFirstRenderedColumn; sourceColumn <= highlightLastRenderedColumn; sourceColumn += 1) {

          if (sourceRow >= highlightFirstRenderedRow
            && sourceRow <= highlightLastRenderedRow
            && sourceColumn >= highlightFirstRenderedColumn
            && sourceColumn <= highlightLastRenderedColumn) {
            // selected cell
            if (this.settings.className) {
              this.addClassAtCoords(wotInstance, sourceRow, sourceColumn, this.settings.className, this.settings.markIntersections);
            }
          }

          if (this.settings.className) {
            // This has a big perf cost. Don't perform this for custom borders

            const additionalSelectionClass = wotInstance.getSetting('onAfterDrawSelection', sourceRow, sourceColumn, corners, this.settings.layerLevel);

            if (typeof additionalSelectionClass === 'string') {
              this.addClassAtCoords(wotInstance, sourceRow, sourceColumn, additionalSelectionClass);
            }
          }

        }
      }
    }

    wotInstance.getSetting('onBeforeDrawBorders', corners, this.settings.className);

    if (this.hasSelectionHandle()) {
      // warning! selectionHandle.appear modifies corners!
      this.getSelectionHandle(wotInstance).appear(corners);
    }
  }

  /**
   * Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.
   */
  destroy() {
    this.instanceSelectionHandles.forEach(selectionHandle => selectionHandle.destroy());
  }
}

export default Selection;
