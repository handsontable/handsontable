/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
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
    ['North America', 4200, 3800, 4500, 12500],
    ['Europe', 3100, 2900, 3300, 9300],
    ['Asia Pacific', 2600, 2400, 2800, 7800],
    ['Latin America', 1500, 1700, 1600, 4800],
    ['Middle East', 1200, 1300, 1450, 3950],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    colWidths: 90,
    height: 'auto',
    nestedHeaders: [
      ['Region', { label: 'Q1 2025', colspan: 4 }],
      [
        'Region',
        { label: 'Jan', visibleWhen: 'expanded' },
        { label: 'Feb', visibleWhen: 'expanded' },
        { label: 'Mar', visibleWhen: 'expanded' },
        { label: 'Total', visibleWhen: 'collapsed' },
      ],
    ],
    collapsibleColumns: true,
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
