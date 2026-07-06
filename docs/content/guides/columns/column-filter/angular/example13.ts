/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { Filters } from 'handsontable/plugins';
import type { ColumnConditions } from 'handsontable/plugins/filters';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example13',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="applySampleFilter()">Filter: price &gt; $200</button>
        <button (click)="saveFilters()">Save filter settings</button>
        <button (click)="clearFilters()">Clear filters</button>
        <button (click)="restoreFilters()">Restore filter settings</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  savedConditions: ColumnConditions[] = [];

  readonly hotData = [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '01:23',
      inStock: true,
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Brand',
        type: 'text',
        data: 'brand',
      },
      {
        title: 'Model',
        type: 'text',
        data: 'model',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
      {
        title: 'Date',
        type: 'intl-date',
        data: 'sellDate',
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
      },
      {
        title: 'Time',
        type: 'intl-time',
        data: 'sellTime',
        locale: 'en-US',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
        className: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
    ],
    // enable filtering
    filters: true,
    // enable the column menu
    dropdownMenu: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  // get the `Filters` plugin, so you can use its API
  getFiltersPlugin(): Filters {
    return this.hotTable.hotInstance!.getPlugin('filters');
  }

  applySampleFilter() {
    const filters = this.getFiltersPlugin();

    filters.clearConditions();
    // filter the 'Price' column (column at index 2) for items over $200
    filters.addCondition(2, 'gt', [200]);
    filters.filter();
  }

  saveFilters() {
    const filters = this.getFiltersPlugin();

    // `exportConditions()` returns the current conditions, keyed by physical column index
    this.savedConditions = filters.exportConditions();
  }

  clearFilters() {
    const filters = this.getFiltersPlugin();

    filters.clearConditions();
    filters.filter();
  }

  restoreFilters() {
    const filters = this.getFiltersPlugin();

    // `importConditions()` expects the same physical-column-indexed structure
    filters.importConditions(this.savedConditions);
    filters.filter();
  }
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
