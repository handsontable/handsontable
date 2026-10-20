import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, AsyncValues } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(AsyncValues);

/**
 * Creates a promise that is settled from the outside.
 */
function deferred<T = string>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

/**
 * The `asyncValues` option through the Angular wrapper: the wrapper calls `updateData()` whenever its
 * `data` input changes and sends the settings again, and pending requests survive both.
 */
describe('HotTableComponent with async values', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /**
   * Builds the product rows. Every call returns new objects, as an application that rebuilds its data does.
   */
  function createProducts() {
    return [
      { id: 'a', sku: 'A-100', name: 'Desk lamp' },
      { id: 'b', sku: 'B-200', name: 'Monitor stand' },
      { id: 'c', sku: 'C-300', name: 'USB-C cable' },
    ];
  }

  it('should keep a pending request on its record when the `data` input changes order', async() => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = {
      licenseKey: NON_COMMERCIAL_LICENSE,
      columns: [{ data: 'sku' }, { data: 'name' }],
      rowId: 'id',
      asyncValues: true,
    };
    fixture.componentInstance.data = createProducts();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hot = component.hotInstance;
    const plugin = hot.getPlugin('asyncValues');
    const request = deferred();
    const result = plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, () => request.promise);
    const reordered = createProducts().reverse();

    component.data = reordered;
    component.ngOnChanges({ data: new SimpleChange(null, reordered, false) });
    component.ngOnChanges({ settings: new SimpleChange(null, { asyncValues: true }, false) });

    expect(plugin.isPendingAt({ rowId: 'a', prop: 'name' })).toBe(true);

    request.resolve('Reading lamp');

    await expect(result).resolves.toEqual({ status: 'resolved', value: 'Reading lamp' });
    expect(hot.getSourceDataAtRow(2)).toEqual({ id: 'a', sku: 'A-100', name: 'Reading lamp' });
  });
});
