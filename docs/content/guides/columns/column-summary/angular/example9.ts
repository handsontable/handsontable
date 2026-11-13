/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

interface BudgetLine {
  item: string;
  amount: number | null;
  __children?: BudgetLine[];
}

// Give every parent a summary of its direct children. Physical rows follow the data tree,
// so the endpoints stay right while a group is collapsed. Returns the rows `line` spans.
const addEndpoints = (endpoints: SummaryEndpoint[], line: BudgetLine, physicalRow: number): number => {
  const ranges: number[][] = [];
  let nextRow = physicalRow + 1;

  (line.__children ?? []).forEach((child) => {
    ranges.push([nextRow, nextRow]);
    nextRow += addEndpoints(endpoints, child, nextRow);
  });

  if (ranges.length > 0) {
    endpoints.push({
      sourceColumn: 1,
      destinationColumn: 1,
      destinationRow: physicalRow,
      type: 'sum',
      ranges,
      includeSummaryResults: true,
    });
  }

  return nextRow - physicalRow;
};

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

  readonly hotData: BudgetLine[] = [
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
    columnSummary: () => {
      const endpoints: SummaryEndpoint[] = [];
      let physicalRow = 0;

      this.hotData.forEach((line) => {
        physicalRow += addEndpoints(endpoints, line, physicalRow);
      });

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
