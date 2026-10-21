import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, RowSelection, CheckboxHeader } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(RowSelection);
registerPlugin(CheckboxHeader);
registerCellType(CheckboxCellType);

/**
 * Smoke tests for the `rowSelection` option and the `headerCheckbox` column option (PRO-87) passed
 * through the Angular wrapper's `settings` input.
 */
describe('HotTableComponent with row selection', () => {
  let fixture: ComponentFixture<HotTableComponent>;
  const data = [
    { name: 'Wireless Mouse', done: false },
    { name: 'Desk Lamp', done: true },
    { name: 'Laptop Stand', done: false },
  ];

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
    fixture.componentInstance.data = data.map(row => ({ ...row }));
    fixture.detectChanges();

    return fixture.componentInstance;
  }

  it('should enable the plugin and expose its API through the component', () => {
    const component = render({ rowSelection: true, rowHeaders: true });
    const plugin = component.hotInstance.getPlugin('rowSelection');

    expect(plugin.enabled).toBe(true);

    plugin.selectRows([1]);

    expect(plugin.getSelectedRows()).toEqual([1]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 3 });
  });

  it('should keep the row selection when the settings input changes', () => {
    const component = render({ rowSelection: true, rowHeaders: true });
    const plugin = component.hotInstance.getPlugin('rowSelection');

    plugin.selectRows([0, 2]);

    const newSettings: GridSettings = { rowSelection: { selectAll: 'filtered' } };

    component.ngOnChanges({ settings: new SimpleChange(null, newSettings, false) });

    expect(plugin.getSelectedRows()).toEqual([0, 2]);
  });

  it('should check a whole checkbox column through the `headerCheckbox` column option', () => {
    const component = render({
      columns: [{ data: 'name' }, { data: 'done', type: 'checkbox', headerCheckbox: true }],
      colHeaders: true,
    });
    const hot = component.hotInstance;

    expect(hot.getPlugin('checkboxHeader').hasHeaderCheckbox(1)).toBe(true);

    hot.getPlugin('checkboxHeader').toggleColumn(1);

    expect(hot.getDataAtCol(1)).toEqual([true, true, true]);
  });
});
