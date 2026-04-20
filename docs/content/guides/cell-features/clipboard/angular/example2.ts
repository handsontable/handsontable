/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-clipboard',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['EMEA',   142000, 48,  168000, 53,  195000, 61,  221000, 72,  726000],
    ['APAC',    98000, 31,  115000, 38,  134000, 44,  158000, 52,  505000],
    ['AMER',   213000, 68,  247000, 79,  289000, 91,  334000, 108, 1083000],
    ['LATAM',   54000, 17,   63000, 20,   74000, 24,   87000, 28,  278000],
    ['MEA',     38000, 12,   44000, 14,   52000, 17,   61000, 20,  195000],
  ];

  readonly gridSettings: GridSettings = {
    contextMenu: true,
    copyPaste: {
      copyColumnHeaders: true,
      copyColumnGroupHeaders: true,
      copyColumnHeadersOnly: true,
    },
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    nestedHeaders: [
      [
        'A',
        { label: 'B', colspan: 2 },
        { label: 'C', colspan: 2 },
        { label: 'D', colspan: 2 },
        { label: 'E', colspan: 2 },
        'F',
      ],
      ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
    ],
    autoWrapRow: true,
    autoWrapCol: true
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
