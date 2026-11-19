import { adjustColumnHeaderHeights } from '../../../src/axisSizing/oversizedRows';
import type { default as Table } from '../../../src/table/baseTable';

const DEFAULT_ROW_HEIGHT = 29;

/**
 * Builds the part of a table `adjustColumnHeaderHeights` reads: a THEAD with one header row per level,
 * the provided height of each level, and the default row height.
 *
 * @param {number[]} heights The provided header height of each level.
 * @returns {object} The table and its THEAD.
 */
function createTable(heights: number[]) {
  const THEAD = document.createElement('thead');

  heights.forEach(() => {
    const row = document.createElement('tr');

    row.appendChild(document.createElement('th'));
    row.appendChild(document.createElement('th'));
    THEAD.appendChild(row);
  });

  const table = {
    THEAD,
    getColumnHeaderHeight: (level: number) => heights[level],
    wtSettings: {
      getSetting: (name: string) => {
        if (name === 'stylesHandler') {
          return { getDefaultRowHeight: () => DEFAULT_ROW_HEIGHT };
        }

        return heights.map(() => () => {});
      },
    },
  };

  return { table: table as unknown as Table, THEAD, heights };
}

/**
 * Returns the inline height of the first cell of each header row.
 *
 * @param {HTMLTableSectionElement} THEAD The table head.
 * @returns {string[]}
 */
function firstCellHeights(THEAD: HTMLTableSectionElement) {
  return Array.from(THEAD.rows).map(row => row.cells[0].style.height);
}

describe('adjustColumnHeaderHeights', () => {
  it('writes a height taller than the default on the first cell of the level', () => {
    const { table, THEAD } = createTable([70, DEFAULT_ROW_HEIGHT]);

    adjustColumnHeaderHeights(table);

    expect(firstCellHeights(THEAD)).toEqual(['70px', '']);
  });

  it('drops the height an earlier draw wrote once the level is back at the default height', () => {
    const { table, THEAD, heights } = createTable([70, 70]);

    adjustColumnHeaderHeights(table);
    heights[0] = DEFAULT_ROW_HEIGHT;
    heights[1] = DEFAULT_ROW_HEIGHT - 1;
    adjustColumnHeaderHeights(table);

    expect(firstCellHeights(THEAD)).toEqual(['', '']);
  });

  it('leaves the other cells of the level alone', () => {
    const { table, THEAD, heights } = createTable([70]);

    THEAD.rows[0].cells[1].style.height = '40px';
    adjustColumnHeaderHeights(table);
    heights[0] = DEFAULT_ROW_HEIGHT;
    adjustColumnHeaderHeights(table);

    expect(THEAD.rows[0].cells[1].style.height).toBe('40px');
  });

  it('goes on to the next level when a level at the default height has no rendered row', () => {
    const { table, THEAD } = createTable([DEFAULT_ROW_HEIGHT, 70]);

    THEAD.rows[0].replaceChildren();
    adjustColumnHeaderHeights(table);

    expect(THEAD.rows[1].cells[0].style.height).toBe('70px');
  });

  it('drops a later level\'s stale height when a raised level has no rendered row', () => {
    const { table, THEAD, heights } = createTable([70, 70]);

    adjustColumnHeaderHeights(table);
    THEAD.rows[0].replaceChildren();
    heights[1] = DEFAULT_ROW_HEIGHT;
    adjustColumnHeaderHeights(table);

    expect(THEAD.rows[1].cells[0].style.height).toBe('');
  });
});
