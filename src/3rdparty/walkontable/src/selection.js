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
    return this.cellRange.getCorners();
  }

  /**
   * Adds class name to cell element at given coords
   *
   * @param {Table} wtTable
   * @param {Number} sourceRow Cell row coord
   * @param {Number} sourceColumn Cell column coord
   * @param {String} className Class name
   * @param {Boolean} [markIntersections=false] If `true`, linear className generator will be used to add CSS classes
   *                                            in a continuous way.
   * @returns {Selection}
   */
  addClassAtCoords(wtTable, sourceRow, sourceColumn, className, markIntersections = false) {
    const TD = wtTable.getCell(new CellCoords(sourceRow, sourceColumn));

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
   * Renders the selection if it is within the current viewport.
   *
   * Returns an array of arrays that contain information about border edges renderable in the current selection or null,
   * if no border edges should be rendered for the current viewport. Every nested array has the structure that is
   * expected by {@link BorderRenderer.convertArgsToLines}.
   *
   * @param {Walkontable} wotInstance
   * @param {number} tableRowsCount
   * @param {number} tableColumnsCount
   * @param {number} tableStartRow Source index of the first rendered row in the table. Expecting -1 when there are no rendered rows
   * @param {number} tableStartColumn Source index of the first rendered column in the table. Expecting -1 when there are no rendered columns
   * @param {number} tableEndRow Source index of the last rendered row in the table. Expecting  -1 when there are no rendered rows
   * @param {number} tableEndColumn Source index of the last rendered column in the table. Expecting -1 when there are no rendered columns
   * @returns {Array.<Array.<*>>}
   */
  draw(wotInstance,
       tableRowsCount, tableColumnsCount,
       tableStartRow, tableStartColumn, tableEndRow, tableEndColumn) {
    if (this.isEmpty()) {
      if (this.hasSelectionHandle()) {
        const found = this.getSelectionHandleIfExists(wotInstance);

        if (found) {
          found.disappear();
        }
      }

      return;
    }

    const { wtTable } = wotInstance;

    const { highlightHeaderClassName, highlightRowClassName, highlightColumnClassName } = this.settings;
    const selectionCorners = this.getCorners();
    const [selectionSettingTop, selectionSettingLeft, selectionSettingBottom, selectionSettingRight] = selectionCorners; // row/column values can be negative if row/column header was clicked

    const selectionStartRow = Math.max(selectionSettingTop, tableStartRow);
    const selectionStartColumn = Math.max(selectionSettingLeft, tableStartColumn);
    const selectionEndRow = Math.min(selectionSettingBottom, tableEndRow);
    const selectionEndColumn = Math.min(selectionSettingRight, tableEndColumn);
    const selectionStart = { row: selectionStartRow, col: selectionStartColumn };
    const selectionEnd = { row: selectionEndRow, col: selectionEndColumn };
    const hasTopEdge = selectionStartRow === selectionSettingTop;
    const hasRightEdge = selectionEndColumn === selectionSettingRight;
    const hasBottomEdge = selectionEndRow === selectionSettingBottom;
    const hasLeftEdge = selectionStartColumn === selectionSettingLeft;
    let borderEdgesDescriptor;
    const getCellFn = wtTable.getCell.bind(wtTable);

    if (tableColumnsCount && (highlightHeaderClassName || highlightColumnClassName)) {
      for (let sourceColumn = selectionStartColumn; sourceColumn <= selectionEndColumn; sourceColumn += 1) {
        this.addClassIfElemExists(wtTable.getColumnHeader(sourceColumn), [highlightHeaderClassName, highlightColumnClassName]);

        if (highlightColumnClassName) {
          for (let renderedRow = 0; renderedRow < tableRowsCount; renderedRow += 1) {
            if (renderedRow < selectionStartRow || renderedRow > selectionEndRow) {
              const sourceRow = wtTable.rowFilter.renderedToSource(renderedRow);

              this.addClassAtCoords(wtTable, sourceRow, sourceColumn, highlightColumnClassName);
            }
          }
        }
      }
    }

    if (tableRowsCount && (highlightHeaderClassName || highlightRowClassName)) {
      for (let sourceRow = selectionStartRow; sourceRow <= selectionEndRow; sourceRow += 1) {
        this.addClassIfElemExists(wtTable.getRowHeader(sourceRow), [highlightHeaderClassName, highlightRowClassName]);

        if (highlightRowClassName) {
          for (let renderedColumn = 0; renderedColumn < tableColumnsCount; renderedColumn += 1) {
            if (renderedColumn < selectionStartColumn || renderedColumn > selectionEndColumn) {
              const sourceColumn = wtTable.columnFilter.renderedToSource(renderedColumn);

              this.addClassAtCoords(wtTable, sourceRow, sourceColumn, highlightRowClassName);
            }
          }
        }
      }
    }

    if (tableRowsCount && tableColumnsCount) {
      if (this.settings.border && selectionStartRow <= selectionEndRow && selectionStartColumn <= selectionEndColumn) {
        borderEdgesDescriptor = [this.settings, getCellFn, selectionStart, selectionEnd, hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge];
      }

      for (let sourceRow = selectionStartRow; sourceRow <= selectionEndRow; sourceRow += 1) {
        for (let sourceColumn = selectionStartColumn; sourceColumn <= selectionEndColumn; sourceColumn += 1) {

          if (sourceRow >= selectionStartRow
            && sourceRow <= selectionEndRow
            && sourceColumn >= selectionStartColumn
            && sourceColumn <= selectionEndColumn) {
            // selected cell
            if (this.settings.className) {
              this.addClassAtCoords(wtTable, sourceRow, sourceColumn, this.settings.className, this.settings.markIntersections);
            }
          }

          if (this.settings.className) {
            // This has a big perf cost. Don't perform this for custom borders

            const additionalSelectionClass = wotInstance.getSetting('onAfterDrawSelection', sourceRow, sourceColumn, selectionCorners, this.settings.layerLevel);

            if (typeof additionalSelectionClass === 'string') {
              this.addClassAtCoords(wtTable, sourceRow, sourceColumn, additionalSelectionClass);
            }
          }

        }
      }
    }

    wotInstance.getSetting('onBeforeDrawBorders', selectionCorners, this.settings.className);

    if (this.hasSelectionHandle()) {
      // warning! selectionHandle.appear modifies corners!
      this.getSelectionHandle(wotInstance).appear(selectionCorners);
    }

    return borderEdgesDescriptor;
  }

  /**
   * Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.
   */
  destroy() {
    this.instanceSelectionHandles.forEach(selectionHandle => selectionHandle.destroy());
  }
}

export default Selection;
