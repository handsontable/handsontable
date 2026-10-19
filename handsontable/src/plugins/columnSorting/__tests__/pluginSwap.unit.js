import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';

const DATA = [
  ['Lina', 34],
  ['Arjun', 21],
  ['Mateo', 45],
  ['Chen', 28],
  ['Femi', 39],
];

/**
 * Returns the sorting-conflict warnings logged through `console.warn`.
 *
 * @param {jest.SpyInstance} warnSpy The `console.warn` spy.
 * @returns {string[]}
 */
function conflictWarnings(warnSpy) {
  return warnSpy.mock.calls
    .map(args => args.join(' '))
    .filter(message => message.includes('should not be enabled simultaneously'));
}

describe('ColumnSorting and MultiColumnSorting swapped in one updateSettings call', () => {
  let container;
  let hot;
  let warnSpy;

  beforeAll(() => {
    registerPlugin(ColumnSorting);
    registerPlugin(MultiColumnSorting);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    warnSpy.mockRestore();
  });

  /**
   * Builds a grid with one of the two sorting plugins enabled.
   *
   * @param {string} pluginKey The sorting plugin to enable.
   * @returns {Handsontable}
   */
  function createGrid(pluginKey) {
    return new Handsontable(container, {
      data: DATA.map(row => [...row]),
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      [pluginKey]: true,
    });
  }

  it('keeps `columnSorting` enabled when it replaces `multiColumnSorting`', () => {
    hot = createGrid('multiColumnSorting');

    hot.updateSettings({ columnSorting: true, multiColumnSorting: false });

    expect(hot.getPlugin('columnSorting').enabled).toBe(true);
    expect(hot.getPlugin('multiColumnSorting').enabled).toBe(false);
    expect(hot.getSettings().columnSorting).toBe(true);
    expect(hot.getSettings().multiColumnSorting).toBe(false);
    expect(conflictWarnings(warnSpy)).toEqual([]);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(1)).toEqual([21, 28, 34, 39, 45]);
  });

  it('keeps `multiColumnSorting` enabled when it replaces `columnSorting`', () => {
    hot = createGrid('columnSorting');

    hot.updateSettings({ columnSorting: false, multiColumnSorting: true });

    expect(hot.getPlugin('columnSorting').enabled).toBe(false);
    expect(hot.getPlugin('multiColumnSorting').enabled).toBe(true);
    expect(hot.getSettings().multiColumnSorting).toBe(true);
    expect(conflictWarnings(warnSpy)).toEqual([]);

    hot.getPlugin('multiColumnSorting').sort({ column: 1, sortOrder: 'desc' });

    expect(hot.getDataAtCol(1)).toEqual([45, 39, 34, 28, 21]);
  });

  it('swaps back and forth without leaving either plugin stuck', () => {
    hot = createGrid('multiColumnSorting');

    hot.updateSettings({ columnSorting: true, multiColumnSorting: false });
    hot.updateSettings({ columnSorting: false, multiColumnSorting: true });
    hot.updateSettings({ columnSorting: true, multiColumnSorting: false });

    expect(hot.getPlugin('columnSorting').enabled).toBe(true);
    expect(hot.getPlugin('multiColumnSorting').enabled).toBe(false);
    expect(conflictWarnings(warnSpy)).toEqual([]);

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['Arjun', 'Chen', 'Femi', 'Lina', 'Mateo']);
  });

  it('applies the sort config of the plugin that takes over', () => {
    hot = createGrid('multiColumnSorting');

    hot.updateSettings({
      columnSorting: { initialConfig: { column: 1, sortOrder: 'asc' } },
      multiColumnSorting: false,
    });

    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(1)).toEqual([21, 28, 34, 39, 45]);
  });

  it('keeps the Enter header shortcut of the plugin that takes over', () => {
    hot = createGrid('multiColumnSorting');

    const sortingEnterShortcuts = () => hot.getShortcutManager().getContext('grid')
      .getShortcuts(['Enter'])
      .filter(shortcut => shortcut.group === 'columnSorting');

    expect(sortingEnterShortcuts()).toHaveLength(1);

    hot.updateSettings({ columnSorting: true, multiColumnSorting: false });

    expect(sortingEnterShortcuts()).toHaveLength(1);

    hot.updateSettings({ columnSorting: false, multiColumnSorting: true });

    expect(sortingEnterShortcuts()).toHaveLength(1);
  });

  it('sorts the rows when the replaced plugin had sorted them before the swap', () => {
    hot = createGrid('multiColumnSorting');

    hot.getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });
    hot.updateSettings({
      columnSorting: { initialConfig: { column: 1, sortOrder: 'asc' } },
      multiColumnSorting: false,
    });

    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(1)).toEqual([21, 28, 34, 39, 45]);

    hot.getPlugin('columnSorting').clearSort();

    expect(hot.getDataAtCol(0)).toEqual(['Lina', 'Arjun', 'Mateo', 'Chen', 'Femi']);
  });

  it('still disables the second plugin and names the working one when both stay enabled', () => {
    hot = createGrid('columnSorting');

    hot.updateSettings({ multiColumnSorting: true });

    expect(hot.getPlugin('columnSorting').enabled).toBe(true);
    expect(hot.getPlugin('multiColumnSorting').enabled).toBe(false);
    expect(hot.getSettings().multiColumnSorting).toBe(false);
    expect(conflictWarnings(warnSpy)).toEqual([
      'Plugins `columnSorting` and `multiColumnSorting` should not be enabled simultaneously. ' +
      'Only `columnSorting` will work. The `multiColumnSorting` plugin will remain disabled.',
    ]);
  });
});
