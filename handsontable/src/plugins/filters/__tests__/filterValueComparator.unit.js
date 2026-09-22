import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

/**
 * Coverage for DEV-2579: `filterValueComparator` orders the "Filter by value" list.
 *
 * The list is built in two places of `ValueComponent`: `reset()` on a clean opening, and
 * `updateState()` when a by-value condition already exists. Both go through
 * `getSortComparatorForMeta()`, so both are exercised here through the real component rather
 * than through the helper alone.
 */
describe('Filters -> filterValueComparator', () => {
  const PRIORITY = ['Critical', 'High', 'Medium', 'Low'];
  const SIZE = ['XS', 'S', 'M', 'L', 'XL'];
  const rankBy = order => (a, b) => {
    const rank = value => (order.indexOf(value) === -1 ? order.length : order.indexOf(value));

    return rank(a) - rank(b);
  };

  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a three-column grid with the filters plugin on.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: [
        ['Low', 'M', 100],
        ['High', 'XL', 5],
        ['Critical', 'S', 1000],
        ['Medium', 'XS', 20],
        ['', 'L', 100],
      ],
      colHeaders: ['Priority', 'Size', 'Amount'],
      dropdownMenu: true,
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  /**
   * The value list as `reset()` builds it for a freshly opened column.
   *
   * @param {number} visualColumn The column to select first.
   * @returns {Array} The item values in list order.
   */
  function listAfterReset(visualColumn) {
    hot.selectCell(0, visualColumn);

    const component = hot.getPlugin('filters').components.get('filter_by_value');

    component.reset();

    return component.getMultipleSelectElement().getItems().map(item => item.value);
  }

  /**
   * The value list as `updateState()` rebuilds it once the column carries a by-value condition.
   *
   * @param {number} visualColumn The column to filter and read.
   * @param {Array} selectedValues The values that stay checked.
   * @returns {Array} `{value, checked}` pairs in list order.
   */
  function listAfterCondition(visualColumn, selectedValues) {
    const filters = hot.getPlugin('filters');

    filters.addCondition(visualColumn, 'by_value', [selectedValues]);
    filters.filter();
    hot.selectCell(0, visualColumn);

    const component = filters.components.get('filter_by_value');
    const state = component.state.getValueAtIndex(hot.toPhysicalColumn(visualColumn));

    return state.itemsSnapshot.map(item => ({ value: item.value, checked: item.checked }));
  }

  it('should keep the default order when the option is absent', () => {
    buildGrid();

    expect(listAfterReset(0)).toEqual(['', 'Critical', 'High', 'Low', 'Medium']);
  });

  it('should order a column by its own comparator on a clean opening', () => {
    buildGrid({ columns: [{ filterValueComparator: rankBy(PRIORITY) }, {}, {}] });

    expect(listAfterReset(0)).toEqual(['Critical', 'High', 'Medium', 'Low', '']);
  });

  it('should leave the other columns on the default order', () => {
    buildGrid({ columns: [{ filterValueComparator: rankBy(PRIORITY) }, {}, {}] });

    expect(listAfterReset(1)).toEqual(['L', 'M', 'S', 'XL', 'XS']);
    expect(listAfterReset(2)).toEqual([5, 20, 100, 1000]);
  });

  it('should apply a grid-level comparator to every column', () => {
    const reversed = (a, b) => String(b).localeCompare(String(a));

    buildGrid({ filterValueComparator: reversed });

    expect(listAfterReset(0)).toEqual(['Medium', 'Low', 'High', 'Critical', '']);
    expect(listAfterReset(1)).toEqual(['XS', 'XL', 'S', 'M', 'L']);
  });

  it('should let a column override the grid-level comparator', () => {
    const reversed = (a, b) => String(b).localeCompare(String(a));

    buildGrid({
      filterValueComparator: reversed,
      columns: [{}, { filterValueComparator: rankBy(SIZE) }, {}],
    });

    expect(listAfterReset(0)).toEqual(['Medium', 'Low', 'High', 'Critical', '']);
    expect(listAfterReset(1)).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  it('should keep the order after a by-value condition is applied', () => {
    buildGrid({ columns: [{ filterValueComparator: rankBy(PRIORITY) }, {}, {}] });

    expect(listAfterCondition(0, ['Critical', 'High', 'Medium', ''])).toEqual([
      { value: 'Critical', checked: true },
      { value: 'High', checked: true },
      { value: 'Medium', checked: true },
      { value: 'Low', checked: false },
      { value: '', checked: true },
    ]);
  });

  it('should not change which rows the filter keeps', () => {
    buildGrid();
    hot.getPlugin('filters').addCondition(0, 'by_value', [['Critical', 'High']]);
    hot.getPlugin('filters').filter();

    const defaultRows = hot.getData().map(row => row.join('|'));

    hot.destroy();
    buildGrid({ columns: [{ filterValueComparator: rankBy(PRIORITY) }, {}, {}] });
    hot.getPlugin('filters').addCondition(0, 'by_value', [['Critical', 'High']]);
    hot.getPlugin('filters').filter();

    expect(hot.getData().map(row => row.join('|'))).toEqual(defaultRows);
    expect(hot.countRows()).toBe(2);
  });

  it('should ignore a value that is not a function', () => {
    buildGrid({ columns: [{ filterValueComparator: PRIORITY }, {}, {}] });

    expect(listAfterReset(0)).toEqual(['', 'Critical', 'High', 'Low', 'Medium']);
  });

  it('should follow the option through updateSettings', () => {
    buildGrid();
    hot.updateSettings({ columns: [{ filterValueComparator: rankBy(PRIORITY) }, {}, {}] });

    expect(listAfterReset(0)).toEqual(['Critical', 'High', 'Medium', 'Low', '']);
  });
});
