/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

@Component({
  selector: 'app-example9',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly hotData = [
    {
      item: 'Operations',
      amount: null,
      __children: [
        { item: 'Rent', amount: 4200 },
        { item: 'Utilities', amount: 650 },
        {
          item: 'Payroll',
          amount: null,
          __children: [
            { item: 'Engineering', amount: 18500 },
            { item: 'Design', amount: 7400 },
            { item: 'Support', amount: 5100 },
          ],
        },
      ],
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [{ data: 'item' }, { data: 'amount', type: 'numeric' }],
    nestedRows: true,
    rowHeaders: true,
    colHeaders: ['Budget line', 'Amount (USD)'],
    columnSummary() {
      const endpoints: SummaryEndpoint[] = [];
      const hot = (this as any).hot;
      const nestedRowsPlugin = hot.getPlugin('nestedRows');

      for (let visualRow = 0; visualRow < hot.countRows(); visualRow++) {
        if (!nestedRowsPlugin.isParent(visualRow)) {
          continue;
        }

        const childLevel = nestedRowsPlugin.getRowLevel(visualRow) + 1;
        const lastDescendant = visualRow + nestedRowsPlugin.countChildren(visualRow, true);
        const ranges: number[][] = [];

        // Add one range for each direct child, which can be a subtotal row.
        for (let row = visualRow + 1; row <= lastDescendant; row++) {
          if (nestedRowsPlugin.getRowLevel(row) === childLevel) {
            const physicalRow = hot.toPhysicalRow(row);

            ranges.push([physicalRow, physicalRow]);
          }
        }

        endpoints.push({
          sourceColumn: 1,
          destinationColumn: 1,
          destinationRow: hot.toPhysicalRow(visualRow),
          type: 'sum',
          ranges,
          includeSummaryResults: true,
        });
      }

      return endpoints;
    },
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
  };
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
