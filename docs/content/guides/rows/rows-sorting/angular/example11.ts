/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type Handsontable from 'handsontable/base';

interface Row {
  brand: string;
  model: string;
  price: number;
  sellDate: string;
}

const originalData: Row[] = [
  { brand: 'Jetpulse', model: 'Racing Socks', price: 30, sellDate: '2023-10-11' },
  { brand: 'Gigabox', model: 'HL Mountain Frame', price: 1890.9, sellDate: '2023-05-03' },
  { brand: 'Camido', model: 'Cycling Cap', price: 130.1, sellDate: '2023-03-27' },
  { brand: 'Chatterpoint', model: 'Road Tire Tube', price: 59, sellDate: '2023-08-28' },
  { brand: 'Eidel', model: 'HL Road Tire', price: 279.99, sellDate: '2023-10-02' },
];

const columnDataKeys: (keyof Row)[] = ['brand', 'model', 'price', 'sellDate'];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example11',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <span>{{ status }}</span>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  status = 'Click a column header to sort.';
  data: Row[] = originalData;

  // Canceling the front-end sort also stops Handsontable from tracking the column's sort
  // order, so this example cycles ascending -> descending -> unsorted manually.
  private activeSort: { column: number; sortOrder: 'asc' | 'desc' } | null = null;

  private getNextSortOrder(column: number): 'asc' | 'desc' | null {
    if (!this.activeSort || this.activeSort.column !== column) {
      return 'asc';
    }

    return this.activeSort.sortOrder === 'asc' ? 'desc' : null;
  }

  // Simulates a server that receives a sort request and returns sorted rows.
  private sortOnServer(columnKey: keyof Row, sortOrder: string): Promise<Row[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sortedData = [...originalData].sort((rowA, rowB) => {
          if (rowA[columnKey] === rowB[columnKey]) {
            return 0;
          }

          return ((rowA[columnKey] as any) > (rowB[columnKey] as any)) === (sortOrder === 'asc') ? 1 : -1;
        });

        resolve(sortedData);
      }, 600);
    });
  }

  readonly gridSettings: GridSettings = {
    columns: [
      { title: 'Brand', type: 'text', data: 'brand' },
      { title: 'Model', type: 'text', data: 'model' },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      {
        title: 'Date',
        type: 'intl-date',
        data: 'sellDate',
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
      },
    ],
    columnSorting: true,
    height: 'auto',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    beforeColumnSort: (
      currentSortConfig: Handsontable.plugins.ColumnSorting.Config[],
      destinationSortConfigs: Handsontable.plugins.ColumnSorting.Config[]
    ) => {
      const [requestedSort] = destinationSortConfigs;

      if (!requestedSort) {
        // the sorting was cleared programmatically, restore the original row order
        this.activeSort = null;
        this.data = originalData;

        return false;
      }

      const nextOrder = this.getNextSortOrder(requestedSort.column);

      if (nextOrder === null) {
        this.activeSort = null;
        this.status = 'Cleared the sort.';
        this.data = originalData;

        return false;
      }

      this.activeSort = { column: requestedSort.column, sortOrder: nextOrder };
      this.status = 'Sorting on the server...';

      this.sortOnServer(columnDataKeys[requestedSort.column], nextOrder).then((sortedData) => {
        this.data = sortedData;
        this.status = 'Sorted on the server.';
      });

      // return `false` to cancel Handsontable's own front-end sort
      return false;
    },
  };
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
