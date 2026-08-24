/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
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
      value: null,
      __children: [{ value: 5 }, { value: 6 }, { value: 7 }],
    },
    {
      __children: [{ value: 15 }, { value: 16 }, { value: 17 }],
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [{ data: 'value' }],
    nestedRows: true,
    rowHeaders: true,
    colHeaders: ['sum', 'min', 'max', 'count', 'average'],
    columnSummary() {
      const endpoints = [];
      const nestedRowsPlugin = (this as any).hot.getPlugin('nestedRows');
      const resultColumn = 0;

      if (!nestedRowsPlugin.isEnabled()) {
        return [];
      }

      for (let visualRow = 0; visualRow < (this as any).hot.countRows(); visualRow++) {
        // Only summarize the top-level parents.
        if (
          nestedRowsPlugin.getRowLevel(visualRow) !== 0 ||
          !nestedRowsPlugin.isParent(visualRow)
        ) {
          continue;
        }

        const parentRow = (this as any).hot.toPhysicalRow(visualRow);
        const descendantCount = nestedRowsPlugin.countChildren(visualRow, true);

        // A parent's descendants sit in one block right after it in the source data, so the
        // whole subtree is a single range. Count them recursively - the direct child count
        // would stop short whenever a child has children of its own.
        endpoints.push({
          destinationColumn: resultColumn,
          destinationRow: parentRow,
          type: 'sum',
          forceNumeric: true,
          ranges: [[parentRow + 1, parentRow + descendantCount]],
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
