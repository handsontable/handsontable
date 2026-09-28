import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType, NumericCellType, TextCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';

registerCellType(CheckboxCellType);
registerCellType(NumericCellType);
registerCellType(TextCellType);
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

    // `isHiddenInMenu()`, not `isHidden()`: the per-column switch decides whether a component
    // RENDERS in the menu, and deliberately does not make the component look hidden to
    // `restoreComponents()`, which would stop it restoring its own state.
    return COMPONENT_IDS.map(id => filters.components.get(id).isHiddenInMenu());
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

    /**
     * The per-column warnings printed so far.
     *
     * @returns {string[]} One entry per matching warning.
     */
    function perColumnWarnings() {
      return warnSpy.mock.calls.map(args => args.join(' '))
        .filter(message => message.includes('inside `columns`'));
    }

    it('should warn once, and keep the column filterable', () => {
      buildGrid({ columns: [{ filters: { searchMode: 'apply' } }, {}, {}] });

      // An object is not `false`, so the column keeps its filter UI - it is the SUB-OPTIONS that
      // are ignored, which is what the warning is about.
      expect(hiddenFlagsForColumn(0)).toEqual([false, false, false, false, false]);

      const messages = perColumnWarnings();

      expect(messages.length).toBe(1);
      expect(messages[0]).toContain('Only `false` and the `availableConditions` setting are read there');
    });

    it('should warn without the dropdown menu, and without opening one', () => {
      // The warning used to be raised from the components' visibility check, so it only appeared
      // when that column's menu was opened - and never at all on a grid with no menu, while the
      // documentation promises it is logged once per grid.
      buildGrid({
        dropdownMenu: false,
        columns: [{}, {}, { filters: { searchMode: 'apply' } }],
      });

      expect(perColumnWarnings().length).toBe(1);
    });

    it('should warn when the object arrives through updateSettings', () => {
      buildGrid();

      expect(perColumnWarnings()).toEqual([]);

      hot.updateSettings({ columns: [{ filters: { searchMode: 'apply' } }, {}, {}] });

      expect(perColumnWarnings().length).toBe(1);
    });

    it('should not warn for a plain false', () => {
      buildGrid({ columns: [{ filters: false }, {}, {}] });

      hiddenFlagsForColumn(0);

      expect(perColumnWarnings()).toEqual([]);
    });
  });

  describe('the availableConditions setting', () => {
    const SEPARATOR = '---------';
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    /**
     * Builds a text, numeric, text grid.
     *
     * @param {object} [filters] The grid-level `filters` value.
     * @param {Array|Function} [columns] Per-column settings merged over each column's type.
     * @returns {object} The Handsontable instance.
     */
    function buildTypedGrid(filters = true, columns = [{}, {}, {}]) {
      const types = [{ type: 'text' }, { type: 'numeric' }, { type: 'text' }];

      return buildGrid({
        filters,
        columns: typeof columns === 'function' ?
          column => ({ ...types[column], ...columns(column) }) :
          columns.map((column, index) => ({ ...types[index], ...column })),
      });
    }

    /**
     * The condition keys a condition select receives when the menu opens on a column.
     *
     * @param {number} visualColumn The column to select.
     * @param {string} [componentId] The condition component to read.
     * @returns {string[]} Condition keys, with separators as `'---------'`.
     */
    function conditionKeysForColumn(visualColumn, componentId = 'filter_by_condition') {
      const component = hot.getPlugin('filters').components.get(componentId);
      const setItems = jest.spyOn(component.getSelectElement(), 'setItems');

      hot.selectCell(0, visualColumn);
      component.reset();

      const items = setItems.mock.calls.at(-1)[0];

      setItems.mockRestore();

      return items.map(item => (item.name === SEPARATOR ? SEPARATOR : item.key));
    }

    /**
     * The warnings printed so far that contain the given text.
     *
     * @param {string} text The text to look for.
     * @returns {string[]}
     */
    function warningsWith(text) {
      return warnSpy.mock.calls.map(args => args.join(' ')).filter(message => message.includes(text));
    }

    it('should apply a grid-level per-type rule to the columns of that type only', () => {
      buildTypedGrid({ availableConditions: { numeric: { exclude: ['not_between'] } } });

      expect(conditionKeysForColumn(1)).not.toContain('not_between');
      expect(conditionKeysForColumn(1)).toContain('between');
      expect(conditionKeysForColumn(0)).toContain('contains');
    });

    it('should let a column rule replace the grid-level one for that column only', () => {
      buildTypedGrid(
        { availableConditions: { text: ['eq'] } },
        [{ filters: { availableConditions: ['contains', SEPARATOR, 'empty'] } }, {}, {}],
      );

      expect(conditionKeysForColumn(0)).toEqual(['none', SEPARATOR, 'contains', SEPARATOR, 'empty']);
      expect(conditionKeysForColumn(2)).toEqual(['none', SEPARATOR, 'eq']);
    });

    it('should give both condition selects the same list', () => {
      buildTypedGrid(true, [{}, { filters: { availableConditions: ['gt', 'lt'] } }, {}]);

      expect(conditionKeysForColumn(1, 'filter_by_condition')).toEqual(['none', SEPARATOR, 'gt', 'lt']);
      expect(conditionKeysForColumn(1, 'filter_by_condition2')).toEqual(['none', SEPARATOR, 'gt', 'lt']);
    });

    it('should read the function form of columns as well', () => {
      buildTypedGrid(true, column => (column === 1 ? { filters: { availableConditions: ['gte'] } } : {}));

      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'gte']);
    });

    it('should follow a column rule changed through updateSettings', () => {
      buildTypedGrid();

      expect(conditionKeysForColumn(1)).toContain('not_between');

      hot.updateSettings({
        columns: [{ type: 'text' }, { type: 'numeric', filters: { availableConditions: ['gt'] } }, {}],
      });

      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'gt']);
    });

    it('should not warn for a column object that holds only availableConditions', () => {
      buildTypedGrid(true, [{}, { filters: { availableConditions: ['gt'] } }, {}]);

      expect(warningsWith('inside `columns`')).toEqual([]);
    });

    it('should still warn for the grid-only settings next to availableConditions', () => {
      buildTypedGrid(true, [{}, { filters: { availableConditions: ['gt'], filterFixedRows: false } }, {}]);

      expect(warningsWith('inside `columns`').length).toBe(1);
      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'gt']);
    });

    it('should fall back to the grid-level rule, and warn once, for an invalid column value', () => {
      buildTypedGrid(
        { availableConditions: { numeric: ['lt'] } },
        [{}, { filters: { availableConditions: 'gt' } }, {}],
      );

      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'lt']);

      hot.updateSettings({ columns: [{}, { filters: { availableConditions: 'gt' } }, {}] });

      expect(warningsWith('`filters.availableConditions` option set inside `columns` is not valid').length).toBe(1);
    });

    it('should ignore an invalid grid-level value, with the plugin warning', () => {
      buildTypedGrid({ availableConditions: { numeric: 'gt' } });

      expect(conditionKeysForColumn(1)).toContain('not_between');
      expect(warningsWith('"availableConditions" option is not valid').length).toBe(1);
    });

    it('should leave out, and warn once about, a name the column type does not offer', () => {
      buildTypedGrid(true, [{}, { filters: { availableConditions: ['gt', 'contains'] } }, {}]);

      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'gt']);
      expect(conditionKeysForColumn(1)).toEqual(['none', SEPARATOR, 'gt']);
      expect(warningsWith('"contains" condition is not available for the "numeric" data type').length).toBe(1);
    });

    it('should keep filtering by a condition the list no longer offers', () => {
      // The list decides what the menu offers, not what a column may be filtered by: a condition
      // added through the API still applies.
      const filters = buildTypedGrid({ availableConditions: { numeric: { exclude: ['gt'] } } }).getPlugin('filters');

      filters.addCondition(1, 'gt', [15]);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual([20]);
      expect(conditionKeysForColumn(1)).not.toContain('gt');
    });
  });

  describe('hiding a menu item versus hiding the component', () => {
    it('should keep a menu-hidden component restorable', () => {
      // `restoreComponents()` skips components that report `isHidden()`, so the two questions must
      // stay apart. Folding the menu predicate into `isHidden()` stops the by-value component being
      // restored on every menu opening - and with a data provider, which hides that component
      // permanently, it would never be reset again and `saveState()` would store whatever the stale
      // component returned.
      const filters = buildGrid().getPlugin('filters');
      const valueComponent = filters.components.get('filter_by_value');

      // `hasExternalDataSource` is what the DataProvider plugin answers; the value list is hidden
      // whenever it is true, because filtering then happens server-side.
      hot.addHook('hasExternalDataSource', () => true);
      hot.updateSettings({ filters: true });

      const refreshedComponent = hot.getPlugin('filters').components.get('filter_by_value');

      expect(refreshedComponent.isHiddenInMenu()).toBe(true);
      expect(refreshedComponent.isHidden()).toBe(false);
      expect(valueComponent).toBeDefined();
    });

    it('should report a component hidden once hide() was called', () => {
      const filters = buildGrid().getPlugin('filters');
      const valueComponent = filters.components.get('filter_by_value');

      valueComponent.hide();

      expect(valueComponent.isHidden()).toBe(true);
      expect(valueComponent.isHiddenInMenu()).toBe(true);

      valueComponent.show();

      expect(valueComponent.isHidden()).toBe(false);
      expect(valueComponent.isHiddenInMenu()).toBe(false);
    });
  });

  describe('a column that carries a condition while its UI is off', () => {
    it('should keep filtering, and leave the condition reachable through the API', () => {
      // A condition added through the API on an opted-out column still filters, and its menu cannot
      // show it - a documented limit. What matters is that the user is not stuck: `clearConditions()`
      // reaches that column, so `Alt+A` (which clears EVERY column) is not the only way out.
      const filters = buildGrid({ columns: [{}, {}, { filters: false }] }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      expect(hot.getDataAtCol(2)).toEqual(['Red']);
      expect(hiddenFlagsForColumn(2)).toEqual([true, true, true, true, true]);
      expect(filters.exportConditions().length).toBe(1);

      filters.clearConditions(2);
      filters.filter();

      expect(hot.getDataAtCol(2)).toEqual(['Red', 'Green']);
    });

    it('should drop the condition when updateSettings restates columns', () => {
      // Turning a column off through `updateSettings({ columns })` clears every condition, because
      // restating `columns` re-initializes the column index maps the conditions live in. That is
      // pre-existing Core behavior, not something the per-column switch introduces - pinned here so
      // a future change to it is a deliberate decision rather than a surprise.
      const filters = buildGrid().getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(filters.exportConditions().length).toBe(1);

      hot.updateSettings({ columns: [{}, {}, { filters: false }] });

      expect(filters.exportConditions()).toEqual([]);
      expect(hot.getDataAtCol(2)).toEqual(['Red', 'Green']);
    });
  });
});
