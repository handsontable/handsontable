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
    [42000, 45500, 48700, 51200],
    [18300, 19100, 20400, 21600],
    [23700, 26400, 28300, 29600],
    [9800, 10200, 11100, 11700],
    [13900, 16200, 17200, 17900],
    [11200, 13100, 13900, 14500],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['Q1', 'Q2', 'Q3', 'Q4'],
    rowHeaders: [
      'Revenue',
      'Cost of goods sold',
      'Gross profit',
      'Operating expenses',
      'Operating income',
      'Net income',
    ],
    // Size the row header column to its longest label.
    autoRowHeaderSize: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
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
