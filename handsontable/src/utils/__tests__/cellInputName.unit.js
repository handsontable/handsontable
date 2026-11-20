import { CELL_EDITOR_PHRASES, COMMENT_EDITOR_PHRASES, setCellInputName } from '../cellInputName';
import { getColumnLabel, getRowLabel } from '../headerLabel';
import { getTranslatedPhrase, registerLanguageDictionary } from '../../i18n/registry';
import enUS from '../../i18n/languages/en-US';
import plPL from '../../i18n/languages/pl-PL';

/**
 * Builds the slice of a Handsontable instance the helpers read.
 *
 * @param {object} options The stub's state.
 * @param {string[]} [options.renderedHeaders] The markup of each rendered column header label, by column.
 * @param {Array} [options.colHeaders] What `getColHeader()` answers, by column.
 * @param {boolean|Array|Function} [options.rowHeaders] The `rowHeaders` setting.
 * @param {boolean} [options.ariaTags] The `ariaTags` setting.
 * @param {string} [options.language] The `language` setting.
 * @param {Function} [options.modifyRowHeader] What a `modifyRowHeader` listener answers for a visual row.
 * @param {boolean|Function} [options.textExtractor] The `textExtractor` setting.
 * @param {Function} [options.modifyRowHeaderValue] What a `modifyRowHeaderValue` listener answers for a header.
 * @returns {object}
 */
function createHot({
  renderedHeaders = [], colHeaders = [], rowHeaders = true, ariaTags = true, language = 'en-US',
  modifyRowHeader = row => row, textExtractor = false, modifyRowHeaderValue = value => value,
} = {}) {
  const hot = {
    runHooks: (hookName, value) => (hookName === 'modifyRowHeader' ? modifyRowHeader(value) : value),
    getSettings: () => ({ ariaTags, textExtractor, rowHeaders }),
    getColHeader: column => colHeaders[column],
    getCell(row, column) {
      if (row !== -1 || renderedHeaders[column] === undefined) {
        return null;
      }

      const TH = document.createElement('th');
      const label = document.createElement('span');

      label.className = 'colHeader';
      label.innerHTML = renderedHeaders[column];
      TH.appendChild(label);

      return TH;
    },
    getTranslatedPhrase: (key, args) => getTranslatedPhrase(language, key, args),
    getRowHeader(row) {
      const physicalRow = modifyRowHeader(row);
      let header = rowHeaders;

      if (physicalRow === undefined) {
        return [];
      }

      if (Array.isArray(rowHeaders) && rowHeaders[physicalRow] !== undefined) {
        header = rowHeaders[physicalRow];
      } else if (typeof rowHeaders === 'function') {
        header = rowHeaders(physicalRow);
      } else if (rowHeaders && typeof rowHeaders !== 'string' && typeof rowHeaders !== 'number') {
        header = physicalRow + 1;
      }

      return header ? modifyRowHeaderValue(header, row) : header;
    },
  };

  return hot;
}

describe('getColumnLabel', () => {
  it('reads the rendered header text', () => {
    expect(getColumnLabel(createHot({ renderedHeaders: ['Name'] }), 0)).toBe('Name');
  });

  it('reads a line break as a space and drops the markup', () => {
    expect(getColumnLabel(createHot({ renderedHeaders: ['<b>First</b><br>  name'] }), 0)).toBe('First name');
  });

  it('reads a header that is not rendered from getColHeader(), as plain text', () => {
    expect(getColumnLabel(createHot({ colHeaders: ['Unit<br>price &amp; tax'] }), 0)).toBe('Unit price & tax');
  });

  it('reads a header that is not rendered through a configured textExtractor', () => {
    const textExtractor = jest.fn(content => `${content} (extracted)`);
    const hot = createHot({ colHeaders: ['Price'], textExtractor });

    expect(getColumnLabel(hot, 0)).toBe('Price (extracted)');
    expect(textExtractor).toHaveBeenCalledWith('Price', 'A11y.columnLabel');
  });

  it('reads neither getColHeader() nor the textExtractor when the rendered header has text', () => {
    const textExtractor = jest.fn(content => content);
    const hot = createHot({ renderedHeaders: ['Name'], colHeaders: ['Name'], textExtractor });
    const getColHeader = jest.spyOn(hot, 'getColHeader');

    expect(getColumnLabel(hot, 0)).toBe('Name');
    expect(getColHeader).not.toHaveBeenCalled();
    expect(textExtractor).not.toHaveBeenCalled();
  });

  it('names a column without a label by its spreadsheet letter', () => {
    expect(getColumnLabel(createHot({ renderedHeaders: [' ', ' ', ''], colHeaders: [] }), 2)).toBe('C');
  });
});

describe('getRowLabel', () => {
  it('reads the default row header as the row number', () => {
    expect(getRowLabel(createHot(), 2)).toBe(3);
  });

  it('numbers the row through modifyRowHeader, as the row header does', () => {
    expect(getRowLabel(createHot({ modifyRowHeader: row => row + 20 }), 0)).toBe(21);
  });

  it('falls back to the visual row when no listener answers modifyRowHeader', () => {
    expect(getRowLabel(createHot({ modifyRowHeader: () => undefined }), 4)).toBe(5);
  });

  it('numbers the row when the grid shows no row headers', () => {
    expect(getRowLabel(createHot({ rowHeaders: false }), 1)).toBe(2);
  });

  it('reads an array of row headers as the text the header shows', () => {
    expect(getRowLabel(createHot({ rowHeaders: ['Q1', 'Q2', 'Q3'] }), 1)).toBe('Q2');
  });

  it('reads a row header function with the row the header passes it', () => {
    const rowHeaders = jest.fn(row => `Item ${row * 10}`);

    expect(getRowLabel(createHot({ rowHeaders, modifyRowHeader: row => row + 1 }), 0)).toBe('Item 10');
    expect(rowHeaders).toHaveBeenCalledWith(1);
  });

  it('keeps a numeric custom row header a number', () => {
    expect(getRowLabel(createHot({ rowHeaders: row => row * 10 }), 2)).toBe(20);
  });

  it('reads a row header with markup as plain text, through a configured textExtractor', () => {
    const textExtractor = jest.fn(content => content);

    expect(getRowLabel(createHot({ rowHeaders: ['<b>North</b><br>region'], textExtractor }), 0))
      .toBe('North region');
    expect(textExtractor).toHaveBeenCalledWith('<b>North</b><br>region', 'A11y.rowLabel');
  });

  it('reads a row header a modifyRowHeaderValue listener renamed', () => {
    const hot = createHot({ modifyRowHeaderValue: (value, row) => (row === 2 ? 'Q3' : value) });

    expect(getRowLabel(hot, 2)).toBe('Q3');
    expect(getRowLabel(hot, 1)).toBe(2);
  });

  it('runs modifyRowHeader once for a row that shows a header', () => {
    const modifyRowHeader = jest.fn(row => row);

    expect(getRowLabel(createHot({ modifyRowHeader }), 1)).toBe(2);
    expect(getRowLabel(createHot({ modifyRowHeader, rowHeaders: ['Q1', 'Q2'] }), 1)).toBe('Q2');
    expect(modifyRowHeader).toHaveBeenCalledTimes(2);
  });

  it('numbers the row when a modifyRowHeader listener answers nothing', () => {
    expect(getRowLabel(createHot({ modifyRowHeader: () => undefined, rowHeaders: ['Q1', 'Q2'] }), 1)).toBe(2);
  });

  it('numbers a row whose custom header is empty', () => {
    expect(getRowLabel(createHot({ rowHeaders: ['', ''] }), 1)).toBe(2);
  });
});

describe('setCellInputName', () => {
  beforeAll(() => {
    registerLanguageDictionary(enUS);
    registerLanguageDictionary(plPL);
  });

  it('names the control after the column label and the row number counted from 1', () => {
    const input = document.createElement('textarea');

    setCellInputName(createHot({ renderedHeaders: ['Name', 'Age'] }), input, CELL_EDITOR_PHRASES, 2, 1);

    expect(input.getAttribute('aria-label')).toBe('Age, row 3');
  });

  it('names the control after a custom row header without the word "row"', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Metric'], rowHeaders: ['Q1', 'Q2'] });

    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 1, 0);

    expect(input.getAttribute('aria-label')).toBe('Metric, Q2');
  });

  it('uses the phrases it is given', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'] });

    setCellInputName(hot, input, COMMENT_EDITOR_PHRASES, 0, 0);
    expect(input.getAttribute('aria-label')).toBe('Comment for Name, row 1');

    setCellInputName(createHot({ renderedHeaders: ['Name'], rowHeaders: ['Q1'] }), input, COMMENT_EDITOR_PHRASES, 0, 0);
    expect(input.getAttribute('aria-label')).toBe('Comment for Name, Q1');
  });

  it('uses the grid\'s language', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'], language: plPL.languageCode });

    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 1, 0);

    expect(input.getAttribute('aria-label')).toBe('Name, wiersz 2');
  });

  it('removes the name it wrote when ariaTags is off', () => {
    const input = document.createElement('textarea');

    setCellInputName(createHot({ renderedHeaders: ['Name'] }), input, CELL_EDITOR_PHRASES, 0, 0);
    setCellInputName(createHot({ renderedHeaders: ['Name'], ariaTags: false }), input, CELL_EDITOR_PHRASES, 0, 0);

    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('removes the name it wrote for a header coordinate', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'] });

    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 0, 0);
    setCellInputName(hot, input, CELL_EDITOR_PHRASES, -1, 0);

    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('renames the control it named when the selection moves', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name', 'Age'] });

    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 0, 0);
    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 1, 1);

    expect(input.getAttribute('aria-label')).toBe('Age, row 2');
  });

  it('keeps an aria-label the application wrote, also with ariaTags off', () => {
    const input = document.createElement('textarea');

    input.setAttribute('aria-label', 'My custom label');
    setCellInputName(createHot({ renderedHeaders: ['Name'] }), input, CELL_EDITOR_PHRASES, 0, 0);
    expect(input.getAttribute('aria-label')).toBe('My custom label');

    setCellInputName(createHot({ renderedHeaders: ['Name'], ariaTags: false }), input, CELL_EDITOR_PHRASES, 0, 0);
    expect(input.getAttribute('aria-label')).toBe('My custom label');
  });

  it('keeps an aria-label the application wrote over the name the grid wrote before', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name', 'Age'] });

    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 0, 0);
    input.setAttribute('aria-label', 'My custom label');
    setCellInputName(hot, input, CELL_EDITOR_PHRASES, 1, 1);

    expect(input.getAttribute('aria-label')).toBe('My custom label');
  });

  it('writes no aria-label on a control the application names with aria-labelledby', () => {
    const input = document.createElement('textarea');

    input.setAttribute('aria-labelledby', 'my-label');
    setCellInputName(createHot({ renderedHeaders: ['Name'] }), input, CELL_EDITOR_PHRASES, 0, 0);

    expect(input.hasAttribute('aria-label')).toBe(false);
  });
});
