import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Filters } from '..';
import { DropdownMenu } from '../../dropdownMenu';
import { ManualColumnMove } from '../../manualColumnMove';
import { AutoColumnSize } from '../../autoColumnSize';
import { HiddenRows } from '../../hiddenRows';
import { registerCellType, CheckboxCellType, DateCellType, NumericCellType } from '../../../cellTypes';
import { SEPARATOR } from '../../contextMenu/predefinedItems';

describe('Filters#getAvailableConditions', () => {
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
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = undefined;
    container.remove();
  });

  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [['a', 1, '2026-01-02'], ['b', 2, '2026-03-04']],
      columns: [{}, { type: 'numeric' }, { type: 'date' }],
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot.getPlugin('filters');
  }

  const names = list => list.map(({ name }) => name);

  it('lists the conditions of a text column with their argument counts, in menu order', () => {
    const filters = createGrid();

    expect(filters.getAvailableConditions(0)).toEqual([
      { name: 'empty', inputsCount: 0 },
      { name: 'not_empty', inputsCount: 0 },
      { name: 'eq', inputsCount: 1 },
      { name: 'neq', inputsCount: 1 },
      { name: 'begins_with', inputsCount: 1 },
      { name: 'ends_with', inputsCount: 1 },
      { name: 'contains', inputsCount: 1 },
      { name: 'not_contains', inputsCount: 1 },
    ]);
  });

  it('lists the conditions of a numeric column', () => {
    const filters = createGrid();

    expect(names(filters.getAvailableConditions(1))).toEqual([
      'empty', 'not_empty', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'not_between',
    ]);
    expect(filters.getAvailableConditions(1).find(({ name }) => name === 'between').inputsCount).toBe(2);
  });

  it('lists the conditions of a date column', () => {
    const filters = createGrid();

    expect(names(filters.getAvailableConditions(2))).toEqual([
      'empty', 'not_empty', 'eq', 'neq', 'date_before', 'date_before_or_equal', 'date_after',
      'date_after_or_equal', 'between', 'date_tomorrow', 'date_today', 'date_yesterday',
    ]);
  });

  it('takes a visual column index', () => {
    const filters = createGrid({ manualColumnMove: [2, 0, 1] });

    expect(names(filters.getAvailableConditions(0))).toContain('date_today');
    expect(names(filters.getAvailableConditions(2))).toContain('gt');
  });

  it('honors a grid-level allow-list, in its order', () => {
    // The column scan warns about the names a column's list does not offer.
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const filters = createGrid({ filters: { availableConditions: ['contains', SEPARATOR, 'eq', 'gt'] } });

    expect(filters.getAvailableConditions(0)).toEqual([
      { name: 'contains', inputsCount: 1 },
      { name: 'eq', inputsCount: 1 },
    ]);
    expect(names(filters.getAvailableConditions(1))).toEqual(['eq', 'gt']);
  });

  it('honors a grid-level exclude-list', () => {
    const filters = createGrid({ filters: { availableConditions: { exclude: ['empty', 'not_empty', 'between'] } } });

    expect(names(filters.getAvailableConditions(0))).toEqual([
      'eq', 'neq', 'begins_with', 'ends_with', 'contains', 'not_contains',
    ]);
    expect(names(filters.getAvailableConditions(1))).toEqual(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'not_between']);
  });

  it('honors a per-type map', () => {
    const filters = createGrid({ filters: { availableConditions: { numeric: ['gt', 'lt'] } } });

    expect(names(filters.getAvailableConditions(1))).toEqual(['gt', 'lt']);
    expect(names(filters.getAvailableConditions(0))).toContain('begins_with');
  });

  it('lets a column-level setting replace the grid-level one for that column', () => {
    const filters = createGrid({
      columns: [{ filters: { availableConditions: ['eq'] } }, { type: 'numeric' }, { type: 'date' }],
      filters: { availableConditions: { exclude: ['eq'] } },
    });

    expect(names(filters.getAvailableConditions(0))).toEqual(['eq']);
    expect(names(filters.getAvailableConditions(1))).not.toContain('eq');
  });

  it('uses the text list for a column whose cells have different types, as the menu does', () => {
    const filters = createGrid({
      cells: (row, column) => (row === 1 && column === 0 ? { type: 'numeric' } : {}),
    });

    expect(names(filters.getAvailableConditions(0))).toContain('begins_with');
    expect(names(filters.getAvailableConditions(0))).not.toContain('gt');
  });

  it('follows a settings change', () => {
    const filters = createGrid();

    hot.updateSettings({ filters: { availableConditions: ['neq'] } });

    expect(names(filters.getAvailableConditions(0))).toEqual(['neq']);
  });

  it('returns the menu list without separators and the "none" placeholder', () => {
    const filters = createGrid({ filters: { availableConditions: { exclude: ['eq'] } } });

    [0, 1, 2].forEach((column) => {
      const menuNames = filters._getConditionOptions(column)
        .map(({ key, name }) => key ?? name)
        .filter(name => name !== SEPARATOR && name !== 'none');

      expect(names(filters.getAvailableConditions(column))).toEqual(menuNames);
    });
  });

  it('returns new objects on every call', () => {
    const filters = createGrid();
    const first = filters.getAvailableConditions(0);

    first[0].name = 'changed';
    first.pop();

    expect(filters.getAvailableConditions(0)[0].name).toBe('empty');
    expect(filters.getAvailableConditions(0)).toHaveLength(8);
    expect(filters._getConditionOptions(0)[2].key).toBe('empty');
  });
});
