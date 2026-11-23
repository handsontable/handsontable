import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';
import { registerCellType } from '../../../cellTypes/registry';
import { NumericCellType } from '../../../cellTypes/numericType';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A header sort is a click, so it completes on release over the header that was pressed. A release anywhere
 * else cancels it: over another header, over a body cell, or outside the grid.
 *
 * Column B holds `(row * 5) % 7`, so sorting it ascending orders the records p0, p3, p2, p5, p1, p4.
 */
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('%s header sort pointer cancellation', (pluginKey, PluginClass) => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(PluginClass);
    registerCellType(NumericCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7]),
      colHeaders: true,
      [pluginKey]: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Presses a column header label the way a mouse does.
   *
   * @param {number} column The visual column.
   * @param {object} [eventProps] Properties of the mouse event, such as `ctrlKey`.
   */
  function pressHeader(column, eventProps = {}) {
    const label = document.createElement('span');
    const event = new MouseEvent('mousedown', { button: 0, ...eventProps });
    const coords = { row: -1, col: column };

    label.className = 'colHeader';
    label.dispatchEvent(event);

    hot.runHooks('beforeOnCellMouseDown', event, coords, null, { row: false, column: false, cell: false });
    hot.selectColumns(column);
    hot.runHooks('afterOnCellMouseDown', event, coords, null);
  }

  /**
   * Releases the mouse over the cell at the coordinates, through the hook Walkontable raises from `mouseup`
   * and from `touchend`.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  function releaseOverCell(row, column) {
    hot.runHooks('afterOnCellMouseUp', new MouseEvent('mouseup'), { row, col: column }, null);
  }

  /**
   * Releases the mouse on the element, as a raw DOM `mouseup` that reaches the document.
   *
   * @param {Element} element The element the release lands on.
   */
  function releaseOverElement(element) {
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }));
  }

  /**
   * Waits until every queued microtask has run.
   */
  async function flush() {
    await Promise.resolve();
  }

  /**
   * @returns {Array} The sort configuration of the plugin.
   */
  function sortConfig() {
    return hot.getPlugin(pluginKey).getSortConfig();
  }

  it('should sort when the release lands over the pressed header', async() => {
    pressHeader(1);
    releaseOverCell(-1, 1);
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p3', 'p2', 'p5', 'p1', 'p4']);
  });

  it('should not sort on the press alone', async() => {
    pressHeader(1);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should not sort when the release lands over another header', async() => {
    pressHeader(1);
    releaseOverCell(-1, 0);
    await flush();

    expect(sortConfig()).toEqual([]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('should not sort when the release lands over another header row of the same column', async() => {
    pressHeader(1);
    releaseOverCell(-2, 1);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should not sort when the release lands over a body cell', async() => {
    pressHeader(1);
    releaseOverCell(2, 1);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should drop the press that the release over another header cancelled', async() => {
    pressHeader(1);
    releaseOverCell(-1, 0);
    releaseOverCell(-1, 1);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should not sort when a raw release lands outside any header', async() => {
    pressHeader(1);
    releaseOverElement(document.body);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should not sort when a raw release lands over a body cell', async() => {
    const cell = document.createElement('td');

    container.appendChild(cell);
    pressHeader(1);
    releaseOverElement(cell);
    releaseOverCell(2, 1);
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should not sort when a raw release lands over another header', async() => {
    pressHeader(1);
    releaseOverElement(hot.getCell(-1, 0));
    await flush();

    expect(sortConfig()).toEqual([]);
  });

  it('should sort when a raw release lands over the pressed header', async() => {
    pressHeader(1);
    releaseOverElement(hot.getCell(-1, 1));
    releaseOverCell(-1, 1);
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should sort when the release lands on the label inside the pressed header', async() => {
    pressHeader(1);
    releaseOverElement(hot.getCell(-1, 1).querySelector('.colHeader'));
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should sort on a touch tap, which releases over the pressed coordinates without a DOM `mouseup`', async() => {
    pressHeader(1);
    releaseOverCell(-1, 1);
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  /**
   * Presses the label of the rendered header, so the press event targets a real element.
   *
   * @param {number} column The visual column.
   * @returns {HTMLElement} The header cell the press landed on.
   */
  function pressRenderedHeader(column) {
    const header = hot.getCell(-1, column);
    const event = new MouseEvent('mousedown', { button: 0, bubbles: true });
    const coords = { row: -1, col: column };

    header.querySelector('.colHeader').dispatchEvent(event);

    hot.runHooks('beforeOnCellMouseDown', event, coords, null, { row: false, column: false, cell: false });
    hot.selectColumns(column);
    hot.runHooks('afterOnCellMouseDown', event, coords, null);

    return header;
  }

  it('should sort when the release lands on a recycled header element at the pressed coordinates', async() => {
    const pressed = pressRenderedHeader(1);
    const replacement = pressed.cloneNode(true);

    pressed.replaceWith(replacement);
    releaseOverElement(replacement.querySelector('.colHeader'));
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should not sort when the release lands on the pressed header element now standing at another column', async() => {
    const pressed = pressRenderedHeader(1);
    const first = hot.getCell(-1, 0);

    // The element that was pressed is recycled into the first column's place.
    first.before(pressed);
    releaseOverElement(pressed.querySelector('.colHeader'));
    await flush();

    expect(hot.getCoords(pressed).col).toBe(0);
    expect(sortConfig()).toEqual([]);
  });

  it('should sort a later press after a cancelled one', async() => {
    pressHeader(1);
    releaseOverCell(2, 1);
    pressHeader(1);
    releaseOverCell(-1, 1);
    await flush();

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should sort on a keyboard activation, which has no pointer release', () => {
    hot.selectColumns(1);

    const shortcut = hot.getShortcutManager().getContext('grid')
      .getShortcuts(['Enter'])
      .find(candidate => ['columnSorting', 'multiColumnSorting'].includes(candidate.group));

    expect(shortcut).toBeDefined();
    shortcut.callback(new KeyboardEvent('keydown'));

    expect(sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });
});
