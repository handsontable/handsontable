import Handsontable from 'handsontable/base';
import { registerPlugin, Pagination } from 'handsontable/plugins';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { Filters } from 'handsontable/plugins/filters';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(Pagination);
registerPlugin(HiddenRows);
registerPlugin(TrimRows);
registerPlugin(ColumnSorting);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(Filters);

/**
 * Builds rows whose first column holds the physical row index, so an expected page can be derived
 * from the source data alone, without asking the index mapper the test is checking.
 *
 * @param {number} length Number of rows.
 * @returns {Array[]}
 */
function createRows(length) {
  return Array.from({ length }, (rowValue, row) => [row, `B${row}`]);
}

/**
 * Cuts the rows a page shows out of the rows the other features leave visible, in visual order.
 *
 * @param {number[]} visibleRows Physical rows left visible by the other features, in visual order.
 * @param {number} page The 1-based page number.
 * @param {number} pageSize Rows per page.
 * @returns {number[]}
 */
function expectedPage(visibleRows, page, pageSize) {
  return visibleRows.slice((page - 1) * pageSize, page * pageSize);
}

describe('Pagination -> hiding map writes', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
  });

  it('should write the hiding map once per page change, not once per hidden row', () => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(1000),
      pagination: {
        pageSize: 50,
      },
    });

    let mapChanges = 0;
    const countChange = () => {
      mapChanges += 1;
    };

    hot.rowIndexMapper.addLocalHook('change', countChange);
    hot.getPlugin('pagination').setPage(3);
    hot.rowIndexMapper.removeLocalHook('change', countChange);

    // One change resets the map to the defaults, one writes the rows off the page. A write per
    // hidden row reports one change for each of the 950 rows off the page.
    expect(mapChanges).toBe(2);
    expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(
      Array.from({ length: 1000 }, (value, row) => row), 3, 50));
  });

  it('should show the rows of each page, including the last partial page', () => {
    const allRows = Array.from({ length: 23 }, (value, row) => row);

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      pagination: {
        pageSize: 5,
      },
    });

    const pagination = hot.getPlugin('pagination');

    for (let page = 1; page <= 5; page += 1) {
      pagination.setPage(page);

      expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(allRows, page, 5));
    }

    expect(pagination.getCurrentPage()).toBe(5);
    expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual([20, 21, 22]);
  });

  it('should hide no row when every row fits on one page', () => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      pagination: {
        pageSize: 50,
      },
    });

    let mapChanges = 0;
    const countChange = () => {
      mapChanges += 1;
    };

    hot.rowIndexMapper.addLocalHook('change', countChange);
    hot.getPlugin('pagination').setPage(1);
    hot.rowIndexMapper.removeLocalHook('change', countChange);

    // Only the reset to the defaults: with no row off the page there is nothing to write.
    expect(mapChanges).toBe(1);
    expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(Array.from({ length: 23 }, (value, row) => row));
  });

  it('should cut a page at whole rows when the page size is fractional', () => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(10),
      pagination: {
        pageSize: 2.5,
      },
    });

    const pagination = hot.getPlugin('pagination');
    const pages = [];

    for (let page = 1; page <= pagination.getPaginationData().totalPages; page += 1) {
      pagination.setPage(page);
      pages.push([...hot.rowIndexMapper.getRenderableIndexes()]);
    }

    // Each page starts at the whole part of its fractional start and spans the whole part of its
    // fractional size. That is the cut the plugin has always made; it leaves rows 4 and 9 on no page.
    expect(pages).toEqual([[0, 1], [2, 3], [5, 6], [7, 8]]);
  });

  it('should page through the rows the HiddenRows plugin leaves visible', () => {
    // Row 7 is hidden on page 2 and row 1 on page 1, so both the current page and the other pages
    // carry rows another hiding map owns.
    const hiddenRows = [1, 7];
    const visibleRows = Array.from({ length: 23 }, (value, row) => row)
      .filter(row => !hiddenRows.includes(row));

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      hiddenRows: {
        rows: hiddenRows,
      },
      pagination: {
        pageSize: 5,
      },
    });

    const pagination = hot.getPlugin('pagination');

    for (let page = 1; page <= 5; page += 1) {
      pagination.setPage(page);

      expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(visibleRows, page, 5));
    }

    // Unhiding a row shifts every later page by one row.
    pagination.setPage(2);
    hot.getPlugin('hiddenRows').showRows([7]);
    hot.render();

    const afterShow = Array.from({ length: 23 }, (value, row) => row).filter(row => row !== 1);

    expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(afterShow, 2, 5));
  });

  it('should page through the rows the TrimRows plugin leaves', () => {
    const trimmedRows = [0, 4, 12];
    const visibleRows = Array.from({ length: 23 }, (value, row) => row)
      .filter(row => !trimmedRows.includes(row));

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      trimRows: trimmedRows,
      pagination: {
        pageSize: 5,
      },
    });

    const pagination = hot.getPlugin('pagination');

    for (let page = 1; page <= 4; page += 1) {
      pagination.setPage(page);

      expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(visibleRows, page, 5));
    }
  });

  it('should page through the rows a filter leaves', () => {
    const visibleRows = Array.from({ length: 23 }, (value, row) => row).filter(row => row % 2 === 0);

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      filters: true,
      pagination: {
        pageSize: 5,
      },
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'by_value', [visibleRows]);
    filters.filter();

    const pagination = hot.getPlugin('pagination');

    for (let page = 1; page <= 3; page += 1) {
      pagination.setPage(page);

      expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(visibleRows, page, 5));
    }
  });

  it('should page through the rows in the sorted order', () => {
    const sortedRows = Array.from({ length: 23 }, (value, row) => 22 - row);

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: createRows(23),
      columnSorting: true,
      pagination: {
        pageSize: 5,
      },
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    const pagination = hot.getPlugin('pagination');

    for (let page = 1; page <= 5; page += 1) {
      pagination.setPage(page);

      expect(hot.rowIndexMapper.getRenderableIndexes()).toEqual(expectedPage(sortedRows, page, 5));
    }
  });
});
