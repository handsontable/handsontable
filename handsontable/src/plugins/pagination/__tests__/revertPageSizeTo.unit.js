import Handsontable from 'handsontable/base';
import { registerPlugin, Pagination } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(Pagination);

/**
 * `revertPageSizeTo(previousPageSize, previousPage)` puts back the page an attempted page size clamped. The clamp
 * fired no `afterPageChange`, so the restore fires none either.
 */
describe('Pagination#revertPageSizeTo', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 50 }, (_, row) => [row + 1]),
      pagination: { pageSize: 10 },
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should put back the page the attempted page size clamped, without firing afterPageChange', () => {
    const pagination = hot.getPlugin('pagination');

    pagination.setPage(4);
    pagination.setPageSize(20);

    expect(pagination.getCurrentPage()).toBe(3);

    const afterPageChange = jest.fn();
    const afterPageSizeChange = jest.fn();

    hot.addHook('afterPageChange', afterPageChange);
    hot.addHook('afterPageSizeChange', afterPageSizeChange);

    pagination.revertPageSizeTo(10, 4);

    expect(pagination.getCurrentPageSize()).toBe(10);
    expect(pagination.getCurrentPage()).toBe(4);
    expect(pagination.getPaginationData().firstVisibleRowIndex).toBe(30);
    expect(afterPageChange).not.toHaveBeenCalled();
    expect(afterPageSizeChange).toHaveBeenCalledTimes(1);
    expect(afterPageSizeChange).toHaveBeenCalledWith(20, 10);
  });

  it('should keep the current page when no page is passed', () => {
    const pagination = hot.getPlugin('pagination');

    pagination.setPage(4);
    pagination.setPageSize(20);
    pagination.revertPageSizeTo(10);

    expect(pagination.getCurrentPageSize()).toBe(10);
    expect(pagination.getCurrentPage()).toBe(3);
  });
});
