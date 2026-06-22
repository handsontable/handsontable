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
    ['$4.2M', '$3.8M', '$4.5M', '$4.1M', '$4.7M', '$5.2M'],
    ['$3.1M', '$2.9M', '$3.4M', '$3.6M', '$3.8M', '$4.0M'],
    ['$5.6M', '$5.9M', '$6.3M', '$6.1M', '$6.8M', '$7.2M'],
    ['$1.4M', '$1.6M', '$1.5M', '$1.7M', '$1.9M', '$2.1M'],
    ['$2.2M', '$2.0M', '$2.4M', '$2.5M', '$2.7M', '$2.9M'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],
    rowHeaderWidth: 120,
    height: 'auto',
    manualColumnMove: true,
    nestedHeaders: [
      // Q1 2025 is cohesive (the default); Q2 2025 opts into splitting.
      [
        { label: 'Q1 2025 (adopt mode)', colspan: 3 },
        { label: 'Q2 2025 (split mode)', colspan: 3, columnDropMode: 'split' },
      ],
      ['January', 'February', 'March', 'April', 'May', 'June'],
    ],
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
