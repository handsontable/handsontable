const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => context.querySelectorAll(selector);

/**
 * Return ASCII symbol for cells depends on what the class name HTMLTableCellElement has.
 *
 * @param {HTMLTableCellElement} cell The cell element to process.
 * @returns {string} Returns valid symbol for the particular cell.
 */
function getSelectionSymbol(cell) {
  const hasCurrent = cell.classList.contains('current');
  const hasRow = cell.classList.contains('row');
  const hasColumn = cell.classList.contains('column');
  const hasCustom = cell.classList.contains('custom');
  const hasArea = cell.classList.contains('area');
  const hasFill = cell.classList.contains('fill');
  const hasActiveHeader = cell.classList.contains('ht__active_highlight');
  const hasHighlight = cell.classList.contains('ht__highlight');
  const isMergedCellMultiple = cell.classList.contains('fullySelectedMergedCell-multiple');
  let areaLevel = new Array(7)
    .fill()
    .map((_, i, arr) => `area-${arr.length - i}`)
    .find(className => cell.classList.contains(className));

  if (typeof areaLevel === 'string') {
    areaLevel = parseInt(areaLevel.replace('area-', ''), 10);
  }

  let areaLevelMergedCell;

  if (isMergedCellMultiple) {
    areaLevelMergedCell = 0;

  } else {
    areaLevelMergedCell = new Array(7)
      .fill()
      .map((_, i, arr) => `fullySelectedMergedCell-${arr.length - i - 1}`)
      .find(className => cell.classList.contains(className));

    if (typeof areaLevelMergedCell === 'string') {
      areaLevelMergedCell = parseInt(areaLevelMergedCell.replace('fullySelectedMergedCell-', ''), 10);
    }
  }

  let symbol = '   ';

  if (hasRow) {
    symbol = ' r ';

  } else if (hasColumn) {
    symbol = ' c ';

  } else if (hasCurrent && hasArea && areaLevel) {
    symbol = ` ${String.fromCharCode(65 + areaLevel)} `;

  } else if (hasCurrent && hasArea && areaLevel === undefined) {
    symbol = ' A ';

  } else if (hasCurrent && !hasArea && areaLevel === undefined) {
    symbol = ' # ';

  } else if (
    cell.colSpan === 1 && cell.rowSpan === 1 && !hasCurrent && hasArea && areaLevel === undefined
  ) {
    symbol = ' 0 ';

  } else if (
    cell.colSpan === 1 && cell.rowSpan === 1 && !hasCurrent && hasArea && areaLevel
  ) {
    symbol = ` ${areaLevel} `;

  } else if (
    (cell.colSpan > 1 || cell.rowSpan > 1) && !hasCurrent && hasArea && areaLevelMergedCell === undefined
  ) {
    symbol = '   ';

  } else if (
    (cell.colSpan > 1 || cell.rowSpan > 1) && !hasCurrent && hasArea && areaLevelMergedCell !== undefined
  ) {
    symbol = ` ${areaLevelMergedCell} `;

  } else if (hasActiveHeader) {
    symbol = ' * ';

  } else if (hasHighlight) {
    symbol = ' - ';

  } else if (hasCustom) {
    symbol = ' ? ';

  } else if (hasFill) {
    symbol = ' F ';
  }

  return symbol;
}

/**
 * Generates table based on Handsontable structure.
 *
 * @param {HTMLElement} context The root element of the Handsontable instance to be generated.
 * @returns {string}
 */
export function generateASCIITable(context) {
  const TABLE_EDGES_SYMBOL = '|';
  const COLUMN_SEPARATOR = ':';
  const ROW_HEADER_SEPARATOR = '\u2551';
  const COLUMN_HEADER_SEPARATOR = '===';
  const ROW_OVERLAY_SEPARATOR = '|';
  const COLUMN_OVERLAY_SEPARATOR = '---';

  const inlineStartOverlayTable = $('.ht_clone_inline_start .htCore', context);
  const topOverlayTable = $('.ht_clone_top .htCore', context);
  const topStartCornerOverlayTable = $('.ht_clone_top_inline_start_corner .htCore', context);
  const bottomOverlayTable = $('.ht_clone_bottom .htCore', context);
  const masterTable = $('.ht_master .htCore', context);

  const topHeadersCount = $$('thead tr', topOverlayTable).length ||
    $$('thead tr', topStartCornerOverlayTable).length;
  const leftHeadersCount = $$('tbody tr:first-of-type th', inlineStartOverlayTable).length ||
    $$('thead tr:first-of-type th', topStartCornerOverlayTable).length;
  const fixedTopCellsCount = $$('tbody tr', topOverlayTable).length;
  const fixedLeftCellsCount = $$('tbody tr:first-of-type td', inlineStartOverlayTable).length;
  const rowsLength = masterTable.rows.length;
  const isRtl = $('.ht_master').dir === 'rtl';
  const stringRows = [];
  let headerRootSymbol = '';

  for (let r = 0; r < rowsLength; r++) {
    const stringCells = [];
    const columnsLength = masterTable.rows[0].cells.length;

    for (let c = 0; c < columnsLength; c++) {
      const cellElement = masterTable.rows[r].cells[c];
      const nextCellElement = masterTable.rows[r].cells[c + 1];
      let symbol = getSelectionSymbol(cellElement);
      let separatorSymbol = COLUMN_SEPARATOR;

      // support for nested headers
      if (
        cellElement.nodeName === 'TH' &&
        (cellElement.colSpan > 1 || cellElement.classList.contains('hiddenHeader') &&
        (!nextCellElement || nextCellElement.classList.contains('hiddenHeader')))
      ) {
        separatorSymbol = ' ';

        if (cellElement.colSpan > 1) {
          headerRootSymbol = symbol;
        }

      } else if (
        cellElement.nodeName === 'TD' &&
        (cellElement.colSpan > 1 || cellElement.style.display === 'none' &&
        (!nextCellElement || nextCellElement.style.display === 'none'))
      ) {
        separatorSymbol = ' ';

        if (cellElement.colSpan > 1) {
          headerRootSymbol = symbol;
        }

      } else if (c === leftHeadersCount - 1) {
        separatorSymbol = ROW_HEADER_SEPARATOR;

      } else if (c === leftHeadersCount + fixedLeftCellsCount - 1) {
        separatorSymbol = ROW_OVERLAY_SEPARATOR;
      }

      if (cellElement.classList.contains('hiddenHeader')) {
        symbol = headerRootSymbol;
      }

      if (cellElement) {
        stringCells.push(symbol);
      }

      const isLastColumn = c === columnsLength - 1;

      if (!isLastColumn) {
        stringCells.push(separatorSymbol);
      }
    }

    if (r === rowsLength - bottomOverlayTable.rows.length) {
      stringRows.push(TABLE_EDGES_SYMBOL + new Array(columnsLength)
        .fill(COLUMN_OVERLAY_SEPARATOR).join(COLUMN_SEPARATOR) + TABLE_EDGES_SYMBOL);
    }

    const cellsStringified = (isRtl ? stringCells.reverse() : stringCells).join('');

    stringRows.push(TABLE_EDGES_SYMBOL + cellsStringified + TABLE_EDGES_SYMBOL);

    if (r === topHeadersCount - 1) {
      stringRows.push(TABLE_EDGES_SYMBOL + new Array(columnsLength)
        .fill(COLUMN_HEADER_SEPARATOR).join(COLUMN_SEPARATOR) + TABLE_EDGES_SYMBOL);

    } else if (r === topHeadersCount + fixedTopCellsCount - 1) {
      stringRows.push(TABLE_EDGES_SYMBOL + new Array(columnsLength)
        .fill(COLUMN_OVERLAY_SEPARATOR).join(COLUMN_SEPARATOR) + TABLE_EDGES_SYMBOL);
    }
  }

  return stringRows.join('\n');
}
