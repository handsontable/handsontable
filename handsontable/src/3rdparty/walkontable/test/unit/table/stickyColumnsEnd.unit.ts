import stickyColumnsEnd from '../../../src/table/rangeQuery/stickyColumnsEnd';
import Settings from '../../../src/settings';

type Stub = { wtSettings: Settings, [key: string]: unknown };

/**
 * Builds a stub table for the mixin, backed by the REAL `Settings` accessor, so the clamp of the
 * requested end count against `fixedColumnsStart` and `totalColumns` is exercised, not stubbed.
 *
 * @param {object} settings The values the settings answer with.
 * @param {number} [settings.totalColumns=10] The total number of columns.
 * @param {number} [settings.fixedColumnsEnd=0] The REQUESTED number of end columns (not yet clamped).
 * @param {number} [settings.fixedColumnsStart=0] The number of start columns.
 * @returns {object}
 */
function createStub({ totalColumns = 10, fixedColumnsEnd = 0, fixedColumnsStart = 0 } = {}): Stub {
  const stub: Stub = {
    wtSettings: new Settings({
      facade: () => {},
      data: () => '',
      table: {},
      totalRows: () => 5,
      totalColumns: () => totalColumns,
      fixedColumnsStart: () => fixedColumnsStart,
      fixedColumnsEnd: () => fixedColumnsEnd,
    }),
  };

  Object.keys(stickyColumnsEnd).forEach((name) => {
    const member = (stickyColumnsEnd as Record<string, unknown>)[name];

    if (typeof member === 'function') {
      stub[name] = member.bind(stub);
    }
  });

  return stub;
}

describe('stickyColumnsEnd range query', () => {
  it('should cut the rendered band down by the start band, which has priority', () => {
    const table = createStub({ totalColumns: 10, fixedColumnsStart: 8, fixedColumnsEnd: 5 });

    expect(table.getRenderedColumnsCount()).toBe(2);
    expect(table.getFirstRenderedColumn()).toBe(8);
    expect(table.getLastRenderedColumn()).toBe(9);
  });

  it('should render nothing when the start band covers every column', () => {
    const table = createStub({ totalColumns: 10, fixedColumnsStart: 10, fixedColumnsEnd: 3 });

    expect(table.getRenderedColumnsCount()).toBe(0);
    expect(table.getFirstRenderedColumn()).toBe(-1);
    expect(table.getLastRenderedColumn()).toBe(-1);
  });

  it('should render the LAST columns, counted from the end of the grid', () => {
    const table = createStub({ totalColumns: 10, fixedColumnsEnd: 3 });

    expect(table.getRenderedColumnsCount()).toBe(3);
    expect(table.getVisibleColumnsCount()).toBe(3);
    expect(table.getFirstRenderedColumn()).toBe(7);
    expect(table.getFirstVisibleColumn()).toBe(7);
    expect(table.getFirstPartiallyVisibleColumn()).toBe(7);
    expect(table.getLastRenderedColumn()).toBe(9);
    expect(table.getLastVisibleColumn()).toBe(9);
    expect(table.getLastPartiallyVisibleColumn()).toBe(9);
  });

  it('should report that nothing is rendered when there is no end band', () => {
    const table = createStub({ totalColumns: 10, fixedColumnsEnd: 0 });

    expect(table.getRenderedColumnsCount()).toBe(0);
    expect(table.getFirstRenderedColumn()).toBe(-1);
    expect(table.getLastRenderedColumn()).toBe(-1);
  });

  it('should never render more columns than the grid has', () => {
    const table = createStub({ totalColumns: 2, fixedColumnsEnd: 5 });

    expect(table.getRenderedColumnsCount()).toBe(2);
    expect(table.getFirstRenderedColumn()).toBe(0);
    expect(table.getLastRenderedColumn()).toBe(1);
  });

  it('should render no row headers, which belong to the inline-start tables only', () => {
    const table = createStub({ totalColumns: 10, fixedColumnsEnd: 3 });

    expect(table.getRowHeadersCount()).toBe(0);
  });
});
