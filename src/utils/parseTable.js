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
        cell = `<th>${TEMP_ELEM.innerText}</th>`;

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

      // columnsResult.push(`<td>${tempElement.innerHTML.replace(/<br>/g, '\r\n')}</td>`);
      columnsResult.push(`<td>${tempElement.innerHTML.replace(/<br>/g, '<br style="mso-data-placement:same-cell;" />\r\n')}</td>`);
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
  const settingsObj = {};
  const fragment = rootDocument.createDocumentFragment();
  const tempElem = rootDocument.createElement('div');
  fragment.appendChild(tempElem);

  let checkElement = element;

  if (typeof checkElement === 'string') {
    tempElem.innerHTML = `${checkElement}`;
    checkElement = tempElem.querySelector('table');
  }

  if (!checkElement || !isHTMLTable(checkElement)) {
    // throw error?
    return;
  }

  const hasRowHeaders = checkElement.querySelector('tbody th') !== null;
  const fixedRowsBottom = checkElement.tFoot && Array.from(checkElement.tFoot.rows) || [];
  const fixedRowsTop = [];

  // const hasColHeaders = checkElement.querySelector('thead th') !== null;
  let hasColHeaders = false;
  let thRowsLen = 0;
  let countCols = 0;
  let countRows = 0;

  if (checkElement.tHead) {
    const thRows = Array.from(checkElement.tHead.rows).filter((tr) => {
      const isDataRow = tr.querySelector('td') !== null;

      if (isDataRow) {
        fixedRowsTop.push(tr);
      }

      return !isDataRow;
    });

    thRowsLen = thRows.length;
    hasColHeaders = thRowsLen > 0;

    if (thRowsLen > 1) {
      // nestedHeaders

    } else if (hasColHeaders) {
      const colHeaders = Array.from(thRows[0].children).reduce((headers, header, index) => {
        if (hasRowHeaders && index === 0) {
          return headers;
        }

        headers.push(header.innerHTML);

        return headers;
      }, []);

      countCols = colHeaders.length;

      settingsObj.colHeaders = colHeaders;
    }
  }

  if (fixedRowsTop.length) {
    settingsObj.fixedRowsTop = fixedRowsTop.length;
  }
  if (fixedRowsBottom.length) {
    settingsObj.fixedRowsBottom = fixedRowsBottom.length;
  }

  const dataRows = [
    ...fixedRowsTop,
    ...Array.from(checkElement.tBodies).reduce((sections, section) => {
      sections.push(...section.rows); return sections;
    }, []),
    ...fixedRowsBottom];

  countRows = dataRows.length;

  if (!countCols) {
    countCols = Array.from(dataRows[0].cells).reduce((cols, cell) => cols + cell.colSpan, 0);
  }

  const dataArr = Array(countRows);

  for (let r = 0; r < countRows; r++) {
    dataArr[r] = Array(countCols);
  }

  // {row: 1, col: 1, rowspan: 2, colspan: 2}
  const mergeCells = [];
  const rowHeaders = [];

  for (let row = 0; row < countRows; row++) {
    const rowData = dataRows[row];

    Array.from(rowData.cells).forEach((cell) => {
      const {
        nodeName,
        innerText,
        innerHTML,
        rowSpan: rowspan,
        colSpan: colspan,
      } = cell;
      const col = dataArr[row].findIndex(value => value === void 0);

      if (nodeName.toLowerCase() === 'th') {
        rowHeaders.push(innerHTML);

        return;
      }

      // console.log({
      //   innerText,
      //   row,
      //   col,
      //   rowspan,
      //   colspan,
      // });

      if (rowspan > 1 || colspan > 1) {
        for (let rstart = row; rstart < row + rowspan; rstart++) {
          for (let cstart = col; cstart < col + colspan; cstart++) {
            dataArr[rstart][cstart] = null;
          }
        }

        mergeCells.push({
          col,
          row,
          rowspan,
          colspan,
        });
      }

      dataArr[row][col] = innerText;
    });
  }

  // const dataArr = dataRows.reduce((dataset, row) => {
  //   dataset.push(Array.from(row.cells).reduce((rowdata, cell) => {
  //     const isRowHeader = cell.nodeName.toLowerCase() === 'th';

  //     if (isRowHeader) {
  //       rowHeaders.push(cell.innerHTML);

  //     } else {
  //       const {
  //         innerText,
  //         rowSpan,
  //         colSpan,
  //         cellIndex,
  //       } = cell;

  //       const mergeConfig = {
  //         col: cellIndex - (hasRowHeaders ? 1 : 0),
  //         row: cell.parentElement.rowIndex - thRowsLen,
  //         rowspan: parseInt(rowSpan, 10),
  //         colspan: parseInt(colSpan, 10),
  //       };

  //       rowdata.push(innerText);

  //       if (mergeConfig.rowspan > 1 || mergeConfig.colspan > 1) {
  //         mergeCells.push(mergeConfig);
  //       }
  //     }

  //     return rowdata;
  //   }, []));

  //   return dataset;
  // }, []);

  if (mergeCells.length) {
    settingsObj.mergeCells = mergeCells;
  }
  if (rowHeaders.length) {
    settingsObj.rowHeaders = rowHeaders;
  }

  if (dataArr.length) {
    settingsObj.data = dataArr;
  }

  // const clonedTable = checkElement.cloneNode(true);
  // tempElem.innerHTML = '';
  // const tempArray = [];
  // const { tHead, tBodies } = clonedTable;
  // const tBodiesLen = tBodies.length;
  // let hasRowHeaders = false;

  // for (let tbody = 0; tbody < tBodiesLen; tbody += 1) {
  //   const rows = tBodies[tbody].rows;
  //   const rowsLen = rows && rows.length;

  //   for (let row = 0; row < rowsLen; row += 1) {
  //     const cells = rows[row].cells;
  //     const cellsLen = cells.length;
  //     const newRow = [];

  //     for (let column = 0; column < cellsLen; column += 1) {
  //       const cell = cells[column];
  //       const cellHTML = cell.innerHTML.trim();

  //       if (cell.nodeName.toLowerCase() === 'th') {
  //         hasRowHeaders = true;
  //         settingsObj.rowHeaders.push(cellHTML);
  //       } else {
  //         newRow.push(cellHTML.replace(/<br(.|)>(\n?)/g, '\r\n'));
  //       }
  //     }

  //     tempArray.push(newRow);
  //   }
  // }

  // settingsObj.data.push(...tempArray);

  // const columnTHs = tHead && tHead.rows.item(0).cells;
  // const columnTHsLen = columnTHs ? columnTHs.length : 0;
  // for (let header = hasRowHeaders ? 1 : 0; header < columnTHsLen; header += 1) {
  //   const th = columnTHs[header];
  //   th.innerHTML = th.innerHTML.trim().replace(/<br(.|)>(\n?)/, '\n');
  //   settingsObj.colHeaders.push(th.innerText);
  // }

  return settingsObj;
}
