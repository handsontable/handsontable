import type { HotInstance } from '../core/types';
import { isEmpty } from './../helpers/mixed';

const ESCAPED_HTML_CHARS: Record<string, string> = {
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
function isHTMLTable(element: HTMLElement): boolean {
  return (element && element.nodeName || '') === 'TABLE';
}

/**
 * Converts Handsontable into HTMLTableElement.
 *
 * @param {Core} instance The Handsontable instance.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
export function instanceToHTML(instance: HotInstance): string {
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
    const CELLS = [];

    for (let column = 0; column < countCols; column += 1) {
      const isRowHeadersColumn = !isColumnHeadersRow && hasRowHeaders && column === 0;
      let cell = '';

      if (isColumnHeadersRow) {
        cell = `<th>${instance.getColHeader(column - rowModifier)}</th>`;

      } else if (isRowHeadersColumn) {
        cell = `<th>${instance.getRowHeader(row - columnModifier)}</th>`;

      } else {
        const cellData = data[row][column];
        const { hidden, rowspan, colspan } = instance.getCellMetaTransient(row - columnModifier, column - rowModifier);

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
            const value = String(cellData)
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
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
 * Converts a Handsontable instance into an `HTMLTableElement`, built as DOM nodes.
 *
 * The element used to be produced by feeding `instanceToHTML()` to `insertAdjacentHTML`, which is
 * a Trusted Types sink: `toTableElement()` threw under `require-trusted-types-for 'script'`.
 * Building the nodes touches no sink.
 *
 * The result is node-for-node what parsing `instanceToHTML()` produced, which
 * `toTableElement.unit.js` pins by comparing the two. That is why the cell text is written the way
 * it is: `instanceToHTML` escapes `<`/`>` and then encodes spaces as `&nbsp;` and tabs as `&#9;`,
 * so the parsed text carried non-breaking spaces and real tabs. Newlines became `<br>` elements
 * each followed by a newline. The encoder writes "\r\n" after the tag, but the HTML parser
 * normalizes CRLF to LF in text, so the DOM the string form produced carried a bare "\n" - which is
 * what this builds. `toTableElement.unit.js` caught the difference.
 *
 * @param {object} instance The Handsontable instance.
 * @param {Document} rootDocument The document to build the nodes in.
 * @returns {HTMLTableElement} The table element.
 */
export function instanceToTableElement(instance: HotInstance, rootDocument: Document): HTMLTableElement {
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
  const rowModifier = hasRowHeaders ? 1 : 0;
  const columnModifier = hasColumnHeaders ? 1 : 0;
  const table = rootDocument.createElement('table');
  const thead = rootDocument.createElement('thead');
  const tbody = rootDocument.createElement('tbody');

  /**
   * Writes a cell value as text and `<br>` nodes, mirroring the encoder's output.
   *
   * @param {HTMLElement} cell The cell to fill.
   * @param {*} cellData The raw cell value.
   */
  const appendCellValue = (cell: HTMLElement, cellData: unknown) => {
    const encode = (text: string) => text.replaceAll('\x20', '\xA0').replaceAll('\t', '\t');

    String(cellData).split(/\r\n|\n/).forEach((line, index) => {
      if (index > 0) {
        cell.appendChild(rootDocument.createElement('br'));
        cell.appendChild(rootDocument.createTextNode(`\n${encode(line)}`));

        return;
      }

      cell.appendChild(rootDocument.createTextNode(encode(line)));
    });
  };

  for (let row = 0; row < countRows; row += 1) {
    const isColumnHeadersRow = hasColumnHeaders && row === 0;
    const tr = rootDocument.createElement('tr');

    for (let column = 0; column < countCols; column += 1) {
      const isRowHeadersColumn = !isColumnHeadersRow && hasRowHeaders && column === 0;

      if (isColumnHeadersRow) {
        const th = rootDocument.createElement('th');

        th.textContent = String(instance.getColHeader(column - rowModifier));
        tr.appendChild(th);

      } else if (isRowHeadersColumn) {
        const th = rootDocument.createElement('th');

        th.textContent = String(instance.getRowHeader(row - columnModifier));
        tr.appendChild(th);

      } else {
        const cellData = data[row][column];
        const { hidden, rowspan, colspan } = instance.getCellMetaTransient(row - columnModifier, column - rowModifier);

        if (!hidden) {
          const td = rootDocument.createElement('td');

          if (rowspan) {
            td.setAttribute('rowspan', String(rowspan));
          }
          if (colspan) {
            td.setAttribute('colspan', String(colspan));
          }
          if (!isEmpty(cellData)) {
            appendCellValue(td, cellData);
          }

          tr.appendChild(td);
        }
      }
    }

    if (isColumnHeadersRow) {
      thead.appendChild(tr);
    } else {
      tbody.appendChild(tr);
    }
  }

  if (hasColumnHeaders) {
    table.appendChild(thead);
  }

  table.appendChild(tbody);

  return table;
}

/**
 * Converts 2D array into HTMLTableElement.
 *
 * @param {Array} input Input array which will be converted to HTMLTable.
 * @returns {string} OuterHTML of the HTMLTableElement.
 */
// eslint-disable-next-line no-restricted-globals
export function _dataToHTML(input: unknown[][]): string {
  const inputLen = input.length;
  const result = ['<table>'];

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
        (cellData as { toString(): string }).toString()
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
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

const TD_OPEN = /<td\b[^>]*>/i;
const TD_CLOSE = /<\/\s*td\s*>/i;
const paragraphRegexp = /<p.*?>/g;

/**
 * Finds the closing `</td>` that matches the first `<td...>` in `html` at `openEndIndex`.
 * Handles nested `<td>...</td>` (e.g. Excel cells with shapes that contain inner tables).
 *
 * @param {string} html Full HTML string.
 * @param {number} openEndIndex Index right after the opening `<td...>` (after the `>`).
 * @returns {{ start: number, length: number }|null} Start index and length of the matching `</td>`, or null.
 */
function findMatchingTdClose(html: string, openEndIndex: number): { start: number; length: number } | null {
  let depth = 1;
  let searchStart = openEndIndex;

  while (depth > 0) {
    const tail = html.substring(searchStart);
    const openMatch = tail.match(TD_OPEN);
    const closeMatch = tail.match(TD_CLOSE);

    if (!closeMatch) {
      return null;
    }

    const closeIndex = searchStart + (closeMatch.index ?? 0);
    const closeTagLength = closeMatch[0].length;
    const openIndex = openMatch ? searchStart + (openMatch.index ?? 0) : html.length;

    if (openIndex < closeIndex) {
      depth += 1;
      searchStart = openIndex + (openMatch?.[0].length ?? 0);
    } else {
      depth -= 1;

      if (depth === 0) {
        return { start: closeIndex, length: closeTagLength };
      }

      searchStart = closeIndex + closeTagLength;
    }
  }

  return null;
}

/**
 * Replaces each `<td>...</td>` in the HTML string with a normalized version that keeps only
 * text-like content (strips nested tables, VML/shapes, etc.). Uses matching close-tag search
 * so that nested `<td>` (e.g. from Excel paste with shapes) do not truncate the payload.
 * Exported so clipboard HTML can be normalized before sanitization.
 *
 * @param {string} html Raw HTML (e.g. from clipboard text/html).
 * @returns {string} HTML with each cell replaced by opening tag + stripped text + `</td>`.
 */
export function replaceTdCellsWithTextContent(html: string): string {
  const result = [];
  let pos = 0;

  while (pos < html.length) {
    const openMatch = html.substring(pos).match(TD_OPEN);

    if (!openMatch) {
      result.push(html.substring(pos));
      break;
    }

    const openStart = pos + (openMatch.index ?? 0);
    const openTag = openMatch[0];
    const openEnd = openStart + openTag.length;

    result.push(html.substring(pos, openStart));

    const closeInfo = findMatchingTdClose(html, openEnd);

    if (!closeInfo) {
      // Malformed HTML (no matching </td>): leave rest as-is to avoid truncation.
      result.push(html.substring(openStart));
      break;
    }

    const cellFragment = html.substring(openStart, closeInfo.start + closeInfo.length);
    const contentEnd = closeInfo.start - openStart;
    let rawContent = cellFragment
      .substring(openTag.length, contentEnd)
      .trim()
      .replaceAll(/\n\s+/g, ' ') // HTML tags may be split using multiple new lines and whitespaces
      .replaceAll(paragraphRegexp, '\n') // Only paragraphs should split text using new line characters
      .replace(/^\n+/, '') // First paragraph shouldn't start with new line characters
      .replaceAll(/<\/(.*)>\s+$/mg, '</$1>'); // HTML tags may end with whitespace.

    // Iterative tag removal prevents crafted inputs (e.g. <<script>script>) from re-forming tags after one pass.
    let prev: string;

    do {
      prev = rawContent;
      rawContent = rawContent.replace(/<(?!br\b)[^>]+>/gi, '');
    } while (rawContent !== prev);

    rawContent = rawContent.replaceAll(/^&nbsp;$/mg, ''); // Removing single &nbsp; characters separating new lines

    result.push(`${openTag}${rawContent}</td>`);
    pos = closeInfo.start + closeInfo.length;
  }

  return result.join('');
}

/**
 * Converts HTMLTable or string into Handsontable configuration object.
 *
 * @param {Element|string} element Node element which should contain `<table>...</table>`. May also
 * be a `TrustedHTML`, which is what a page enforcing Trusted Types gets back from its sanitizer;
 * it is handed to the parser untouched.
 * @param {Document} [rootDocument] The document window owner.
 * @param {object} [options] Parsing options.
 * @param {boolean} [options.normalize=true] Whether to run `replaceTdCellsWithTextContent()` on the
 * markup first. Callers that already normalized pass `false` - the clipboard path does, because it
 * must normalize before sanitizing so the sanitizer's value reaches the parser unmodified.
 * @returns {object} Return configuration object. Contains keys as DefaultSettings.
 */
export function htmlToGridSettings(
  element: HTMLTableElement | string | { toString(): string },
  // eslint-disable-next-line no-restricted-globals
  rootDocument: Document = document,
  options: { normalize?: boolean } = {}
) {
  const settingsObj: Record<string, unknown> = {};

  let checkElement: HTMLTableElement | string | { toString(): string } | null = element;
  // Root the sibling-node lookups below (currently only the generator `<meta>`) at the parsed
  // markup. Stays `null` when a live element is passed in, which is what the previous
  // implementation effectively did - the scratch element it searched was empty in that case.
  let parsedRoot: Document | null = null;

  // Anything that is not a live node is markup to parse. Tested by the absence of `nodeType`
  // rather than `typeof === 'string'`, because a `TrustedHTML` is an object: the string test sent
  // it down the element branch instead, where it matched no table and the paste silently produced
  // nothing.
  if (checkElement !== null && checkElement !== undefined &&
      (typeof checkElement === 'string' || !(checkElement as Node).nodeType)) {
    // Use replaceTdCellsWithTextContent so nested <td> (e.g. Excel shape cells) are matched
    // correctly. Skipped when the caller normalized already - see `options.normalize`.
    const normalizedHTML = options.normalize === false
      ? checkElement as string
      : replaceTdCellsWithTextContent(checkElement as string);

    // `DOMParser` builds a document with no browsing context, so reading the pasted markup cannot
    // run any of it: no image fetch, no `onerror`, no script. Writing the same string into a
    // detached element of `rootDocument` does run it - the element is detached, but the document
    // owning it is not inert, which is how an `<img src=x onerror>` in a paste payload executed.
    // The parsed nodes are only ever read from here. Importing them into `rootDocument` would
    // make them live again, so never do that.
    // eslint-disable-next-line no-restricted-globals
    const Parser = rootDocument.defaultView?.DOMParser ?? DOMParser;

    parsedRoot = new Parser().parseFromString(normalizedHTML, 'text/html');
    checkElement = parsedRoot.querySelector<HTMLTableElement>('table');
  }

  if (!checkElement || !isHTMLTable(checkElement as HTMLElement)) {
    return;
  }

  const el: HTMLTableElement = checkElement as HTMLTableElement;
  const generator = parsedRoot?.querySelector<HTMLMetaElement>('meta[name$="enerator"]') ?? null;
  const hasRowHeaders = el.querySelector('tbody th') !== null;
  const trElement = el.querySelector('tr') as HTMLTableRowElement | null;
  const countCols = !trElement ? 0 : (Array.from(trElement.cells)
    .reduce((cols: number, cell: HTMLTableCellElement) => cols + cell.colSpan, 0)) - (hasRowHeaders ? 1 : 0);
  const fixedRowsBottom: HTMLTableRowElement[] = el.tFoot && Array.from(el.tFoot.rows) || [];
  const fixedRowsTop: HTMLTableRowElement[] = [];
  let hasColHeaders = false;
  let thRowsLen = 0;
  let countRows = 0;

  if (el.tHead) {
    const thRows = Array.from(el.tHead.rows).filter((tr: HTMLTableRowElement) => {
      const isDataRow = tr.querySelector('td') !== null;

      if (isDataRow) {
        fixedRowsTop.push(tr);
      }

      return !isDataRow;
    });

    thRowsLen = thRows.length;
    hasColHeaders = thRowsLen > 0;

    if (thRowsLen > 1) {
      settingsObj.nestedHeaders = Array.from(thRows).reduce((rows: unknown[], row: HTMLTableRowElement) => {
        const headersRow = Array.from(row.cells).reduce(
          (headers: unknown[], header: HTMLTableCellElement, currentIndex: number) => {
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
      settingsObj.colHeaders = Array.from(thRows[0].children).reduce(
        (headers: unknown[], header: Element, index: number) => {
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

  const dataRows: HTMLTableRowElement[] = [
    ...fixedRowsTop,
    ...(Array.from(el.tBodies) as HTMLTableSectionElement[]).reduce(
      (sections: HTMLTableRowElement[], section: HTMLTableSectionElement) => {
        Array.from(section.rows).forEach((row: HTMLTableRowElement) => {
          sections.push(row);
        });

        return sections;
      }, []),
    ...fixedRowsBottom];

  countRows = dataRows.length;

  const dataArr: Array<Array<string | null | undefined>> = Array.from({ length: countRows }, () =>
    Array.from<string | null | undefined>({ length: countCols })
  );

  const mergeCells: unknown[] = [];
  const rowHeaders: unknown[] = [];

  for (let row = 0; row < countRows; row++) {
    const tr = dataRows[row] as HTMLTableRowElement;
    const cells: HTMLTableCellElement[] = Array.from(tr.cells);
    const cellsLen = cells.length;

    for (let cellId = 0; cellId < cellsLen; cellId++) {
      const cell = cells[cellId] as HTMLTableCellElement;
      const {
        nodeName,
        innerHTML,
        rowSpan: rowspan,
        colSpan: colspan,
      } = cell;
      const col: number = dataArr[row].findIndex((value: string | null | undefined) => value === undefined);

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
