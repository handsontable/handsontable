import { GridSettings } from '../core.types';
import { isEmpty } from './../helpers/mixed';

interface EscapedHtmlChars {
  [key: string]: string;
}

// Using previously defined Handsontable interface or creating a minimal version for Core
interface Core {
  hasColHeaders: () => boolean;
  hasRowHeaders: () => boolean;
  countRows: () => number;
  countCols: () => number;
  getData: (...coords: number[]) => any[][];
  getColHeader: (index: number) => string;
  getRowHeader: (index: number) => string;
  getCellMeta: (row: number, column: number) => CellMeta;
}

interface CellMeta {
  hidden?: boolean;
  rowspan?: number;
  colspan?: number;
  [key: string]: any;
}

const ESCAPED_HTML_CHARS: EscapedHtmlChars = {
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
function isHTMLTable(element: Node | null | undefined): boolean {
  return (element && element.nodeName || '') === 'TABLE';
}

/**
 * Converts Handsontable into HTMLTableElement.
 *
 * @param {Core} instance The Handsontable instance.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function instanceToHTML(instance: Core): string {
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
  const THEAD = hasColumnHeaders ? ['<thead>', '</thead>'] : [];
  const TBODY = ['<tbody>', '</tbody>'];
  const rowModifier = hasRowHeaders ? 1 : 0;
  const columnModifier = hasColumnHeaders ? 1 : 0;

  for (let row = 0; row < countRows; row += 1) {
    const isColumnHeadersRow = hasColumnHeaders && row === 0;
    const CELLS: string[] = [];

    for (let column = 0; column < countCols; column += 1) {
      const isRowHeadersColumn = !isColumnHeadersRow && hasRowHeaders && column === 0;
      let cell = '';

      if (isColumnHeadersRow) {
        cell = `<th>${instance.getColHeader(column - rowModifier)}</th>`;

      } else if (isRowHeadersColumn) {
        cell = `<th>${instance.getRowHeader(row - columnModifier)}</th>`;

      } else {
        const cellData = data[row][column];
        const { hidden, rowspan, colspan } = instance.getCellMeta(row - columnModifier, column - rowModifier);

        if (!hidden) {
          const attrs: string[] = [];

          if (rowspan) {
            attrs.push(`rowspan="${rowspan}"`);
          }
          if (colspan) {
            attrs.push(`colspan="${colspan}"`);
          }
          if (isEmpty(cellData)) {
            cell = `<td ${attrs.join(' ')}></td>`;
          } else {
            const value = cellData.toString()
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/(<br(\s*|\/)>(\r\n|\n)?|\r\n|\n)/g, '<br>\r\n')
              .replace(/\x20/gi, '&nbsp;')
              .replace(/\t/gi, '&#9;');

            cell = `<td ${attrs.join(' ')}>${value}</td>`;
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
 * @param {Array} input Input array which will be converted to HTMLTable.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
// eslint-disable-next-line no-restricted-globals
export function _dataToHTML(input: any[][]): string {
  const inputLen = input.length;
  const result: string[] = ['<table>'];

  for (let row = 0; row < inputLen; row += 1) {
    const rowData = input[row];
    const columnsLen = rowData.length;
    const columnsResult: string[] = [];

    if (row === 0) {
      result.push('<tbody>');
    }

    for (let column = 0; column < columnsLen; column += 1) {
      const cellData = rowData[column];
      const parsedCellData = isEmpty(cellData) ?
        '' :
        cellData.toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/(<br(\s*|\/)>(\r\n|\n)?|\r\n|\n)/g, '<br>\r\n')
          .replace(/\x20{2,}/gi, (substring: string) => {
            // The way how Excel serializes data with at least two spaces.
            return `<span style="mso-spacerun: yes">${'&nbsp;'.repeat(substring.length - 1)} </span>`;
          })
          .replace(/\t/gi, '&#9;');

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
 * @param {Element|string} element Node element which should contain `<table>...</table>`.
 * @param {Document} [rootDocument] The document window owner.
 * @returns {object} Return configuration object. Contains keys as DefaultSettings.
 */
// eslint-disable-next-line no-restricted-globals
export function htmlToGridSettings(element: Element | string, rootDocument: Document = document): GridSettings | undefined {
  const settingsObj: Partial<GridSettings> = {};
  const fragment = rootDocument.createDocumentFragment();
  const tempElem = rootDocument.createElement('div');

  fragment.appendChild(tempElem);

  let checkElement = element as Element | string;

  if (typeof checkElement === 'string') {
    const escapedAdjacentHTML = checkElement.replace(/<td\b[^>]*?>([\s\S]*?)<\/\s*td>/g, (cellFragment: string) => {
      const matchedTags = cellFragment.match(/<td\b[^>]*?>/g);
      const openingTag = matchedTags ? matchedTags[0] : '';
      const paragraphRegexp = /<p.*?>/g;
      const cellValue = cellFragment
        .substring(openingTag.length, cellFragment.lastIndexOf('<'))
        .trim() // Removing whitespaces from the start and the end of HTML fragment
        .replaceAll(/\n\s+/g, ' ') // HTML tags may be split using multiple new lines and whitespaces
        .replaceAll(paragraphRegexp, '\n') // Only paragraphs should split text using new line characters
        .replace('\n', '') // First paragraph shouldn't start with new line characters
        .replaceAll(/<\/(.*)>\s+$/mg, '</$1>') // HTML tags may end with whitespace.
        .replace(/(<(?!br)([^>]+)>)/gi, '') // Removing HTML tags
        .replaceAll(/^&nbsp;$/mg, ''); // Removing single &nbsp; characters separating new lines
      const closingTag = '</td>';

      return `${openingTag}${cellValue}${closingTag}`;
    });

    tempElem.insertAdjacentHTML('afterbegin', `${escapedAdjacentHTML}`);
    checkElement = tempElem.querySelector('table') as HTMLTableElement;
  }

  if (!checkElement || !isHTMLTable(checkElement as Element)) {
    return;
  }

  const htmlTableElement = checkElement as HTMLTableElement;
  const generator = tempElem.querySelector('meta[name$="enerator"]') as HTMLMetaElement;
  const hasRowHeaders = htmlTableElement.querySelector('tbody th') !== null;
  const trElement = htmlTableElement.querySelector('tr');
  const countCols = !trElement ? 0 : Array.from(trElement.cells)
    .reduce((cols, cell) => cols + cell.colSpan, 0) - (hasRowHeaders ? 1 : 0);
  const fixedRowsBottom = htmlTableElement.tFoot && Array.from(htmlTableElement.tFoot.rows) || [];
  const fixedRowsTop: HTMLTableRowElement[] = [];
  let hasColHeaders = false;
  let thRowsLen = 0;
  let countRows = 0;

  if (htmlTableElement.tHead) {
    const thRows = Array.from(htmlTableElement.tHead.rows).filter((tr) => {
      const isDataRow = tr.querySelector('td') !== null;

      if (isDataRow) {
        fixedRowsTop.push(tr);
      }

      return !isDataRow;
    });

    thRowsLen = thRows.length;
    hasColHeaders = thRowsLen > 0;

    if (thRowsLen > 1) {
      settingsObj.nestedHeaders = Array.from(thRows).reduce((rows: Array<Array<string | { label: string, colspan: number }>>, row) => {
        const headersRow = Array.from(row.cells).reduce((headers: Array<string | { label: string, colspan: number }>, header, currentIndex) => {
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
      settingsObj.colHeaders = Array.from(thRows[0].children).reduce((headers: string[], header, index) => {
        if (hasRowHeaders && index === 0) {
          return headers;
        }

        headers.push((header as HTMLElement).innerHTML);

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
    ...Array.from(htmlTableElement.tBodies).reduce((sections: HTMLTableRowElement[], section) => {
      sections.push(...Array.from(section.rows));

      return sections;
    }, []),
    ...fixedRowsBottom];

  countRows = dataRows.length;

  const dataArr = new Array(countRows);

  for (let r = 0; r < countRows; r++) {
    dataArr[r] = new Array(countCols);
  }

  const mergeCells: Array<{ col: number, row: number, rowspan: number, colspan: number }> = [];
  const rowHeaders: string[] = [];

  for (let row = 0; row < countRows; row++) {
    const tr = dataRows[row];
    const cells = Array.from(tr.cells);
    const cellsLen = cells.length;

    for (let cellId = 0; cellId < cellsLen; cellId++) {
      const cell = cells[cellId] as HTMLTableCellElement;
      const {
        nodeName,
        innerHTML,
        rowSpan: rowspan,
        colSpan: colspan,
      } = cell;
      const col = dataArr[row].findIndex(value => value === undefined);

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

        dataArr[row][col] = cellValue.replace(regEscapedChars, (match: string) => ESCAPED_HTML_CHARS[match]);

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

  return settingsObj as GridSettings;
}
