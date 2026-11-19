import { setCellInputName } from '../cellInputName';
import { getColumnLabel } from '../columnLabel';
import { EDITOR_INPUT_LABEL, COMMENTS_EDITOR_LABEL } from '../../i18n/constants';
import { getTranslatedPhrase, registerLanguageDictionary } from '../../i18n/registry';
import enUS from '../../i18n/languages/en-US';
import plPL from '../../i18n/languages/pl-PL';

/**
 * Builds the slice of a Handsontable instance the helpers read.
 *
 * @param {object} options The stub's state.
 * @param {string[]} [options.renderedHeaders] The markup of each rendered column header label, by column.
 * @param {Array} [options.colHeaders] What `getColHeader()` answers, by column.
 * @param {boolean} [options.ariaTags] The `ariaTags` setting.
 * @param {string} [options.language] The `language` setting.
 * @param {Function} [options.modifyRowHeader] What a `modifyRowHeader` listener answers for a visual row.
 * @param {boolean|Function} [options.textExtractor] The `textExtractor` setting.
 * @returns {object}
 */
function createHot({
  renderedHeaders = [], colHeaders = [], ariaTags = true, language = 'en-US', modifyRowHeader = row => row,
  textExtractor = false,
} = {}) {
  return {
    runHooks: (hookName, value) => (hookName === 'modifyRowHeader' ? modifyRowHeader(value) : value),
    getSettings: () => ({ ariaTags, textExtractor }),
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
  };
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

  it('names a column without a label by its spreadsheet letter', () => {
    expect(getColumnLabel(createHot({ renderedHeaders: [' ', ' ', ''], colHeaders: [] }), 2)).toBe('C');
  });
});

describe('setCellInputName', () => {
  beforeAll(() => {
    registerLanguageDictionary(enUS);
    registerLanguageDictionary(plPL);
  });

  it('names the control after the column label and the row number counted from 1', () => {
    const input = document.createElement('textarea');

    setCellInputName(createHot({ renderedHeaders: ['Name', 'Age'] }), input, EDITOR_INPUT_LABEL, 2, 1);

    expect(input.getAttribute('aria-label')).toBe('Age, row 3');
  });

  it('numbers the row the way the row header does, through modifyRowHeader', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'], modifyRowHeader: row => row + 20 });

    setCellInputName(hot, input, EDITOR_INPUT_LABEL, 0, 0);

    expect(input.getAttribute('aria-label')).toBe('Name, row 21');
  });

  it('falls back to the visual row when no listener answers modifyRowHeader', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'], modifyRowHeader: () => undefined });

    setCellInputName(hot, input, EDITOR_INPUT_LABEL, 4, 0);

    expect(input.getAttribute('aria-label')).toBe('Name, row 5');
  });

  it('uses the phrase it is given', () => {
    const input = document.createElement('textarea');

    setCellInputName(createHot({ renderedHeaders: ['Name'] }), input, COMMENTS_EDITOR_LABEL, 0, 0);

    expect(input.getAttribute('aria-label')).toBe('Comment for Name, row 1');
  });

  it('uses the grid\'s language', () => {
    const input = document.createElement('textarea');
    const hot = createHot({ renderedHeaders: ['Name'], language: plPL.languageCode });

    setCellInputName(hot, input, EDITOR_INPUT_LABEL, 1, 0);

    expect(input.getAttribute('aria-label')).toBe('Name, wiersz 2');
  });

  it('removes the name with ariaTags off', () => {
    const input = document.createElement('textarea');

    input.setAttribute('aria-label', 'Name, row 1');
    setCellInputName(createHot({ renderedHeaders: ['Name'], ariaTags: false }), input, EDITOR_INPUT_LABEL, 0, 0);

    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('removes the name for a header coordinate', () => {
    const input = document.createElement('textarea');

    input.setAttribute('aria-label', 'Name, row 1');
    setCellInputName(createHot({ renderedHeaders: ['Name'] }), input, EDITOR_INPUT_LABEL, -1, 0);

    expect(input.hasAttribute('aria-label')).toBe(false);
  });
});
