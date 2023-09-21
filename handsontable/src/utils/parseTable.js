import { isEmpty } from './../helpers/mixed';

const ESCAPED_HTML_CHARS = {
  '&nbsp;': '\x20',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
};
const regEscapedChars = new RegExp(Object.keys(ESCAPED_HTML_CHARS).map(key => `(${key})`).join('|'), 'gi');

/**
 * Verifies if node is an HTMLTable element.
 *
 * @param {Node} element Node to verify if it's an HTMLTable.
 * @returns {boolean}
 */
function isHTMLTable(element) {
  return (element && element.nodeName || '') === 'TABLE';
}

/**
 * Converts Handsontable into HTMLTableElement.
 *
 * @param {Core} instance The Handsontable instance.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function instanceToHTML(instance) {
  const startColumn = instance.hasRowHeaders() ? -1 : 0;
  const startRow = instance.hasColHeaders() ? -1 : 0;
  const rows = Array.from({ length: instance.countRows() + Math.abs(startRow) },
    (_, i) => i + startRow);
  const columns = Array.from({ length: instance.countCols() + Math.abs(startColumn) },
    (_, i) => i + startColumn);

  return getHTMLFromHotCoords(instance, { rows, columns });
}

/**
 * Converts Handsontable's coordinates into HTMLTableElement.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the table.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the table.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function getHTMLFromHotCoords(instance, config) {
  return [
    '<table>',
    ...getHeadersHTMLByCoords(instance, config),
    ...getBodyHTMLByCoords(instance, config),
    '</table>',
  ].join('');
}

/**
 * Converts Handsontable's coordinates into list of cell values.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array[]} List of displayed cell values.
 */
export function getDataFromHotCoords(instance, config) {
  return [
    ...getHeadersDataByCoords(instance, config),
    ...getBodyDataByCoords(instance, config),
  ];
}

/**
 * Encode text to HTML.
 *
 * @param {string} text Text to prepare.
 * @returns {string}
 */
function encodeHTMLEntities(text) {
  return `${text}`
    .replace(/&/g, '&amp;')
    .replace('<', '&lt;')
    .replace('>', '&gt;')
    .replace(/(<br(\s*|\/)>(\r\n|\n)?|\r\n|\n)/g, '<br>\r\n')
    .replace(/\x20{2,}/gi, (substring) => {
      // The way how Excel serializes data with at least two spaces.
      return `<span style="mso-spacerun: yes">${'&nbsp;'.repeat(substring.length - 1)} </span>`;
    })
    .replace(/\t/gi, '&#9;');
}

/**
 * Converts Handsontable's header coordinates into HTMLTableElement.tHead.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.tHead.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating
 * the HTMLTableElement.tHead.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating
 * the HTMLTableElement.tHead.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getHeadersHTMLByCoords(instance, config) {
  const { rows, columns } = config;
  const headers = rows.filter(rowIndex => rowIndex < 0);
  const headersHTML = [];

  if (headers.length === 0 || columns.length === 0) {
    return [];
  }

  headers.forEach((rowIndex) => {
    const tr = ['<tr>'];

    for (let i = 0; i < columns.length; i += 1) {
      const columnIndex = columns[i];
      const headerCell = instance.getCell(rowIndex, columnIndex);
      const colspan = headerCell?.getAttribute('colspan');
      let colspanAttribute = '';

      if (colspan) {
        const parsedColspan = parseInt(colspan, 10);

        colspanAttribute = ` colspan=${parsedColspan}`;
        i += parsedColspan - 1;
      }

      tr.push(`<th${colspanAttribute}>${encodeHTMLEntities(instance.getColHeader(columnIndex, rowIndex))}</th>`);
    }

    tr.push('</tr>');
    headersHTML.push(...tr);
  });

  return ['<thead>', ...headersHTML, '</thead>'];
}

/**
 * Converts Handsontable's coordinates into list of values for cells being headers.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array[]} List of displayed cell values.
 */
function getHeadersDataByCoords(instance, config) {
  const headersData = [];
  const { columns, rows } = config;
  const headers = rows.filter(rowIndex => rowIndex < 0);

  headers.forEach((rowIndex) => {
    const tr = [];

    for (let i = 0; i < columns.length; i += 1) {
      const columnIndex = columns[i];
      const headerCell = instance.getCell(rowIndex, columnIndex);
      const colspan = headerCell?.getAttribute('colspan');

      tr.push(instance.getColHeader(columnIndex, rowIndex));

      if (colspan) {
        const parsedColspan = parseInt(colspan, 10);

        tr.push(...new Array(parsedColspan - 1).fill(''));
        i += parsedColspan - 1;
      }
    }

    headersData.push(tr);
  });

  return headersData;
}

/**
 * Converts Handsontable's header coordinates into HTMLTableElement.tBodies.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the table.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the table.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getBodyHTMLByCoords(instance, config) {
  const { columns, rows } = config;
  const bodyRows = rows.filter(rowIndex => rowIndex >= 0);
  const cells = [];

  if (bodyRows.length === 0 || columns.length === 0) {
    return [];
  }

  bodyRows.forEach((rowIndex) => {
    const tr = ['<tr>'];

    columns.forEach((columnIndex) => {
      if (columnIndex < 0) {
        tr.push(`<th>${encodeHTMLEntities(instance.getRowHeader(rowIndex))}</th>`);

        return;
      }

      const cellValue = instance.getCopyableData(rowIndex, columnIndex);
      const cellValueParsed = isEmpty(cellValue) ? '' : encodeHTMLEntities(cellValue);
      const { hidden, rowspan, colspan } =
        instance.getCellMeta(rowIndex, columnIndex);

      if (!hidden) {
        const attrs = [];

        if (rowspan) {
          const recalculatedRowSpan = Math.min(rowspan, bodyRows.slice(rowIndex).length);

          if (recalculatedRowSpan > 1) {
            attrs.push(` rowspan="${recalculatedRowSpan}"`);
          }
        }

        if (colspan) {
          const recalculatedColumnSpan = Math.min(colspan, columns.slice(columnIndex).length);

          if (recalculatedColumnSpan > 1) {
            attrs.push(` colspan="${recalculatedColumnSpan}"`);
          }
        }

        tr.push(`<td${attrs.join('')}>${cellValueParsed}</td>`);
      }
    });

    tr.push('</tr>');
    cells.push(...tr);
  });

  return ['<tbody>', ...cells, '</tbody>'];
}

/**
 * Converts Handsontable's coordinates into list of values for cells not being headers.
 *
 * @param {Core} instance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array[]} List of displayed cell values.
 */
function getBodyDataByCoords(instance, config) {
  const cells = [];
  const { columns, rows } = config;
  const bodyRows = rows.filter(rowIndex => rowIndex >= 0);

  bodyRows.forEach((rowIndex) => {
    const tr = [];

    columns.forEach((columnIndex) => {
      const cellValue = instance.getCopyableData(rowIndex, columnIndex);
      const cellValueParsed = isEmpty(cellValue) ? '' : cellValue;

      tr.push(cellValueParsed);
    });

    cells.push(tr);
  });

  return cells;
}

/**
 * Converts HTMLTable or string into Handsontable configuration object.
 *
 * @param {Element|string} element Node element which should contain `<table>...</table>`.
 * @param {Document} [rootDocument] The document window owner.
 * @returns {object} Return configuration object. Contains keys as DefaultSettings.
 */
// eslint-disable-next-line no-restricted-globals
export function htmlToGridSettings(element, rootDocument = document) {
  const settingsObj = {};
  const fragment = rootDocument.createDocumentFragment();
  const tempElem = rootDocument.createElement('div');

  fragment.appendChild(tempElem);

  let checkElement = element;

  if (typeof checkElement === 'string') {
    const escapedAdjacentHTML = checkElement.replace(/<td\b[^>]*?>([\s\S]*?)<\/\s*td>/g, (cellFragment) => {
      const openingTag = cellFragment.match(/<td\b[^>]*?>/g)[0];
      const cellValue = cellFragment
        .substring(openingTag.length, cellFragment.lastIndexOf('<')).replace(/(<(?!br)([^>]+)>)/gi, '');
      const closingTag = '</td>';

      return `${openingTag}${cellValue}${closingTag}`;
    });

    tempElem.insertAdjacentHTML('afterbegin', `${escapedAdjacentHTML}`);
    checkElement = tempElem.querySelector('table');
  }

  if (!checkElement || !isHTMLTable(checkElement)) {
    return;
  }

  const generator = tempElem.querySelector('meta[name$="enerator"]');
  const hasRowHeaders = checkElement.querySelector('tbody th') !== null;
  const trElement = checkElement.querySelector('tr');
  const countCols = !trElement ? 0 : Array.from(trElement.cells)
    .reduce((cols, cell) => cols + cell.colSpan, 0) - (hasRowHeaders ? 1 : 0);
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
      sections.push(...Array.from(section.rows));

      return sections;
    }, []),
    ...fixedRowsBottom];

  countRows = dataRows.length;

  const dataArr = new Array(countRows);

  for (let r = 0; r < countRows; r++) {
    dataArr[r] = new Array(countCols);
  }

  const mergeCells = [];
  const rowHeaders = [];

  for (let row = 0; row < countRows; row++) {
    const tr = dataRows[row];
    const cells = Array.from(tr.cells);
    const cellsLen = cells.length;

    for (let cellId = 0; cellId < cellsLen; cellId++) {
      const cell = cells[cellId];
      const {
        nodeName,
        innerHTML,
        rowSpan: rowspan,
        colSpan: colspan,
      } = cell;
      const col = dataArr[row].findIndex(value => value === void 0);

      if (nodeName === 'TD') {
        if (rowspan > 1 || colspan > 1) {
          for (let rstart = row; rstart < row + rowspan; rstart++) {
            if (rstart < countRows) {
              for (let cstart = col; cstart < col + colspan; cstart++) {
                dataArr[rstart][cstart] = null;
              }
            }
          }

          const styleAttr = cell.getAttribute('style');
          const ignoreMerge = styleAttr && styleAttr.includes('mso-ignore:colspan');

          if (!ignoreMerge) {
            mergeCells.push({ col, row, rowspan, colspan });
          }
        }

        let cellValue = '';

        if (generator && /excel/gi.test(generator.content)) {
          cellValue = innerHTML.replace(/[\r\n][\x20]{0,2}/g, '\x20')
            .replace(/<br(\s*|\/)>[\r\n]?[\x20]{0,3}/gim, '\r\n');

        } else {
          cellValue = innerHTML.replace(/<br(\s*|\/)>[\r\n]?/gim, '\r\n');
        }

        dataArr[row][col] = cellValue.replace(regEscapedChars, match => ESCAPED_HTML_CHARS[match]);

      } else {
        rowHeaders.push(innerHTML);
      }
    }
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
