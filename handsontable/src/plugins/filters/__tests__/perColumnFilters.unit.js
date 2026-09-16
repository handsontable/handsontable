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
 * Coverage for DEV-2524, the column half: `columns: [{ filters: false }]` takes one column out of
 * filtering, through the ordinary cascading configuration.
 *
 * The switch is read from the column meta on every menu opening, so these tests move the selection
 * between columns and ask each filter component whether it would render. `isHidden()` is what both
 * the menu item descriptor and `Filters.restoreComponents()` consult, so it is the single answer
 * that decides both.
 */
describe('Filters -> per-column filters switch', () => {
  const COMPONENT_IDS = [
    'filter_by_condition',
    'filter_operators',
    'filter_by_condition2',
    'filter_by_value',
    'filter_action_bar',
  ];

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
        ['Apple', 10, 'Red'],
        ['Banana', 20, 'Green'],
      ],
      colHeaders: ['Fruit', 'Amount', 'Color'],
      dropdownMenu: true,
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  /**
   * Whether each filter component would render for the currently selected column.
   *
   * @param {number} visualColumn The column to select first.
   * @returns {boolean[]} One entry per component, in `COMPONENT_IDS` order.
   */
  function hiddenFlagsForColumn(visualColumn) {
    hot.selectCell(0, visualColumn);

    const filters = hot.getPlugin('filters');

    return COMPONENT_IDS.map(id => filters.components.get(id).isHidden());
  }

  it('should show every filter component on a column that says nothing', () => {
    buildGrid({ columns: [{ filters: false }, {}, {}] });

    expect(hiddenFlagsForColumn(1)).toEqual([false, false, false, false, false]);
  });

  it('should hide every filter component on a column set to false', () => {
    buildGrid({ columns: [{ filters: false }, {}, {}] });

    expect(hiddenFlagsForColumn(0)).toEqual([true, true, true, true, true]);
  });

  it('should keep the switch per column, not per grid', () => {
    buildGrid({ columns: [{}, { filters: false }, {}] });

    expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);
    expect(hiddenFlagsForColumn(1)).toEqual([true, true, true, true, true]);
    expect(hiddenFlagsForColumn(2)).toEqual([false, false, false, false, false]);
  });

  it('should read the function form of columns as well', () => {
    buildGrid({ columns: column => (column === 2 ? { filters: false } : {}) });

    expect(hiddenFlagsForColumn(1)).toEqual([false, false, false, false, false]);
    expect(hiddenFlagsForColumn(2)).toEqual([true, true, true, true, true]);
  });

  it('should follow the switch through updateSettings', () => {
    buildGrid();

    expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);

    hot.updateSettings({ columns: [{ filters: false }, {}, {}] });

    expect(hiddenFlagsForColumn(0)).toEqual([true, true, true, true, true]);

    hot.updateSettings({ columns: [{}, {}, {}] });

    expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);
  });

  it('should ignore the grid-level value inherited by a column', () => {
    // Column meta inherits from the grid meta, so a plain read of `columnMeta.filters` also sees the
    // grid-level setting. On a grid built with `filters: false` whose plugin is switched on by hand,
    // that read reports EVERY column as opted out and blanks the whole filter menu. Whether the
    // plugin runs at all is `BasePlugin`'s question, not the per-column switch's.
    buildGrid({ filters: false });

    hot.getPlugin('filters').enablePlugin();

    expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);
  });

  it('should treat a column with no selection as filterable', () => {
    // `DropdownMenu#open()` is public and enforces no pre-selection, so the components are asked
    // with nothing selected. Hiding them there would blank a menu opened through the API.
    buildGrid({ columns: [{ filters: false }, {}, {}] });

    hot.deselectCell();

    const filters = hot.getPlugin('filters');

    expect(COMPONENT_IDS.map(id => filters.components.get(id).isHidden()))
      .toEqual([false, false, false, false, false]);
  });

  it('should leave the public API working on a column that opted out', () => {
    // The switch turns off the menu UI, the same way `columnSorting`'s `headerAction: false` leaves
    // `sort()` working. A condition added through the API still filters.
    const filters = buildGrid({ columns: [{ filters: false }, {}, {}] }).getPlugin('filters');

    filters.addCondition(0, 'eq', ['Apple']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Apple']);
  });

  describe('a per-column settings object', () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should warn once, and keep the column filterable', () => {
      buildGrid({ columns: [{ filters: { searchMode: 'apply' } }, {}, {}] });

      // An object is not `false`, so the column keeps its filter UI - it is the SUB-OPTIONS that
      // are ignored, which is what the warning is about.
      expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);

      const messages = warnSpy.mock.calls.map(args => args.join(' '))
        .filter(message => message.includes('inside `columns`'));

      expect(messages.length).toBe(1);
      expect(messages[0]).toContain('only `false` has an effect');
    });

    it('should not warn for a plain false', () => {
      buildGrid({ columns: [{ filters: false }, {}, {}] });

      hiddenFlagsForColumn(0);

      const messages = warnSpy.mock.calls.map(args => args.join(' '))
        .filter(message => message.includes('inside `columns`'));

      expect(messages).toEqual([]);
    });
  });
});
