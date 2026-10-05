import TableView from 'handsontable/tableView';
import { getLastScrollableColumn } from '../getLastScrollableColumn';

/**
 * A grid stub that answers what the helper reads.
 *
 * @param {object} options The grid shape.
 * @param options.totalColumns
 * @param options.fixedColumnsStart
 * @param options.fixedColumnsEnd
 * @param options.hidden
 * @returns {object}
 */
function createHot({ totalColumns = 10, fixedColumnsStart = 0, fixedColumnsEnd = 0, hidden = [] } = {}) {
  const settings = { fixedColumnsStart, fixedColumnsEnd };
  const hot = {
    countCols: () => totalColumns,
    getSettings: () => settings,
    columnIndexMapper: {
      getNearestNotHiddenIndex: (index, direction) => {
        let candidate = index;

        while (candidate >= 0 && candidate < totalColumns) {
          if (!hidden.includes(candidate)) {
            return candidate;
          }

          candidate += direction;
        }

        return null;
      },
    },
  };

  // The real TableView counter, so the stub cannot drift from the band size the renderer uses.
  hot.view = { countFixedColumnsEnd: () => TableView.prototype.countFixedColumnsEnd.call({ settings, hot }) };

  return hot;
}

describe('getLastScrollableColumn', () => {
  it('should return the last column when no column is frozen at the inline end', () => {
    expect(getLastScrollableColumn(createHot())).toBe(9);
  });

  it('should skip the columns frozen at the inline end', () => {
    expect(getLastScrollableColumn(createHot({ fixedColumnsEnd: 3 }))).toBe(6);
  });

  it('should skip the hidden columns that sit right before the end columns', () => {
    expect(getLastScrollableColumn(createHot({ fixedColumnsEnd: 3, hidden: [5, 6] }))).toBe(4);
  });

  it('should keep returning the last column of a grid the start columns cover when no end column is frozen', () => {
    expect(getLastScrollableColumn(createHot({ totalColumns: 3, fixedColumnsStart: 3 }))).toBe(2);
  });

  it('should keep the start columns out of the result', () => {
    expect(getLastScrollableColumn(createHot({ fixedColumnsStart: 2, fixedColumnsEnd: 3 }))).toBe(6);
  });

  it('should return null when the start and end columns leave no column to scroll', () => {
    expect(getLastScrollableColumn(createHot({ totalColumns: 6, fixedColumnsStart: 3, fixedColumnsEnd: 3 })))
      .toBe(null);
    // The end columns asked for outnumber the columns the start columns leave.
    expect(getLastScrollableColumn(createHot({ fixedColumnsStart: 8, fixedColumnsEnd: 5 }))).toBe(null);
    expect(getLastScrollableColumn(createHot({ totalColumns: 4, fixedColumnsEnd: 4 }))).toBe(null);
  });
});
