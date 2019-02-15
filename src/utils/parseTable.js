import { isEmpty } from './../helpers/mixed';

/**
 * Converts Handsontable into HTMLTableElement
 * @param {Handsontable} instance
 */
export function handsontableToHTMLTable(instance) {
  const doc = instance.rootDocument;
  const hasColumnHeaders = instance.hasColHeaders();
  const hasRowHeaders = instance.hasRowHeaders();

  const coords = [
    hasColumnHeaders ? -1 : 0,
    hasRowHeaders ? -1 : 0,
    instance.countRows() - 1,
    instance.countCols() - 1,
  ];
  const data = instance.getData(...coords);

  const countRows = data.length;
  const countCols = countRows > 0 ? data[0].length : 0;

  const TABLE = doc.createElement('table');
  const THEAD = hasColumnHeaders ? TABLE.createTHead() : null;
  const TBODY = TABLE.createTBody();

  for (let row = 0; row < countRows; row += 1) {
    const isColumnHeadersRow = hasColumnHeaders && row === 0;
    const TR = isColumnHeadersRow ? THEAD.insertRow() : TBODY.insertRow();

    for (let column = 0; column < countCols; column += 1) {
      const isRowHeadersColumn = !isColumnHeadersRow && hasRowHeaders && column === 0;

      if (isColumnHeadersRow) {
        const TH = doc.createElement('th');
        TH.innerText = instance.getColHeader(hasRowHeaders ? column - 1 : column);
        TR.appendChild(TH);

      } else if (isRowHeadersColumn) {
        const TH = doc.createElement('th');
        TH.innerText = instance.getRowHeader(hasColumnHeaders ? row - 1 : row);
        TR.appendChild(TH);

      } else {
        const CELL = TR.insertCell();
        const cellData = data[row][column];
        CELL.innerText = isEmpty(cellData) ? '' : cellData;
      }
    }
  }

  return TABLE;
}

/**
 * Converts javascript array into HTMLTable.
 *
 * @param {Array} input Input array which will be converted to HTMLTable
 */
export function arrayToTable(input, rootDocument) {
  const inputLen = input.length;
  const result = ['<table>'];

  const tempElement = rootDocument.createElement('div');
  rootDocument.documentElement.appendChild(tempElement);

  for (let row = 0; row < inputLen; row += 1) {
    const rowData = input[row];
    const columnsLen = rowData.length;
    const columnsResult = [];

    if (row === 0) {
      result.push('<tbody>');
    }

    for (let column = 0; column < columnsLen; column += 1) {
      tempElement.innerText = `${isEmpty(rowData[column]) ? '' : rowData[column]}`;

      columnsResult.push(`<td>${tempElement.innerHTML}</td>`);
    }

    result.push('<tr>', ...columnsResult, '</tr>');

    if (row + 1 === inputLen) {
      result.push('</tbody>');
    }
  }

  rootDocument.documentElement.removeChild(tempElement);

  result.push('</table>');

  return result.join('');
}

/**
 * Helper to verify if DOM element is an HTMLTable element.
 *
 * @param {Element} element Node element to verify if it's an HTMLTable.
 */
function isHTMLTable(element) {
  return (element && element.nodeName || '').toLowerCase() === 'table';
}

/**
 * Converts HTMLTable or string into array.
 *
 * @param {Element|String} element Node element or string, which should contain `<table>...</table>`.
 */
export function tableToArray(element, rootDocument) {
  const result = [];
  let checkElement = element;

  if (typeof checkElement === 'string') {
    const tempElem = rootDocument.createElement('div');
    tempElem.innerHTML = checkElement.replace(/\n/g, '');
    checkElement = tempElem.querySelector('table');
  }

  if (checkElement && isHTMLTable(checkElement)) {
    const rows = checkElement.rows;
    const rowsLen = rows && rows.length;
    const tempArray = [];

    for (let row = 0; row < rowsLen; row += 1) {
      const cells = rows[row].cells;
      const cellsLen = cells.length;
      const newRow = [];

      for (let column = 0; column < cellsLen; column += 1) {
        const cell = cells[column];
        cell.innerHTML = cell.innerHTML.trim().replace(/<br(.|)>(\n?)/, '\n');
        const cellText = cell.innerText;

        newRow.push(cellText);
      }

      tempArray.push(newRow);
    }

    result.push(...tempArray);
  }

  return result;
}
