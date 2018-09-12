/* eslint-disable import/prefer-default-export */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Return ASCII symbol for headers depends on what the class name HTMLTableCellElement has.
 *
 * @param {HTMLTableCellElement} cell
 * @return {String} Returns '   ', ` * ` or ' - '.
 */
function getSelectionSymbolForHeader(cell) {
  const hasActiveHeader = cell.classList.contains('ht__active_highlight');
  const hasHighlight = cell.classList.contains('ht__highlight');

  let symbol = '   ';

  if (hasActiveHeader) {
    symbol = ' * ';

  } else if (hasHighlight) {
    symbol = ' - ';
  }

  return symbol;
}

/**
 * Return ASCII symbol for cells depends on what the class name HTMLTableCellElement has.
 *
 * @param {HTMLTableCellElement} cell
 * @return {String} Returns valid symbol for the pariticaul cell.
 */
function getSelectionSymbolForCell(cell) {
  const hasCurrent = cell.classList.contains('current');
  const hasArea = cell.classList.contains('area');
  let areaLevel = new Array(7)
    .fill()
    .map((_, i, arr) => `area-${arr.length - i}`)
    .find(className => cell.classList.contains(className));

  areaLevel = areaLevel ? parseInt(areaLevel.replace('area-', ''), 10) : areaLevel;

  let symbol = '   ';

  if (hasCurrent && hasArea && areaLevel) {
    symbol = ` ${String.fromCharCode(65 + areaLevel)} `;

  } else if (hasCurrent && hasArea && areaLevel === void 0) {
    symbol = ' A ';

  } else if (hasCurrent && !hasArea && areaLevel === void 0) {
    symbol = ' # ';

  } else if (!hasCurrent && hasArea && areaLevel === void 0) {
    symbol = ' 0 ';

  } else if (!hasCurrent && hasArea && areaLevel) {
    symbol = ` ${areaLevel} `;
  }

  return symbol;
}

/**
 * Generate ASCII symbol for passed cell element.
 *
 * @param {HTMLTableCellElement} cell
 * @return {String}
 */
function getSelectionSymbol(cell) {
  if (isLeftHeader(cell) || isTopHeader(cell)) {
    return getSelectionSymbolForHeader(cell);
  }

  return getSelectionSymbolForCell(cell);
}

/**
 * Check if passed element belong to the left header.
 *
 * @param {HTMLTableCellElement} cell
 * @return {Boolean}
 */
function isLeftHeader(cell) {
  return cell.tagName === 'TH' && cell.parentElement.parentElement.tagName === 'TBODY';
}

/**
 * Check if passed element belong to the rop header.
 *
 * @param {HTMLTableCellElement} cell
 * @return {Boolean}
 */
function isTopHeader(cell) {
  return cell.tagName === 'TH' && cell.parentElement.parentElement.tagName === 'THEAD';
}

/**
 * @param {HTMLTableElement} overlay
 * @return {Function}
 */
function cellFactory(overlay) {
  return (row, column) => overlay && overlay.rows[row] && overlay.rows[row].cells[column];
}

/**
 * Generates table based on Handsontable structure.
 *
 * @param {HTMLElement} context The root element of the Handsontable instance to be generated.
 * @return {String}
 */
export function generateASCIITable(context) {
  const TABLE_EDGES_SYMBOL = '|';
  const COLUMN_SEPARATOR = ':';
  const ROW_HEADER_SEPARATOR = '\u2551';
  const COLUMN_HEADER_SEPARATOR = '===';
  const ROW_OVERLAY_SEPARATOR = '|';
  const COLUMN_OVERLAY_SEPARATOR = '---';

  const cornerOverlayTable = $('.ht_clone_top_left_corner .htCore', context);
  const leftOverlayTable = $('.ht_clone_left .htCore', context);
  const topOverlayTable = $('.ht_clone_top .htCore', context);
  const masterTable = $('.ht_master .htCore', context);
  const stringRows = [];

  const cornerOverlayCells = cellFactory(cornerOverlayTable);
  const leftOverlayCells = cellFactory(leftOverlayTable);
  const topOverlayCells = cellFactory(topOverlayTable);
  const masterCells = cellFactory(masterTable);

  const hasLeftHeader = leftOverlayCells(1, 0) ? isLeftHeader(leftOverlayCells(1, 0)) : false;
  const hasTopHeader = topOverlayCells(0, 1) ? isTopHeader(topOverlayCells(0, 1)) : false;
  const hasCornerHeader = hasLeftHeader && hasTopHeader;
  const hasFixedLeftCells = leftOverlayCells(1, 1) ? !isLeftHeader(leftOverlayCells(1, 1)) : false;
  const hasFixedTopCells = topOverlayCells(1, 1) ? !isTopHeader(topOverlayCells(1, 1)) : false;

  const consumedFlags = new Map([
    ['hasLeftHeader', hasLeftHeader],
    ['hasTopHeader', hasTopHeader],
    ['hasCornerHeader', hasCornerHeader],
    ['hasFixedLeftCells', hasFixedLeftCells],
    ['hasFixedTopCells', hasLeftHeader],
  ]);

  const rowsLength = masterTable.rows.length;

  for (let r = 0; r < rowsLength; r++) {
    const stringCells = [];
    const columnsLength = masterTable.rows[0].cells.length;
    let isLastColumn = false;
    let insertTopOverlayRowSeparator = false;

    for (let c = 0; c < columnsLength; c++) {
      let cellSymbol;
      let separatorSymbol = COLUMN_SEPARATOR;

      isLastColumn = c === columnsLength - 1;

      if (cornerOverlayCells(r, c)) {
        const cell = cornerOverlayCells(r, c);
        const nextCell = cornerOverlayCells(r, c + 1);

        cellSymbol = getSelectionSymbol(cell);

        if (isLeftHeader(cell) && (!nextCell || !isLeftHeader(nextCell))) {
          separatorSymbol = ROW_HEADER_SEPARATOR;
        }
        if (!isLeftHeader(cell) && !nextCell) {
          separatorSymbol = ROW_OVERLAY_SEPARATOR;
        }
        if (r === 0 && c === 0 && hasCornerHeader) { // Fix for header symbol
          separatorSymbol = ROW_HEADER_SEPARATOR;
        }

      } else if (leftOverlayCells(r, c)) {
        const cell = leftOverlayCells(r, c);
        const nextCell = leftOverlayCells(r, c + 1);

        cellSymbol = getSelectionSymbol(cell);

        if (isLeftHeader(cell) && (!nextCell || !isLeftHeader(nextCell))) {
          separatorSymbol = ROW_HEADER_SEPARATOR;
        }
        if (!isLeftHeader(cell) && !nextCell) {
          separatorSymbol = ROW_OVERLAY_SEPARATOR;
        }

      } else if (topOverlayCells(r, c)) {
        const cell = topOverlayCells(r, c);

        cellSymbol = getSelectionSymbol(cell);

        if (hasFixedTopCells && isLastColumn && !topOverlayCells(r + 1, c)) {
          insertTopOverlayRowSeparator = true;
        }

      } else if (masterCells(r, c)) {
        const cell = masterCells(r, c);

        cellSymbol = getSelectionSymbol(cell);
      }

      stringCells.push(cellSymbol);

      if (!isLastColumn) {
        stringCells.push(separatorSymbol);
      }
    }

    stringRows.push(TABLE_EDGES_SYMBOL + stringCells.join('') + TABLE_EDGES_SYMBOL);

    if (consumedFlags.get('hasTopHeader')) {
      consumedFlags.delete('hasTopHeader');
      stringRows.push(TABLE_EDGES_SYMBOL + new Array(columnsLength).fill(COLUMN_HEADER_SEPARATOR).join(COLUMN_SEPARATOR) + TABLE_EDGES_SYMBOL);
    }
    if (insertTopOverlayRowSeparator) {
      insertTopOverlayRowSeparator = false;
      stringRows.push(TABLE_EDGES_SYMBOL + new Array(columnsLength).fill(COLUMN_OVERLAY_SEPARATOR).join(COLUMN_SEPARATOR) + TABLE_EDGES_SYMBOL);
    }
  }

  return stringRows.join('\n');
}
