/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type Handsontable from 'handsontable/base';

/* start:skip-in-preview */
const data: Handsontable.RowObject[] = [
  { sku: 'SKU-4821', supplier: 'Harbor Goods', stock: 142, category: 'Electronics' },
  { sku: 'SKU-0093', supplier: 'Alpine Supply Co.', stock: 0, category: 'Apparel' },
  { sku: 'SKU-7311', supplier: 'Meadow Foods', stock: 67, category: 'Grocery' },
  { sku: 'SKU-2250', supplier: 'Harbor Goods', stock: 318, category: 'Electronics' },
  { sku: 'SKU-9047', supplier: 'Northwind Traders', stock: 12, category: 'Hardware' },
  { sku: 'SKU-6638', supplier: 'Alpine Supply Co.', stock: 205, category: 'Apparel' },
];
/* end:skip-in-preview */

type ColumnConfig = { data: string; width: number; className?: string };

// `columns` and `colHeaders` are kept in mutable variables so the custom menu
// item can extend them and push the change back through `updateSettings`.
const columns: ColumnConfig[] = [
  { data: 'sku', width: 120 },
  { data: 'supplier', width: 170 },
  { data: 'stock', width: 90 },
  { data: 'category', width: 130 },
];
const colHeaders = ['SKU', 'Supplier', 'Stock', 'Category'];

let newColumnCount = 0;

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-add-column-object-data',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: Handsontable.RowObject[] = data;

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders,
    columns,
    height: 'auto',
    width: '100%',
    contextMenu: {
      items: {
        add_column: {
          name: 'Add column',
          callback: (_key: string, selection: Array<{ start: { col: number } }>) => {
            const hot = this.hotTable?.hotInstance;

            if (!hot) return;

            const insertAt = selection[0].start.col + 1;

            newColumnCount += 1;
            const newKey = `custom_${newColumnCount}`;

            (hot.getSourceData() as Array<Record<string, unknown>>).forEach((row) => {
              row[newKey] = '';
            });

            columns.splice(insertAt, 0, { data: newKey, width: 130, className: 'ht-new-column' });
            colHeaders.splice(insertAt, 0, `Custom ${newColumnCount}`);

            hot.updateSettings({ columns, colHeaders });
          },
        },
        sep1: { name: '---------' },
        row_above: { name: 'Insert row above' },
        row_below: { name: 'Insert row below' },
        remove_row: { name: 'Remove row' },
      },
    },
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
