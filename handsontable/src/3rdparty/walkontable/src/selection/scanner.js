/* eslint-disable no-continue */
import { addClass } from '../../../../helpers/dom/element';

/**
 * Selection scanner module scans the rendered cells and headers and if it finds an intersection with
 * the coordinates of the Selection class (highlight) it returns the DOM elements.
 *
 * @private
 */
export class SelectionScanner {
  /**
   * Active Selection instance to process.
   *
   * @type {Selection}
   */
  #selection;
  /**
   * The Walkontable instance that the scans depends on.
   *
   * @type {Walkontable}
   */
  #activeOverlaysWot;

  /**
   * Sets the Walkontable instance that will be taking into account while scanning the table.
   *
   * @param {Walkontable} activeOverlaysWot The Walkontable instance.
   * @returns {SelectionScanner}
   */
  setActiveOverlay(activeOverlaysWot) {
    this.#activeOverlaysWot = activeOverlaysWot;

    return this;
  }

  /**
   * Sets the Selection instance to process.
   *
   * @param {Selection} selection The Selection instance.
   * @returns {SelectionScanner}
   */
  setActiveSelection(selection) {
    this.#selection = selection;

    return this;
  }

  /**
   * Scans the rendered table with selection and returns elements that intersects
   * with selection coordinates.
   *
   * @returns {HTMLTableElement[]}
   */
  scan() {
    const selectionType = this.#selection.settings.selectionType;
    const elements = new Set();

    // TODO(improvement): use heuristics from coords to detect what type of scan
    // the Selection needs instead of using `selectionType` property.
    if (selectionType === 'active-header') {
      this.scanColumnsInHeadersRange(element => elements.add(element));
      this.scanRowsInHeadersRange(element => elements.add(element));

    } else if (selectionType === 'area') {
      this.scanCellsRange(element => elements.add(element));

    } else if (selectionType === 'focus') {
      this.scanColumnsInHeadersRange(element => elements.add(element));
      this.scanRowsInHeadersRange(element => elements.add(element));
      this.scanCellsRange(element => elements.add(element));

    } else if (selectionType === 'fill') {
      this.scanCellsRange(element => elements.add(element));

    } else if (selectionType === 'header') {
      this.scanColumnsInHeadersRange(element => elements.add(element));
      this.scanRowsInHeadersRange(element => elements.add(element));

    } else if (selectionType === 'row') {
      this.scanRowsInHeadersRange(element => elements.add(element));
      this.scanRowsInCellsRange(element => elements.add(element));

    } else if (selectionType === 'column') {
      this.scanColumnsInHeadersRange(element => elements.add(element));
      this.scanColumnsInCellsRange(element => elements.add(element));
    }

    return elements;
  }

  /**
   * Scans the table (only rendered headers) and collect all column headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanColumnsInHeadersRange(callback) {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();
    const columnHeadersCount = wtTable.getColumnHeadersCount();
    let cursor = 0;

    for (let column = -wtTable.getRowHeadersCount(); column < renderedColumnsCount; column++) {
      const sourceColumn = wtTable.columnFilter.renderedToSource(column);

      if (sourceColumn < topColumn || sourceColumn > bottomColumn) {
        continue;
      }

      for (let headerLevel = -columnHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topRow || headerLevel > bottomRow) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + columnHeadersCount;
        let TH = wtTable.getColumnHeader(sourceColumn, positiveBasedHeaderLevel);
        const newSourceCol = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingColumnHeader', sourceColumn, positiveBasedHeaderLevel, {
            selectionType: this.#selection.settings.selectionType,
            columnCursor: cursor,
            selectionWidth: bottomColumn - topColumn + 1,
          });

        if (newSourceCol === null) {
          continue;
        }

        if (newSourceCol !== sourceColumn) {
          TH = wtTable.getColumnHeader(newSourceCol, positiveBasedHeaderLevel);
        }

        callback(TH);
      }

      cursor += 1;
    }
  }

  /**
   * Scans the table (only rendered headers) and collect all row headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanRowsInHeadersRange(callback) {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const rowHeadersCount = wtTable.getRowHeadersCount();
    let cursor = 0;

    for (let row = -wtTable.getColumnHeadersCount(); row < renderedRowsCount; row++) {
      const sourceRow = wtTable.rowFilter.renderedToSource(row);

      if (sourceRow < topRow || sourceRow > bottomRow) {
        continue;
      }

      for (let headerLevel = -rowHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topColumn || headerLevel > bottomColumn) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + rowHeadersCount;
        let TH = wtTable.getRowHeader(sourceRow, positiveBasedHeaderLevel);
        const newSourceRow = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingRowHeader', sourceRow, positiveBasedHeaderLevel, {
            selectionType: this.#selection.settings.selectionType,
            rowCursor: cursor,
            selectionHeight: bottomRow - topRow + 1,
          });

        if (newSourceRow === null) {
          continue;
        }

        if (newSourceRow !== sourceRow) {
          TH = wtTable.getRowHeader(newSourceRow, positiveBasedHeaderLevel);
        }

        callback(TH);
      }

      cursor += 1;
    }
  }

  /**
   * Scans the table (only rendered cells) and collect all cells (TR) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanCellsRange(callback) {
    const { wtTable } = this.#activeOverlaysWot;

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

      // support for old API
      const additionalSelectionClass = this.#activeOverlaysWot
        .getSetting('onAfterDrawSelection',
          sourceRow,
          sourceColumn,
          this.#selection.settings.layerLevel,
        );

      if (typeof additionalSelectionClass === 'string') {
        addClass(cell, additionalSelectionClass);
      }

      callback(cell);
    });
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the X axis (rows).
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanRowsInCellsRange(callback) {
    // eslint-disable-next-line comma-spacing
    const [topRow,, bottomRow,] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;

    this.#scanViewportRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        callback(cell);
      }
    });
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the Y axis (columns).
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanColumnsInCellsRange(callback) {
    const [, topColumn,, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;

    this.#scanViewportRange((sourceRow, sourceColumn) => {
      if (sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        callback(cell);
      }
    });
  }

  /**
   * The method triggers a callback for each rendered cell.
   *
   * @param {function(number, number): void} callback The callback function to trigger.
   */
  #scanCellsRange(callback) {
    let [topRow, startColumn, bottomRow, endColumn] = this.#selection.getCorners();

    if (topRow < 0 && bottomRow < 0 || startColumn < 0 && endColumn < 0) {
      return;
    }

    const { wtTable } = this.#activeOverlaysWot;
    const isMultiple = (topRow !== bottomRow || startColumn !== endColumn);

    startColumn = Math.max(startColumn, 0);
    endColumn = Math.max(endColumn, 0);
    topRow = Math.max(topRow, 0);
    bottomRow = Math.max(bottomRow, 0);

    if (isMultiple) {
      startColumn = Math.max(startColumn, wtTable.getFirstRenderedColumn());
      endColumn = Math.min(endColumn, wtTable.getLastRenderedColumn());
      topRow = Math.max(topRow, wtTable.getFirstRenderedRow());
      bottomRow = Math.min(bottomRow, wtTable.getLastRenderedRow());

      if (endColumn < startColumn || bottomRow < topRow) {
        return;
      }

    } else {
      const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(topRow, startColumn));

      if (!(cell instanceof HTMLElement)) {
        return;
      }
    }

    for (let row = topRow; row <= bottomRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        callback(row, column);
      }
    }
  }

  /**
   * The method triggers a callback for each rendered cell including headers.
   *
   * @param {function(number, number): void} callback The callback function to trigger.
   */
  #scanViewportRange(callback) {
    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();

    for (let row = 0; row < renderedRowsCount; row += 1) {
      const sourceRow = wtTable.rowFilter.renderedToSource(row);

      for (let column = 0; column < renderedColumnsCount; column += 1) {
        callback(sourceRow, wtTable.columnFilter.renderedToSource(column));
      }
    }
  }
}
