import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Filters } from '..';
import { DropdownMenu } from '../../dropdownMenu';
import { HiddenRows } from '../../hiddenRows';
import { AutoColumnSize } from '../../autoColumnSize';
import { CONDITION_CHECKED, CONDITION_UNCHECKED } from '../constants';
import { registerCellType, CheckboxCellType } from '../../../cellTypes';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('Filters "checked" and "unchecked" conditions', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(AutoColumnSize);
    registerPlugin(HiddenRows);
    registerPlugin(DropdownMenu);
    registerPlugin(Filters);
    registerCellType(CheckboxCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = undefined;
    container.remove();
  });

  function filterColumn(settings, conditionName) {
    hot = new Handsontable(container, {
      filters: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, conditionName, []);
    filters.filter();

    return hot.getDataAtCol(1);
  }

  it('exports the condition names', () => {
    expect(CONDITION_CHECKED).toBe('checked');
    expect(CONDITION_UNCHECKED).toBe('unchecked');
  });

  it('keeps the rows whose checkbox is checked or unchecked, with the default templates', () => {
    const settings = {
      data: [[true, 'a'], [false, 'b'], [null, 'c'], ['TRUE', 'd'], ['maybe', 'e']],
      columns: [{ type: 'checkbox' }, {}],
    };

    expect(filterColumn(settings, 'checked')).toEqual(['a', 'd']);

    hot.destroy();

    expect(filterColumn(settings, 'unchecked')).toEqual(['b']);
  });

  it('reads the templates a column declares', () => {
    const settings = {
      data: [['yes', 'a'], ['no', 'b'], [true, 'c'], [false, 'd'], ['', 'e']],
      columns: [{ type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' }, {}],
    };

    expect(filterColumn(settings, 'checked')).toEqual(['a']);

    hot.destroy();

    expect(filterColumn(settings, 'unchecked')).toEqual(['b']);
  });

  // A row the grid never rendered is covered by tests/e2e/filters-checkbox-conditions.spec.ts: jsdom renders
  // every row, so a unit test here passes with or without the per-cell read.
  it('reads the templates a `cells()` function sets on rows another column\'s filter hides', () => {
    const settings = {
      data: [['Y', 'keep'], ['Y', 'drop'], ['N', 'keep'], ['Y', 'keep']],
      columns: [{ type: 'checkbox' }, {}],
      cells: (row, column) => (column === 0 ? { checkedTemplate: 'Y', uncheckedTemplate: 'N' } : {}),
    };

    hot = new Handsontable(container, { filters: true, licenseKey: TEST_LICENSE_KEY, ...settings });

    const filters = hot.getPlugin('filters');

    filters.addCondition(1, 'eq', ['drop']);
    filters.filter();
    filters.removeConditions(1);
    filters.addCondition(0, 'checked', []);
    filters.filter();

    expect(hot.getDataAtCol(1)).toEqual(['keep', 'drop', 'keep']);
  });
});
