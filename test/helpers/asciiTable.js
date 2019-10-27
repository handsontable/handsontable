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

const TABLE_EDGES_SYMBOL = '|';
const COLUMN_SEPARATOR = ':';
const ROW_HEADER_SEPARATOR = '\u2551';
const COLUMN_HEADER_SEPARATOR = '===';
const ROW_OVERLAY_SEPARATOR = '|';
const COLUMN_OVERLAY_SEPARATOR = '---';

/**
 * Generates table based on Handsontable structure.
 *
 * @param {HTMLElement} context The root element of the Handsontable instance to be generated.
 * @return {String}
 */
export function generateASCIITable(context) {
  const cornerOverlayTable = $('.ht_clone_top_left_corner .htCore', context);
  const leftOverlayTable = $('.ht_clone_left .htCore', context);
  const topOverlayTable = $('.ht_clone_top .htCore', context);
  const masterTable = $('.ht_master .htCore', context);
  const stringRowsLeft = [];
  const stringRowsRight = [];
  let skipLeft = 0;
  let skipTop = 0;

  if (cornerOverlayTable) {
    stringRowsLeft.push(...generateASCIISubtable(cornerOverlayTable, 0, 0, true));
    const countCols = cornerOverlayTable.rows[0].cells.length;
    skipLeft = countCols;
    const separator = cornerOverlayTable.rows.length > 1 ? COLUMN_OVERLAY_SEPARATOR : COLUMN_HEADER_SEPARATOR;
    stringRowsLeft.push(new Array(countCols).fill(separator).join(COLUMN_SEPARATOR) + COLUMN_SEPARATOR);
  }
  if (topOverlayTable) {
    stringRowsRight.push(...generateASCIISubtable(topOverlayTable, 0, skipLeft, false));
    const countCols = topOverlayTable.rows[0].cells.length - skipLeft;
    skipTop = 1;
    const separator = topOverlayTable.rows.length > 1 ? COLUMN_OVERLAY_SEPARATOR : COLUMN_HEADER_SEPARATOR;
    stringRowsRight.push(new Array(countCols).fill(separator).join(COLUMN_SEPARATOR));
    // stringRowsRight.push(new Array(countCols).fill(COLUMN_OVERLAY_SEPARATOR).join(COLUMN_SEPARATOR));
  }
  if (leftOverlayTable) {
    stringRowsLeft.push(...generateASCIISubtable(leftOverlayTable, skipTop, 0, true));
    const countCols = leftOverlayTable.rows[0].cells.length;
    skipLeft = countCols;
  }
  if (masterTable) {
    stringRowsRight.push(...generateASCIISubtable(masterTable, skipTop, skipLeft, false));
  }

  let stringRows = [];

  if (stringRowsLeft.length) {
    stringRows = stringRowsLeft.map((stringRow, index) => {
      return `${TABLE_EDGES_SYMBOL}${stringRow}${stringRowsRight[index]}${TABLE_EDGES_SYMBOL}`;
    });
  } else {
    stringRows = stringRowsRight.map(stringRow => `${TABLE_EDGES_SYMBOL}${stringRow}${TABLE_EDGES_SYMBOL}`);
  }

  return stringRows.join('\n');
}

function generateASCIISubtable(table, skipTop, skipLeft, isLeft) {
  const stringRows = [];
  const rowsLength = table.rows.length;
  const getCell = cellFactory(table);
  let cell;
  let wasTopHeader = false;

  for (let r = skipTop; r < rowsLength; r++) {
    const stringCells = [];
    const columnsLength = table.rows[0].cells.length;
    let isLastColumn = false;

    for (let c = skipLeft; c < columnsLength; c++) {
      let separatorSymbol = COLUMN_SEPARATOR;

      isLastColumn = c === columnsLength - 1;

      cell = getCell(r, c);
      const nextCell = getCell(r, c + 1);
      const cellSymbol = getSelectionSymbol(cell);

      if (isTopHeader(cell)) {
        wasTopHeader = true;
      }
      if (isLeftHeader(cell) && (!nextCell || !isLeftHeader(nextCell))) {
        separatorSymbol = ROW_HEADER_SEPARATOR;
      }
      if (!isLeftHeader(cell) && !nextCell) {
        separatorSymbol = ROW_OVERLAY_SEPARATOR;
      }
      if (r === 0 && c === 0 && isLeft) { // Fix for header symbol
        separatorSymbol = ROW_HEADER_SEPARATOR;
      }

      stringCells.push(cellSymbol);

      if (isLeft || !isLastColumn) {
        stringCells.push(separatorSymbol);
      }
    }

    if (wasTopHeader && !isTopHeader(cell)) {
      wasTopHeader = false;
      let str = new Array(columnsLength - skipLeft).fill(COLUMN_HEADER_SEPARATOR).join(COLUMN_SEPARATOR);
      if (isLeft) {
        str += COLUMN_SEPARATOR;
      }
      stringRows.push(str);
    }

    stringRows.push(stringCells.join(''));
  }

  return stringRows;
}
