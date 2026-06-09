/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-select-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colWidths: [50, 70, 50],
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {},
      {
        type: 'select',
        selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda'],
      },
      {},
    ]
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
