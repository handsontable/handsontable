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
   */
  setActiveOverlay(activeOverlaysWot) {
    this.#activeOverlaysWot = activeOverlaysWot;
  }

  /**
   * Sets the Selection instance to process.
   *
   * @param {Selection} selection The Selection instance.
   */
  setActiveSelection(selection) {
    this.#selection = selection;
  }

  /**
   * Scans the table (only rendered headers) and collect all column headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @returns {Set<TH>}
   */
  scanColumnsInHeadersRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();
    const columnHeadersCount = wtTable.getColumnHeadersCount();
    const headers = new Set();
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

        headers.add(TH);
      }

      cursor += 1;
    }

    return headers;
  }

  /**
   * Scans the table (only rendered headers) and collect all row headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @returns {Set<TH>}
   */
  scanRowsInHeadersRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const rowHeadersCount = wtTable.getRowHeadersCount();
    const headers = new Set();
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

        headers.add(TH);
      }

      cursor += 1;
    }

    return headers;
  }

  /**
   * Scans the table (only rendered cells) and collect all cells (TR) that match
   * the coordinates passed in the Selection instance.
   *
   * @returns {Set<TR>}
   */
  scanCellsRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow && sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        // support for old API
        const additionalSelectionClass = this.#activeOverlaysWot
          .getSetting('onAfterDrawSelection', sourceRow, sourceColumn, this.#selection.settings.layerLevel);

        if (typeof additionalSelectionClass === 'string') {
          addClass(cell, additionalSelectionClass);
        }

        cells.add(cell);
      }
    });

    return cells;
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the X axis (rows).
   *
   * @returns {Set<TR>}
   */
  scanRowsInCellsRange() {
    // eslint-disable-next-line comma-spacing
    const [topRow,, bottomRow,] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.add(cell);
      }
    });

    return cells;
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the Y axis (columns).
   *
   * @returns {Set<TR>}
   */
  scanColumnsInCellsRange() {
    const [, topColumn,, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.add(cell);
      }
    });

    return cells;
  }

  /**
   * The method triggers a callback for each rendered cell.
   *
   * @param {function(number, number): void} callback The callback function to trigger.
   */
  #scanCellsRange(callback) {
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
