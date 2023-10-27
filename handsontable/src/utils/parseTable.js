import { isEmpty } from './../helpers/mixed';
import { isObject } from './../helpers/object';
import { rangeEach } from '../helpers/number';

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
 * Parses empty values to an empty string or leave them untouched otherwise.
 *
 * @private
 * @param {string} cellValue Parsed cell value.
 * @returns {string}
 */
function parseEmptyValues(cellValue) {
  if (isEmpty(cellValue)) {
    return '';
  }

  return cellValue;
}

/**
 * Converts Handsontable into HTMLTableElement.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function instanceToHTML(hotInstance) {
  const startColumn = hotInstance.hasRowHeaders() ? -1 : 0;
  const startRow = hotInstance.hasColHeaders() ? -1 : 0;
  const rows = Array.from({ length: hotInstance.countRows() + Math.abs(startRow) },
    (_, i) => i + startRow);
  const columns = Array.from({ length: hotInstance.countCols() + Math.abs(startColumn) },
    (_, i) => i + startColumn);

  return getHTMLByCoords(hotInstance, { rows, columns });
}

/**
 * Converts Handsontable's coordinates into HTMLTableElement.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the table.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the table.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function getHTMLByCoords(hotInstance, config) {
  return [
    '<table>',
    ...getHeadersHTMLByCoords(hotInstance, config),
    ...getBodyHTMLByCoords(hotInstance, config),
    '</table>',
  ].join('');
}

/**
 * Converts Handsontable's coordinates into list of cell values.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array<Array<string>>} List of displayed cell values.
 */
export function getDataByCoords(hotInstance, config) {
  return [
    ...getHeadersDataByCoords(hotInstance, config),
    ...getBodyDataByCoords(hotInstance, config),
  ];
}

/**
 * Converts config into HTMLTableElement.
 *
 * @param {object} config Configuration for building HTMLTableElement.
 * @param {Array<number>} [config.excludedRows] List of row indexes which should be excluded when creating the table.
 * @param {Array<number>} [config.excludedColumns] List of column indexes which should be excluded when creating the table.
 * @param {Array<Array<string>>} [config.data] List of cell data.
 * @param {Array<object>} [config.mergeCells] List of merged cells.
 * @param {Array<Array<string|object>>} [config.nestedHeaders] List of headers and corresponding information about some
 * nested elements.
 * @param {Array<string>} [config.colHeaders] List of first level header values.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function getHTMLFromConfig(config) {
  return [
    '<table>',
    ...getHeadersHTMLByConfig(config),
    ...getBodyHTMLByConfig(config),
    '</table>',
  ].join('');
}

/**
 * Get list of filtered nested headers.
 *
 * @param {Array<Array<string|object>>} nestedHeaders List of nested headers which will be filtered.
 * @param {Array<number>} excludedHeaders List of headers which should be excluded when creating the HTMLTableElement.tHead.
 * @param {Array<number>} excludedColumns List of column indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @returns {*}
 */
function getFilteredNestedHeaders(nestedHeaders, excludedHeaders, excludedColumns) {
  return nestedHeaders.reduce((listOfHeaders, headerValues, rowIndex) => {
    if (excludedHeaders.includes(rowIndex - nestedHeaders.length)) {
      return listOfHeaders;
    }

    const filteredNestedHeader = headerValues.filter((columnData, columnIndex) =>
      excludedColumns.includes(columnIndex) === false);

    if (filteredNestedHeader.length > 0) {
      return listOfHeaders.concat([filteredNestedHeader]);
    }

    return listOfHeaders;
  }, []);
}

/**
 * Get HTML for nested headers.
 *
 * @param {Array<Array<string|object>>} nestedHeaders List of nested headers which will be filtered.
 * @param {Array<number>} excludedHeaders List of headers which should be excluded when creating the HTMLTableElement.tHead.
 * @param {Array<number>} excludedColumns List of column indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @returns {Array<string>}
 */
function getNestedHeadersHTML(nestedHeaders, excludedHeaders, excludedColumns) {
  const headersHTML = [];

  getFilteredNestedHeaders(nestedHeaders, excludedHeaders, excludedColumns).forEach((listOfHeaders) => {
    const rowHTML = ['<tr>'];

    for (let i = 0; i < listOfHeaders.length; i += 1) {
      const header = listOfHeaders[i];
      let headerValue = header;

      if (isObject(header)) {
        const { colspan, label } = header;

        headerValue = label;

        rowHTML.push(`<th colspan=${colspan}>${encodeHTMLEntities(parseEmptyValues(headerValue))}</th>`);

      } else {
        rowHTML.push(`<th>${encodeHTMLEntities(parseEmptyValues(headerValue))}</th>`);
      }
    }

    rowHTML.push('</tr>');
    headersHTML.push(...rowHTML);
  });

  return headersHTML;
}

/**
 * Get HTML for first level header.
 *
 * @param {Array<string>} columnHeaders List of header values which will be filtered.
 * @param {Array<number>} excludedHeaders List of headers which should be excluded when creating the HTMLTableElement.tHead.
 * @param {Array<number>} excludedColumns List of column indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @returns {*[]}
 */
function getSimpleHeadersHTML(columnHeaders, excludedHeaders, excludedColumns) {
  if (excludedHeaders.includes(-1)) {
    return [];
  }

  const filteredColumnHeaders = columnHeaders.filter((columnHeaderValue, columnIndex) =>
    excludedColumns.includes(columnIndex) === false);

  if (filteredColumnHeaders.length === 0) {
    return [];
  }

  return ['<tr>', ...filteredColumnHeaders.map(columnHeader =>
    `<th>${encodeHTMLEntities(parseEmptyValues(columnHeader))}</th>`), '</tr>'];
}

/**
 * Get list of cells filtered by list of excluded rows and columns.
 *
 * @private
 * @param {Array<Array<string>>} data List of cells values which will be filtered.
 * @param {Array<number>} excludedRows List of row indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @param {Array<number>} excludedColumns List of column indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @returns {Array<string>} List of cell values.
 */
function getFilteredCells(data, excludedRows, excludedColumns) {
  if (Array.isArray(data) === false) {
    return [];
  }

  return data.reduce((listOfCells, rowData, rowIndex) => {
    if (excludedRows.includes(rowIndex)) {
      return listOfCells;
    }

    const filteredRowData = rowData.filter((cellData, columnIndex) =>
      excludedColumns.includes(columnIndex) === false);

    if (filteredRowData.length > 0) {
      return listOfCells.concat([filteredRowData]);
    }

    return listOfCells;
  }, []);
}

/**
 * Prepare information about merged areas to reduce complexity of calculations.
 *
 * @private
 * @param {Array<object>} mergedCellsConfig List of merged cells.
 * @returns {{mergedCellsMap: Map<any, any>, mergedArea: Set<any>}}
 */
function getMergedCellsInformation(mergedCellsConfig) {
  const mergedCellsMap = new Map();
  const mergedArea = new Set();
  let mergedRows = 1;
  let mergedColumns = 1;

  mergedCellsConfig?.forEach((mergeArea) => {
    const { row, col, rowspan, colspan } = mergeArea;

    mergedCellsMap.set(`${row}x${col}`, { rowspan, colspan });

    if (Number.isInteger(rowspan)) {
      mergedRows = rowspan;
    }

    if (Number.isInteger(colspan)) {
      mergedColumns = colspan;
    }

    rangeEach(row, row + mergedRows - 1, (rowIndex) => {
      rangeEach(col, col + mergedColumns - 1, (columnIndex) => {
        // Other than start point.
        if (rowIndex !== row || columnIndex !== col) {
          mergedArea.add(`${rowIndex}x${columnIndex}`);
        }
      });
    });
  });

  return {
    mergedCellsMap,
    mergedArea,
  };
}

/**
 * Converts config with information about cells into HTMLTableElement.tBodies.
 *
 * @private
 * @param {object} config Configuration for building HTMLTableElement.tBodies.
 * @param {Array<Array<string>>} config.data List of cell data.
 * @param {Array<number>} [config.excludedRows] List of row indexes which should be excluded when creating the HTMLTableElement.tBodies.
 * @param {Array<number>} [config.excludedColumns] List of column indexes which should be excluded when creating the HTMLTableElement.tBodies.
 * @param {Array<object>} [config.mergeCells] List of merged cells.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getBodyHTMLByConfig(config) {
  const excludedColumns = config.excludedColumns || [];
  const excludedRows = config.excludedRows || [];
  const { data, mergeCells } = config;
  const ignoredCellRows = excludedRows.filter(rowIndex => rowIndex >= 0);
  const filteredData = getFilteredCells(data, ignoredCellRows, excludedColumns);
  const cells = [];

  if (filteredData.length === 0) {
    return [];
  }

  const { mergedCellsMap, mergedArea } = getMergedCellsInformation(mergeCells);

  filteredData.forEach((rowData, rowIndex) => {
    const rowHTML = ['<tr>'];

    rowData.forEach((cellData, columnIndex) => {
      const attrs = [];
      const checkedMergeCoordinate = `${rowIndex}x${columnIndex}`;
      const mergeParent = mergedCellsMap.get(checkedMergeCoordinate);

      if (mergeParent !== undefined) {
        const { rowspan, colspan } = mergeParent;

        if (Number.isInteger(rowspan) && rowspan > 1) {
          attrs.push(` rowspan="${rowspan}"`);
        }

        if (Number.isInteger(colspan) && colspan > 1) {
          attrs.push(` colspan="${colspan}"`);
        }

      } else if (mergedArea.has(checkedMergeCoordinate)) {
        return;
      }

      rowHTML.push(`<td${attrs.join('')}>${encodeHTMLEntities(parseEmptyValues(cellData))}</td>`);
    });

    rowHTML.push('</tr>');
    cells.push(...rowHTML);
  });

  return ['<tbody>', ...cells, '</tbody>'];
}

/**
 * Converts config with information about headers into HTMLTableElement.tHead.
 *
 * @private
 * @param {object} config Configuration for building HTMLTableElement.tHead.
 * @param {Array<Array<string|object>>} [config.nestedHeaders] List of headers and corresponding information about some
 * nested elements.
 * @param {Array<string>} [config.colHeaders] List of first level header values.
 * @param {Array<number>} [config.excludedRows] List of row indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @param {Array<number>} [config.excludedColumns] List of column indexes which should be excluded when creating the HTMLTableElement.tHead.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getHeadersHTMLByConfig(config) {
  const headersHTML = [];
  const excludedColumns = Array.isArray(config?.excludedColumns) ? config.excludedColumns : [];
  const excludedRows = Array.isArray(config?.excludedRows) ? config.excludedRows : [];
  const { nestedHeaders, colHeaders } = config;
  const excludedHeaders = excludedRows.filter(rowIndex => rowIndex < 0);

  if (Array.isArray(nestedHeaders)) {
    headersHTML.push(...getNestedHeadersHTML(nestedHeaders, excludedHeaders, excludedColumns));

  } else if (Array.isArray(colHeaders)) {
    headersHTML.push(...getSimpleHeadersHTML(colHeaders, excludedHeaders, excludedColumns));
  }

  if (headersHTML.length > 0) {
    return ['<thead>', ...headersHTML, '</thead>'];
  }

  return [];
}

/**
 * Converts config with information about cells and headers into list of values.
 *
 * @param {object} config Configuration for building list of values.
 * @param {Array<number>} [config.excludedRows] List of row indexes which should be excluded when creating the value list.
 * @param {Array<number>} [config.excludedColumns] List of column indexes which should be excluded when creating the value list.
 * @param {Array<Array<string|object>>} [config.nestedHeaders] List of headers and information about some nested elements.
 * @param {Array<string>} [config.colHeaders] List of first level header values.
 * @returns {string[][]} List of values.
 */
export function getDataWithHeadersByConfig(config) {
  const dataWithHeaders = [];
  const excludedColumns = Array.isArray(config?.excludedColumns) ? config.excludedColumns : [];
  const excludedRows = Array.isArray(config?.excludedRows) ? config.excludedRows : [];
  const { data, nestedHeaders, colHeaders } = config;
  const excludedHeaders = excludedRows.filter(rowIndex => rowIndex < 0);

  if (Array.isArray(nestedHeaders)) {
    dataWithHeaders.push(...getFilteredNestedHeaders(nestedHeaders, excludedHeaders, excludedColumns)
      .map((listOfHeaders) => {
        return listOfHeaders.reduce((headers, header) => {
          if (isObject(header)) {
            headers.push(header.label, ...new Array(header.colspan - 1).fill(''));

          } else {
            headers.push(header);
          }

          return headers;
        }, []);
      })
    );

  } else if (Array.isArray(colHeaders)) {
    dataWithHeaders.push([...colHeaders.filter((columnHeaderData, columnIndex) =>
      excludedColumns.includes(columnIndex) === false)]);
  }

  dataWithHeaders.push(...getFilteredCells(data, excludedRows.filter(rowIndex => rowIndex >= 0),
    excludedColumns.filter(columnIndex => columnIndex >= 0)));

  return dataWithHeaders;
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
 * Decode HTML to simple text.
 *
 * @param {string} html HTML for handling.
 * @returns {string}
 */
function decodeHTMLEntities(html) {
  return html.replace(regEscapedChars, match => ESCAPED_HTML_CHARS[match])
    // The way how Excel serializes data with at least two spaces.
    .replace(/<span style="mso-spacerun: yes">(.+?)<\/span>/, '$1')
    .replaceAll('&nbsp;', ' ');
}

/**
 * Converts Handsontable's header coordinates into HTMLTableElement.tHead.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.tHead.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating
 * the HTMLTableElement.tHead.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating
 * the HTMLTableElement.tHead.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getHeadersHTMLByCoords(hotInstance, config) {
  const { rows, columns } = config;
  const headers = rows.filter(rowIndex => rowIndex < 0);
  const headersHTML = [];

  if (headers.length === 0 || columns.length === 0) {
    return [];
  }

  headers.forEach((rowIndex) => {
    const rowHTML = ['<tr>'];

    for (let i = 0; i < columns.length; i += 1) {
      const columnIndex = columns[i];
      const headerCell = hotInstance.getCell(rowIndex, columnIndex);
      const colspan = headerCell?.getAttribute('colspan');
      let colspanAttribute = '';

      if (colspan) {
        const parsedColspan = parseInt(colspan, 10);
        const colspanReduced = Math.min(parsedColspan, columns.length - i);

        colspanAttribute = ` colspan=${colspanReduced}`;
        i += colspanReduced - 1;
      }

      rowHTML.push(`<th${colspanAttribute}>${
        encodeHTMLEntities(parseEmptyValues(hotInstance.getColHeader(columnIndex, rowIndex)))}</th>`);
    }

    rowHTML.push('</tr>');
    headersHTML.push(...rowHTML);
  });

  return ['<thead>', ...headersHTML, '</thead>'];
}

/**
 * Converts Handsontable's coordinates into list of values for cells being headers.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array[]} List of displayed cell values.
 */
function getHeadersDataByCoords(hotInstance, config) {
  const headersData = [];
  const { columns, rows } = config;
  const headers = rows.filter(rowIndex => rowIndex < 0);

  headers.forEach((rowIndex) => {
    const rowData = [];

    for (let i = 0; i < columns.length; i += 1) {
      const columnIndex = columns[i];
      const headerCell = hotInstance.getCell(rowIndex, columnIndex);
      const colspan = headerCell?.getAttribute('colspan');

      rowData.push(hotInstance.getColHeader(columnIndex, rowIndex));

      if (colspan) {
        const parsedColspan = parseInt(colspan, 10);

        rowData.push(...new Array(parsedColspan - 1).fill(''));
        i += parsedColspan - 1;
      }
    }

    headersData.push(rowData);
  });

  return headersData;
}

/**
 * Converts Handsontable's header coordinates into HTMLTableElement.tBodies.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building HTMLTableElement.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the table.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the table.
 * @returns {Array<string>} List of HTMLElements stored as strings.
 */
function getBodyHTMLByCoords(hotInstance, config) {
  const { columns, rows } = config;
  const bodyRows = rows.filter(rowIndex => rowIndex >= 0);
  const cells = [];

  if (bodyRows.length === 0 || columns.length === 0) {
    return [];
  }

  bodyRows.forEach((rowIndex, nthRow) => {
    const rowHTML = ['<tr>'];

    columns.forEach((columnIndex, nthColumn) => {
      if (columnIndex < 0) {
        rowHTML.push(`<th>${encodeHTMLEntities(parseEmptyValues(hotInstance.getRowHeader(rowIndex)))}</th>`);

        return;
      }

      const cellValue = hotInstance.getCopyableData(rowIndex, columnIndex);
      const cellValueParsed = encodeHTMLEntities(parseEmptyValues((cellValue)));
      const { hidden, rowspan, colspan } = hotInstance.getCellMeta(rowIndex, columnIndex);

      if (!hidden) {
        const attrs = [];

        if (rowspan) {
          const recalculatedRowSpan = Math.min(rowspan, bodyRows.slice(nthRow).length);

          if (recalculatedRowSpan > 1) {
            attrs.push(` rowspan="${recalculatedRowSpan}"`);
          }
        }

        if (colspan) {
          const recalculatedColumnSpan = Math.min(colspan, columns.slice(nthColumn).length);

          if (recalculatedColumnSpan > 1) {
            attrs.push(` colspan="${recalculatedColumnSpan}"`);
          }
        }

        rowHTML.push(`<td${attrs.join('')}>${cellValueParsed}</td>`);
      }
    });

    rowHTML.push('</tr>');
    cells.push(...rowHTML);
  });

  return ['<tbody>', ...cells, '</tbody>'];
}

/**
 * Converts Handsontable's coordinates into list of values for cells not being headers.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} config Configuration for building the cell value list.
 * @param {Array<number>} config.rows List of row indexes which should be taken into account when creating the
 * cell value list.
 * @param {Array<number>} config.columns List of column indexes which should be taken into account when creating the
 * cell value list.
 * @returns {Array[]} List of displayed cell values.
 */
function getBodyDataByCoords(hotInstance, config) {
  const cells = [];
  const { columns, rows } = config;
  const bodyRows = rows.filter(rowIndex => rowIndex >= 0);

  bodyRows.forEach((rowIndex) => {
    const rowData = [];

    columns.forEach((columnIndex) => {
      const cellValue = hotInstance.getCopyableData(rowIndex, columnIndex);
      const cellValueParsed = isEmpty(cellValue) ? '' : cellValue;

      rowData.push(cellValueParsed);
    });

    cells.push(rowData);
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

    const isAnyNested = thRows.find(tr => tr.querySelector('th[colspan]') !== null) !== undefined;

    thRowsLen = thRows.length;
    hasColHeaders = thRowsLen > 0;

    if (thRowsLen > 1 || isAnyNested) {
      settingsObj.nestedHeaders = Array.from(thRows).reduce((rows, row) => {
        const headersRow = Array.from(row.cells).reduce((headers, header, currentIndex) => {
          if (hasRowHeaders && currentIndex === 0) {
            return headers;
          }

          const { colSpan: colspan } = header;
          const innerHTML = decodeHTMLEntities(header.innerHTML);

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

        headers.push(decodeHTMLEntities(header.innerHTML));

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

        dataArr[row][col] = decodeHTMLEntities(cellValue);

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
