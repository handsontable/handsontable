import { isEmpty } from './../helpers/mixed';

/**
 * Converts Handsontable into HTMLTableElement
 * @param {Handsontable} instance
 */
export function convertToHTMLTable({ instance, options = {} }) {
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

  const TABLE = ['<table>', '</table>'];
  const THEAD = ['<thead>', '</thead>'];
  const TBODY = ['<tbody>', '</tbody>'];

  const TEMP_ELEM = doc.createElement('div');

  for (let row = 0; row < countRows; row += 1) {
    const isColumnHeadersRow = hasColumnHeaders && row === 0;
    const CELLS = [];

    for (let column = 0; column < countCols; column += 1) {
      const isRowHeadersColumn = !isColumnHeadersRow && hasRowHeaders && column === 0;
      let cell = '';

      if (isColumnHeadersRow) {
        TEMP_ELEM.innerText = instance.getColHeader(hasRowHeaders ? column - 1 : column);
        cell = `<th>${TEMP_ELEM.innerHTML}</th>`;

      } else if (isRowHeadersColumn) {
        TEMP_ELEM.innerText = instance.getRowHeader(hasColumnHeaders ? row - 1 : row);
        cell = `<th>${TEMP_ELEM.innerHTML}</th>`;

      } else {
        const cellData = data[row][column];

        if (isEmpty(cellData)) {
          cell = '<td></td>';
        } else {
          TEMP_ELEM.innerText = cellData;
          cell = `<td>${TEMP_ELEM.innerHTML}</td>`;
        }
      }

      CELLS.push(cell);
    }

    const TR = ['<tr>', ...CELLS, '</tr>'].join('');

    if (isColumnHeadersRow) {
      THEAD.splice(1, 0, TR);
    } else {
      TBODY.splice(-1, 0, TR);
    }
  }

  TABLE.splice(1, 0, THEAD.join(''), TBODY.join(''));

  return TABLE.join('');
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
 * Converts HTMLTable or string into Handsontable configuration object.
 *
 * @param {Element|String} element Node element or string, which should contain `<table>...</table>`.
 */
// eslint-disable-next-line no-restricted-globals
export function tableToHandsontable(element, rootDocument = document) {
  const data = [];
  const colHeaders = [];
  const rowHeaders = [];
  let checkElement = element;

  if (typeof checkElement === 'string') {
    const tempElem = rootDocument.createElement('div');
    tempElem.innerHTML = checkElement.replace(/\n/g, '');
    checkElement = tempElem.querySelector('table');
  }

  if (checkElement && isHTMLTable(checkElement)) {
    const tempArray = [];
    const { tHead, tBodies } = checkElement;
    const tBodiesLen = tBodies.length;
    let hasRowHeaders = false;

    for (let tbody = 0; tbody < tBodiesLen; tbody += 1) {
      const rows = tBodies[tbody].rows;
      const rowsLen = rows && rows.length;

      for (let row = 0; row < rowsLen; row += 1) {
        const cells = rows[row].cells;
        const cellsLen = cells.length;
        const newRow = [];

        for (let column = 0; column < cellsLen; column += 1) {
          const cell = cells[column];
          cell.innerHTML = cell.innerHTML.trim().replace(/<br(.|)>(\n?)/, '\n');
          const cellText = cell.innerText;

          if (cell.nodeName.toLowerCase() === 'th') {
            hasRowHeaders = true;
            rowHeaders.push(cellText);
          } else {
            newRow.push(cellText);
          }
        }

        tempArray.push(newRow);
      }
    }

    data.push(...tempArray);

    const columnTHs = tHead && tHead.rows.item(0).cells;
    const columnTHsLen = columnTHs ? columnTHs.length : 0;
    for (let header = hasRowHeaders ? 1 : 0; header < columnTHsLen; header += 1) {
      const th = columnTHs[header];
      th.innerHTML = th.innerHTML.trim().replace(/<br(.|)>(\n?)/, '\n');
      colHeaders.push(th.innerText);
    }
  }

  return {
    data,
    colHeaders,
    rowHeaders,
  };
}
