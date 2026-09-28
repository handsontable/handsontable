import Handsontable from 'handsontable/base';
import { registerPlugin, Pagination } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(Pagination);

describe('Pagination -> Core.clear()', () => {
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

  it('should empty the rows of every page, not only the rows of the current page', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 20 }, (rowValue, row) => [`A${row + 1}`, `B${row + 1}`]),
      pagination: {
        pageSize: 5,
      },
    });

    hot.clear();

    expect(hot.getData()).toEqual(Array.from({ length: 20 }, () => [null, null]));
  });

  it('should empty the rows of every page when the current page is not the first one', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 20 }, (rowValue, row) => [`A${row + 1}`, `B${row + 1}`]),
      pagination: {
        pageSize: 5,
        initialPage: 3,
      },
    });

    // Guards the premise of this test: without it the assertion below would pass even if
    // `initialPage` were ignored and the grid sat on page 1.
    expect(hot.getPlugin('pagination').getCurrentPage()).toBe(3);

    hot.clear();

    expect(hot.getData()).toEqual(Array.from({ length: 20 }, () => [null, null]));
  });

  it('should keep read-only cells intact while emptying the other pages', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 20 }, (rowValue, row) => [`A${row + 1}`, `B${row + 1}`]),
      pagination: {
        pageSize: 5,
      },
      cells(row, col) {
        if (row === 12 && col === 0) {
          return { readOnly: true };
        }
      },
    });

    hot.clear();

    // Row 12 sits on the third page, so it is only reachable once `clear()` stops being
    // scoped to the current page.
    expect(hot.getDataAtCell(12, 0)).toBe('A13');
    expect(hot.getDataAtCell(12, 1)).toBeNull();
  });
});
