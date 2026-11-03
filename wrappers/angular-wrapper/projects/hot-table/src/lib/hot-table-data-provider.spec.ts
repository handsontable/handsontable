import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, ColumnSorting, DataProvider, Pagination } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

registerPlugin(DataProvider);
registerPlugin(Pagination);
registerPlugin(ColumnSorting);

/**
 * Resolves once `condition` holds, polling every 5 ms, and rejects after 2 s.
 */
function waitFor(condition: () => boolean): Promise<void> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - start > 2000) {
        reject(new Error('The condition was not met in time.'));
      } else {
        setTimeout(check, 5);
      }
    };

    check();
  });
}

/**
 * Builds a complete DataProvider configuration over `count` products, answering the page and page size it is
 * asked for.
 */
function createDataProvider(count: number) {
  const rows = Array.from({ length: count }, (_, index) => ({ id: index + 1, product: `Product ${index + 1}` }));

  return {
    rowId: 'id',
    fetchRows: jest.fn(async({ page, pageSize }: { page: number, pageSize: number }) => ({
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      totalRows: rows.length,
    })),
    onRowsCreate: async() => {},
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  };
}

/**
 * A new `settings` object reaches `ngOnChanges` with every key. The wrapper passes only the keys whose value
 * differs from the grid's, so a change of an unrelated setting keeps the rows, the page, and the sort of a
 * server-backed grid, and sends no request.
 */
describe('HotTableComponent with a data provider', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /**
   * Renders the component with the given settings.
   */
  function render(settings: GridSettings) {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { licenseKey: TEST_LICENSE_KEY, ...settings };
    fixture.detectChanges();

    return fixture.componentInstance;
  }

  it('should keep the rows and not refetch when a new settings object passes the same data provider', async() => {
    const dataProvider = createDataProvider(2);
    const settings: GridSettings = {
      dataProvider,
      columns: [{ data: 'id' }, { data: 'product' }],
      height: 200,
    };
    const component = render(settings);
    const hot = component.hotInstance;

    await waitFor(() => hot.countRows() === 2);

    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings, height: 300 }, false),
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(hot.getSettings().height).toBe(300);
    expect(hot.getData()).toEqual([[1, 'Product 1'], [2, 'Product 2']]);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should keep the page and the pager total when a new settings object passes the same data provider ' +
    'and pagination', async() => {
    const dataProvider = createDataProvider(5);
    const settings: GridSettings = {
      dataProvider,
      columns: [{ data: 'id' }, { data: 'product' }],
      pagination: { pageSize: 2 },
    };
    const component = render(settings);
    const hot = component.hotInstance;

    await waitFor(() => hot.countRows() === 2);

    hot.getPlugin('pagination').setPage(2);
    await waitFor(() => hot.getDataAtCell(0, 0) === 3);

    const fetches = dataProvider.fetchRows.mock.calls.length;

    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings, height: 300 }, false),
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(hot.getDataAtCell(0, 0)).toBe(3);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(fetches);
    expect(hot.getPlugin('pagination').getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 2,
      totalPages: 3,
    }));
  });

  it('should keep the server sort when a new settings object passes equal sorting settings', async() => {
    const dataProvider = createDataProvider(4);
    const settings: GridSettings = {
      dataProvider,
      columns: [{ data: 'id' }, { data: 'product' }],
      columnSorting: { indicator: true },
    };
    const component = render(settings);
    const hot = component.hotInstance;

    await waitFor(() => hot.countRows() === 4);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    await waitFor(() => dataProvider.fetchRows.mock.calls.length === 2);

    component.ngOnChanges({
      settings: new SimpleChange(settings, {
        ...settings,
        columns: [{ data: 'id' }, { data: 'product' }],
        columnSorting: { indicator: true },
        height: 300,
      }, false),
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    expect(dataProvider.fetchRows).toHaveBeenCalledTimes(2);
  });

  it('should refetch when a new settings object changes the page size', async() => {
    const dataProvider = createDataProvider(5);
    const settings: GridSettings = {
      dataProvider,
      columns: [{ data: 'id' }, { data: 'product' }],
      pagination: { pageSize: 2 },
    };
    const component = render(settings);
    const hot = component.hotInstance;

    await waitFor(() => hot.countRows() === 2);

    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings, pagination: { pageSize: 3 } }, false),
    });
    await waitFor(() => hot.countRows() === 3);

    expect(dataProvider.fetchRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 3 }),
      expect.anything()
    );
  });
});
