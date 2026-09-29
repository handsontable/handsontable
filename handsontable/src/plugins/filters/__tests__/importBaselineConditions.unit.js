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
 * A `filter()` call that a `beforeFilter` listener cancels puts back the conditions of the last
 * pass. `importBaselineConditions()` makes the imported conditions that fallback, and these tests
 * pin the contract in the plugin that owns it, next to the `importConditions()` behavior it differs
 * from.
 */
describe('Filters -> importBaselineConditions', () => {
  const GT_2 = [{ column: 0, operation: 'conjunction', conditions: [{ name: 'gt', args: [2] }] }];
  const LT_2 = [{ column: 0, operation: 'conjunction', conditions: [{ name: 'lt', args: [2] }] }];

  let container;
  let hot;
  let vetoFilter;

  beforeEach(() => {
    vetoFilter = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [[1], [2], [3], [4]],
      filters: true,
      beforeFilter: () => (vetoFilter ? false : undefined),
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('makes the imported conditions the fallback of a canceled filter pass', () => {
    const filters = hot.getPlugin('filters');

    filters.importConditions(LT_2);
    filters.filter();
    filters.importBaselineConditions(GT_2);
    vetoFilter = true;
    filters.addCondition(0, 'eq', [1]);
    filters.filter();

    expect(filters.exportConditions()).toEqual(GT_2);
  });

  it('leaves a plain import falling back to the conditions of the last pass', () => {
    const filters = hot.getPlugin('filters');

    filters.importConditions(LT_2);
    filters.filter();
    filters.importConditions(GT_2);
    vetoFilter = true;
    filters.filter();

    expect(filters.exportConditions()).toEqual(LT_2);
  });

  it('does not filter the rows by itself', () => {
    const filters = hot.getPlugin('filters');

    filters.importBaselineConditions(GT_2);

    expect(filters.exportConditions()).toEqual(GT_2);
    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4]);
  });

  it('reports the baseline as the previous stack to the next beforeFilter', () => {
    const filters = hot.getPlugin('filters');
    const beforeFilter = jest.fn();

    filters.importBaselineConditions(GT_2);
    hot.addHook('beforeFilter', beforeFilter);
    filters.addCondition(0, 'eq', [3]);
    filters.filter();

    expect(beforeFilter.mock.calls[0][1]).toEqual(GT_2);
    expect(hot.getDataAtCol(0)).toEqual([3]);
  });
});
