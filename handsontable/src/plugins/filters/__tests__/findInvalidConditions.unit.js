import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Filters } from '..';
import { DropdownMenu } from '../../dropdownMenu';
import { AutoColumnSize } from '../../autoColumnSize';
import { HiddenRows } from '../../hiddenRows';
import { HiddenColumns } from '../../hiddenColumns';
import { TrimRows } from '../../trimRows';
import { registerCellType, CheckboxCellType } from '../../../cellTypes';

describe('Filters#_findInvalidConditions', () => {
  let container;
  let hot;
  let filters;

  beforeAll(() => {
    registerPlugin(AutoColumnSize);
    registerPlugin(HiddenRows);
    registerPlugin(HiddenColumns);
    registerPlugin(TrimRows);
    registerPlugin(DropdownMenu);
    registerPlugin(Filters);
    registerCellType(CheckboxCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    filters = hot.getPlugin('filters');
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  const entry = (overrides = {}) => ({
    column: 0,
    operation: 'conjunction',
    conditions: [{ name: 'eq', args: ['a'] }],
    ...overrides,
  });

  it('answers null for what exportConditions() returns', () => {
    filters.addCondition(0, 'eq', ['a']);
    filters.addCondition(1, 'by_value', [['b']]);

    expect(filters._findInvalidConditions(filters.exportConditions())).toBeNull();
    expect(filters._findInvalidConditions([])).toBeNull();
  });

  it.each([
    ['not an array', { column: 0 }, ''],
    ['an entry that is not an object', [null], '[0]'],
    ['a column past the grid', [entry({ column: 2 })], '[0].column'],
    ['a negative column', [entry({ column: -1 })], '[0].column'],
    ['an unknown operation', [entry({ operation: 'and' })], '[0].operation'],
    ['conditions that are not an array', [entry({ conditions: 'eq' })], '[0].conditions'],
    ['an unregistered condition', [entry({ conditions: [{ name: 'nope', args: [] }] })], '[0].conditions[0].name'],
    ['arguments that are not an array', [entry({ conditions: [{ name: 'eq', args: 'a' }] })], '[0].conditions[0].args'],
    ['arguments the decorator rejects', [entry({ conditions: [{ name: 'by_value', args: [5] }] })],
      '[0].conditions[0].args'],
    ['one column with two operations', [entry(), entry({ operation: 'disjunction' })], '[1].operation'],
  ])('points at %s', (_, conditions, path) => {
    const problem = filters._findInvalidConditions(conditions);

    expect(problem.path).toBe(path);
    expect(typeof problem.message).toBe('string');
    expect(problem.message.length).toBeGreaterThan(0);
  });

  it('accepts one operation named twice for a column', () => {
    expect(filters._findInvalidConditions([entry(), entry()])).toBeNull();
  });

  it('never touches the current conditions', () => {
    filters.addCondition(0, 'eq', ['a']);
    filters._findInvalidConditions([entry({ conditions: [{ name: 'by_value', args: [5] }] })]);

    expect(filters.exportConditions()).toHaveLength(1);
  });
});
