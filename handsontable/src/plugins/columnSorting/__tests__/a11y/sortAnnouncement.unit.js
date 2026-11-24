import Handsontable from '../../../../base';
import { registerPlugin } from '../../../registry';
import { ColumnSorting } from '../../columnSorting';
import { MultiColumnSorting } from '../../../multiColumnSorting/multiColumnSorting';
import plPL from '../../../../i18n/languages/pl-PL';
import { TEST_LICENSE_KEY } from '../../../../../test/helpers/licenseKey';

/**
 * A sort the user makes (a header press, `Enter`, `Shift+Enter`) is announced through the polite live
 * region, because `aria-sort` is only read when the header is focused again. A sort made through the API
 * is not announced.
 */
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('%s announcements', (pluginKey, PluginClass) => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(PluginClass);
    Handsontable.languages.registerLanguageDictionary(plPL);
  });

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.useRealTimers();
  });

  /**
   * Builds the grid.
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [['Lina', 34, 'x'], ['Arjun', 21, 'y'], ['Mateo', 45, 'z']],
      colHeaders: ['Name', 'Age', 'Tag'],
      navigableHeaders: true,
      [pluginKey]: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads a live region of the announcer.
   *
   * @param {'polite'|'assertive'} politeness The region.
   * @returns {string}
   */
  function region(politeness) {
    return document.querySelector(`[role="status"][aria-live="${politeness}"]`).textContent;
  }

  /**
   * Runs the timers past the delay the announcer keeps before it writes a message.
   */
  function settle() {
    jest.advanceTimersByTime(150);
  }

  /**
   * Presses and releases a column header the way a mouse does.
   *
   * @param {number} column The visual column.
   * @param {object} [eventProps] Properties of the mouse events, such as `ctrlKey`.
   */
  function clickHeader(column, eventProps = {}) {
    const label = document.createElement('span');
    const event = new MouseEvent('mousedown', { button: 0, ...eventProps });
    const coords = { row: -1, col: column };

    // The plugin treats a press as a sort only when `event.target` is a header label, so the event is
    // dispatched on a detached one.
    label.className = 'colHeader';
    label.dispatchEvent(event);

    hot.runHooks('beforeOnCellMouseDown', event, coords, null, { row: false, column: false, cell: false });
    hot.selectColumns(column);
    hot.runHooks('afterOnCellMouseDown', event, coords, null);
    hot.runHooks('afterOnCellMouseUp', new MouseEvent('mouseup', eventProps), coords, null);
  }

  /**
   * Runs the shortcut of the plugin registered for the keys on the selected header.
   *
   * @param {string[]} keys The keys, for example `['Enter']`.
   */
  function pressOnHeader(keys) {
    const shortcut = hot.getShortcutManager().getContext('grid')
      .getShortcuts(keys)
      .find(candidate => ['columnSorting', 'multiColumnSorting'].includes(candidate.group));

    expect(shortcut).toBeDefined();
    expect(shortcut.runOnlyIf()).toBe(true);
    shortcut.callback(new KeyboardEvent('keydown'));
  }

  it('should announce the column and the direction after a header press, then the removal', () => {
    buildGrid();

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by Age, ascending');

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by Age, descending');

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorting removed from Age');
    expect(region('assertive')).toBe('');
  });

  it('should announce after Enter on a focused header', () => {
    buildGrid();

    hot.selectCell(-1, 0);
    pressOnHeader(['Enter']);
    settle();

    expect(region('polite')).toBe('Sorted by Name, ascending');
    expect(hot.getDataAtCol(0)).toEqual(['Arjun', 'Lina', 'Mateo']);
  });

  it('should not announce a sort made through the API', () => {
    buildGrid();

    hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });
    hot.getPlugin(pluginKey).setSortConfig([{ column: 0, sortOrder: 'desc' }]);
    hot.getPlugin(pluginKey).clearSort();
    settle();

    expect(region('polite')).toBe('');
    expect(region('assertive')).toBe('');
  });

  it('should not announce a sort the beforeColumnSort hook cancels', () => {
    buildGrid({ beforeColumnSort: () => false });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('');
    expect(hot.getDataAtCol(1)).toEqual([34, 21, 45]);
  });

  it('should not announce when ariaTags is off', () => {
    buildGrid({ ariaTags: false });

    clickHeader(1);
    settle();

    expect(hot.getDataAtCol(1)).toEqual([21, 34, 45]);
    expect(region('polite')).toBe('');
  });

  it('should strip the markup of a header label', () => {
    buildGrid({ colHeaders: ['Name', '<b>Age</b> in <i>years</i>', 'Tag'] });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by Age in years, ascending');
  });

  it('should read a line break in a header label as a space', () => {
    buildGrid({ colHeaders: ['Name', 'Age<br>in years', 'Tag'] });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by Age in years, ascending');
  });

  it('should not announce the sort of the initialConfig option', () => {
    buildGrid({ [pluginKey]: { initialConfig: { column: 1, sortOrder: 'asc' } } });
    settle();

    expect(hot.getDataAtCol(1)).toEqual([21, 34, 45]);
    expect(region('polite')).toBe('');
  });

  it('should announce a header press whose sort a server-side beforeColumnSort hook writes with setSortConfig', () => {
    buildGrid({
      beforeColumnSort(currentConfig, destinationConfig) {
        this.getPlugin(pluginKey).setSortConfig(destinationConfig);

        return false;
      },
    });

    clickHeader(1);
    settle();

    expect(hot.getDataAtCol(1)).toEqual([34, 21, 45]);
    expect(region('polite')).toBe('Sorted by Age, ascending');
  });

  it('should fall back to the English phrase when the language pack has no phrase for the announcement', () => {
    Handsontable.languages.registerLanguageDictionary({ languageCode: 'xx-XX', 'Common:ok': 'ok' });
    buildGrid({ language: 'xx-XX' });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by Age, ascending');
  });

  it('should announce a header sort that waited for the validator of an edited cell', async() => {
    const held = [];

    buildGrid({
      cells: (row, col) => (col === 0 ? {
        validator(value, callback) {
          held.push(callback);
        },
      } : {}),
    });

    hot.selectCell(1, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue('Zed');
    clickHeader(1);
    settle();

    expect(held).toHaveLength(1);
    expect(hot.getDataAtCol(1)).toEqual([34, 21, 45]);
    expect(region('polite')).toBe('');

    held.shift()(true);

    // The validator answer resumes the queued sort in microtasks.
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    settle();

    expect(hot.getDataAtCol(1)).toEqual([21, 34, 45]);
    expect(region('polite')).toBe('Sorted by Age, ascending');
  });

  it('should announce the order of the pressed column when visual and physical columns differ', () => {
    buildGrid();
    hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.render();

    clickHeader(0);
    settle();

    expect(region('polite')).toBe('Sorted by Tag, ascending');
    expect(hot.getCell(-1, 0).getAttribute('aria-sort')).toBe('ascending');

    clickHeader(0);
    settle();

    expect(region('polite')).toBe('Sorted by Tag, descending');
    expect(hot.getCell(-1, 0).getAttribute('aria-sort')).toBe('descending');
    expect(hot.getCell(-1, 1).getAttribute('aria-sort')).toBe('none');
  });

  describe('with a header that is not rendered', () => {
    /**
     * Sorts a column through the gesture seam while the header cell is not in the DOM.
     *
     * @param {Array} colHeaders The header labels.
     */
    function sortWithoutRenderedHeader(colHeaders) {
      buildGrid({ colHeaders });
      jest.spyOn(hot, 'getCell').mockReturnValue(null);
      hot.getPlugin(pluginKey).sortByUser({ column: 1, sortOrder: 'asc' }, 1);
      settle();
    }

    it('should read a plain text label from the header setting', () => {
      sortWithoutRenderedHeader(['Name', 'Age', 'Tag']);

      expect(region('polite')).toBe('Sorted by Age, ascending');
    });

    it('should strip the tags of a label that is markup', () => {
      sortWithoutRenderedHeader(['Name', '<b>Age</b>', 'Tag']);

      expect(region('polite')).toBe('Sorted by Age, ascending');
    });

    it('should read a line break as a space and decode a character reference', () => {
      sortWithoutRenderedHeader(['Name', 'Age<br>in years &amp; more', 'Tag']);

      expect(region('polite')).toBe('Sorted by Age in years & more, ascending');
    });

    it('should name the column by its letter when the label is empty', () => {
      sortWithoutRenderedHeader(['Name', '', 'Tag']);

      expect(region('polite')).toBe('Sorted by B, ascending');
    });
  });

  it('should name the column by its letter when the header label is empty', () => {
    buildGrid({ colHeaders: ['Name', '', 'Tag'] });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Sorted by B, ascending');
  });

  it('should keep writing aria-sort on the header', () => {
    buildGrid();

    clickHeader(1);

    expect(hot.getCell(-1, 1).getAttribute('aria-sort')).toBe('ascending');
  });

  it('should announce the translated phrase', () => {
    buildGrid({ language: 'pl-PL' });

    clickHeader(1);
    settle();

    expect(region('polite')).toBe('Posortowano według Age, rosnąco');
  });

  if (pluginKey === 'multiColumnSorting') {
    /**
     * Presses a header with Ctrl held, which adds the column to the sort.
     *
     * @param {number} column The visual column.
     */
    const ctrlClickHeader = (column) => {
      const ctrlSpy = jest.spyOn(hot.getShortcutManager(), 'isCtrlPressed').mockReturnValue(true);

      clickHeader(column, { ctrlKey: true });
      ctrlSpy.mockRestore();
    };

    it('should announce the column of a Ctrl+click and a Shift+Enter with its place in the sort (DEV-4013)', () => {
      buildGrid();

      clickHeader(0);
      settle();

      expect(region('polite')).toBe('Sorted by Name, ascending');

      ctrlClickHeader(1);
      settle();

      expect(region('polite')).toBe('Sorted by Age, ascending, sort priority 2');
      expect(hot.getPlugin(pluginKey).getSortConfig()).toHaveLength(2);

      hot.selectCell(-1, 2);
      pressOnHeader(['Shift', 'Enter']);
      settle();

      expect(region('polite')).toBe('Sorted by Tag, ascending, sort priority 3');
    });

    it('should announce the place the header draws when a sorted column is pressed again', () => {
      buildGrid();

      clickHeader(0);
      ctrlClickHeader(1);
      // A Ctrl+click on a sorted column changes its direction and moves it to the end of the sort.
      ctrlClickHeader(0);
      settle();

      expect(region('polite')).toBe('Sorted by Name, descending, sort priority 2');
      expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([
        { column: 1, sortOrder: 'asc' },
        { column: 0, sortOrder: 'desc' },
      ]);
    });

    it('should announce no place once one sorted column is left', () => {
      buildGrid();

      clickHeader(0);
      ctrlClickHeader(1);
      ctrlClickHeader(1);
      ctrlClickHeader(1);
      settle();

      expect(region('polite')).toBe('Sorting removed from Age');

      ctrlClickHeader(0);
      settle();

      expect(region('polite')).toBe('Sorted by Name, descending');
    });

    it('should announce the place in the translated phrase', () => {
      buildGrid({ language: 'pl-PL' });

      clickHeader(0);
      ctrlClickHeader(1);
      settle();

      expect(region('polite')).toBe('Posortowano według Age, rosnąco, priorytet sortowania 2');
    });

    it('should fall back to the English phrase with the place when the language pack lacks it', () => {
      Handsontable.languages.registerLanguageDictionary({ languageCode: 'xy-XY', 'Common:ok': 'ok' });
      buildGrid({ language: 'xy-XY' });

      clickHeader(0);
      ctrlClickHeader(1);
      settle();

      expect(region('polite')).toBe('Sorted by Age, ascending, sort priority 2');
    });
  }
});
