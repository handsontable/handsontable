import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Filters } from '..';
import { DropdownMenu } from '../../dropdownMenu';
import { ManualColumnMove } from '../../manualColumnMove';
import { AutoColumnSize } from '../../autoColumnSize';
import { HiddenRows } from '../../hiddenRows';
import {
  registerCellType,
  CheckboxCellType,
  DateCellType,
  IntlDateCellType,
  NumericCellType,
} from '../../../cellTypes';

describe('Filters value list on a grid with no rows', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(AutoColumnSize);
    registerPlugin(HiddenRows);
    registerPlugin(DropdownMenu);
    registerPlugin(ManualColumnMove);
    registerPlugin(Filters);
    registerCellType(CheckboxCellType);
    registerCellType(NumericCellType);
    registerCellType(DateCellType);
    registerCellType(IntlDateCellType);
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

  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [['a'], ['b']],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot.getPlugin('filters');
  }

  it('should list no values for a grid created with `data: []`', () => {
    const filters = createGrid({ data: [], columns: [{}] });

    expect(filters._getValueListDataAtColumn(0)).toEqual([]);
  });

  it('should list no values after every row is removed', () => {
    const filters = createGrid();

    hot.alter('remove_row', 0, 2);

    expect(hot.countRows()).toBe(0);
    expect(filters._getValueListDataAtColumn(0)).toEqual([]);
  });

  it('should list no values when a filter on another column hides every row', () => {
    const filters = createGrid({ data: [['a', 'x'], ['b', 'y']] });

    filters.addCondition(1, 'eq', ['z']);
    filters.filter();

    expect(hot.countRows()).toBe(0);
    expect(hot.countSourceRows()).toBe(2);
    expect(filters._getValueListDataAtColumn(0)).toEqual([]);
  });

  it('should still list the values of a grid that has rows', () => {
    const filters = createGrid();

    expect(filters._getValueListDataAtColumn(0).map(({ value }) => value)).toEqual(['a', 'b']);
  });

  it('should keep returning `[null]` from `getDataAtCol()` on a grid with no rows', () => {
    createGrid({ data: [], columns: [{}] });

    expect(hot.getDataAtCol(0)).toEqual([null]);
  });
});
