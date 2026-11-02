import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, DataProvider, Pagination } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(DataProvider);
registerPlugin(Pagination);

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
 * The Angular wrapper sends every key of the `settings` input to `updateSettings()` whenever the input
 * changes, so an unchanged `dataProvider` object has to reach core as the same object, or each change of
 * an unrelated setting would empty the grid and fetch the rows again.
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
    fixture.componentInstance.settings = { licenseKey: NON_COMMERCIAL_LICENSE, ...settings };
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
});
