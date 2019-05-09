import { isEmpty } from './../helpers/mixed';

/**
 * Verifies if node is an HTMLTable element.
 *
 * @param {Node} element Node to verify if it's an HTMLTable.
 */
function isHTMLTable(element) {
  return (element && element.nodeName || '').toLowerCase() === 'table';
}

/**
 * Converts Handsontable into HTMLTableElement.
 *
 * @param {Core} instance
 *
 * @returns {String} outerHTML of the HTMLTableElement
 */
export function instanceToHTML(instance) {
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
        const { hidden, rowspan, colspan } = instance.getCellMeta(row - (hasRowHeaders ? 1 : 0), column - (hasColumnHeaders ? 1 : 0));

        if (!hidden) {
          const attrs = [];

          if (rowspan) {
            attrs.push(`rowspan="${rowspan}"`);
          }
          if (colspan) {
            attrs.push(`colspan="${colspan}"`);
          }

          if (isEmpty(cellData)) {
            cell = `<td ${attrs.join(' ')}></td>`;
          } else {
            TEMP_ELEM.innerText = cellData;
            cell = `<td ${attrs.join(' ')}>${TEMP_ELEM.innerHTML}</td>`;
          }
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
 * Converts 2D array into HTMLTableElement.
 *
 * @param {Array} input Input array which will be converted to HTMLTable
 * @param {Document} [rootDocument]
 *
 * @returns {String} outerHTML of the HTMLTableElement
 */
// eslint-disable-next-line no-restricted-globals
export function arrayToHTML(input, rootDocument = document) {
  const inputLen = input.length;
  const result = ['<style>br{mso-data-placement: same-cell}</style>', '<table>'];

  const fragment = rootDocument.createDocumentFragment();
  const tempElement = rootDocument.createElement('div');
  fragment.appendChild(tempElement);

  for (let row = 0; row < inputLen; row += 1) {
    const rowData = input[row];
    const columnsLen = rowData.length;
    const columnsResult = [];

    if (row === 0) {
      result.push('<tbody>');
    }

    for (let column = 0; column < columnsLen; column += 1) {
      const cellData = rowData[column];
      const parsedCellData = isEmpty(cellData) ?
        '' :
        cellData.toString().replace(/(<br(\s*|\/)>(\r\n|\n)?|\r\n|\n)/g, '<br>\r\n').replace(/\x20/gi, '&nbsp;').replace(/\t/gi, '&#9;');

      columnsResult.push(`<td>${parsedCellData}</td>`);
    }

    result.push('<tr>', ...columnsResult, '</tr>');

    if (row + 1 === inputLen) {
      result.push('</tbody>');
    }
  }

  result.push('</table>');

  return result.join('');
}

/**
 * Converts HTMLTable or string into Handsontable configuration object.
 *
 * @param {Element|String} element Node element or string, which should contain `<table>...</table>`.
 * @param {Document} [rootDocument]
 */
// eslint-disable-next-line no-restricted-globals
export function tableToSettings(element, rootDocument = document) {
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
  const countCols = Array.from(checkElement.querySelector('tr').cells).reduce((cols, cell) => cols + cell.colSpan, 0) - (hasRowHeaders ? 1 : 0);
  const fixedRowsBottom = checkElement.tFoot && Array.from(checkElement.tFoot.rows) || [];
  const fixedRowsTop = [];
  let hasColHeaders = false;
  let thRowsLen = 0;
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
      settingsObj.nestedHeaders = Array.from(thRows).reduce((rows, row) => {
        const headersRow = Array.from(row.cells).reduce((headers, header, currentIndex) => {
          if (hasRowHeaders && currentIndex === 0) {
            return headers;
          }

          const {
            colSpan: colspan,
            innerHTML,
          } = header;
          const nextHeader = colspan > 1 ? { label: innerHTML, colspan } : innerHTML;

          headers.push(nextHeader);

          return headers;
        }, []);

        rows.push(headersRow);

        return rows;
      }, []);

    } else if (hasColHeaders) {
      settingsObj.colHeaders = Array.from(thRows[0].children).reduce((headers, header, index) => {
        if (hasRowHeaders && index === 0) {
          return headers;
        }

        headers.push(header.innerHTML);

        return headers;
      }, []);
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

  const dataArr = Array(countRows);

  for (let r = 0; r < countRows; r++) {
    dataArr[r] = Array(countCols);
  }

  const mergeCells = [];
  const rowHeaders = [];

  for (let row = 0; row < countRows; row++) {
    const rowData = dataRows[row];

    Array.from(rowData.cells).forEach((cell) => {
      const {
        nodeName,
        innerHTML,
        rowSpan: rowspan,
        colSpan: colspan,
      } = cell;
      const col = dataArr[row].findIndex(value => value === void 0);

      if (nodeName.toLowerCase() === 'th') {
        rowHeaders.push(innerHTML);

        return;
      }

      if (rowspan > 1 || colspan > 1) {
        for (let rstart = row; rstart < row + rowspan; rstart++) {
          for (let cstart = col; cstart < col + colspan; cstart++) {
            dataArr[rstart][cstart] = null;
          }
        }

        const styleAttr = cell.getAttribute('style');
        const ignoreMerge = styleAttr && styleAttr.includes('mso-ignore:colspan');

        if (!ignoreMerge) {
          mergeCells.push({
            col,
            row,
            rowspan,
            colspan,
          });
        }
      }

      const generator = tempElem.querySelector('meta[name$="enerator"]');
      if (generator && /excel/gi.test(generator.content)) {
        dataArr[row][col] = innerHTML.replace(/<br(\s*|\/)>[\r\n]?[\x20]{0,2}/gim, '\r\n').replace(/(<([^>]+)>)/gi, '');
      } else {
        dataArr[row][col] = innerHTML.replace(/<br(\s*|\/)>[\r\n]?/gim, '\r\n').replace(/(<([^>]+)>)/gi, '');
      }
      dataArr[row][col] = dataArr[row][col].replace(/&nbsp;/gi, '\x20');
    });
  }

  if (mergeCells.length) {
    settingsObj.mergeCells = mergeCells;
  }
  if (rowHeaders.length) {
    settingsObj.rowHeaders = rowHeaders;
  }

  if (dataArr.length) {
    settingsObj.data = dataArr;
  }

  return settingsObj;
}
