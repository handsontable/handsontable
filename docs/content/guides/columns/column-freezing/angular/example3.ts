/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// units sold per SKU and month, with the yearly total in the last column
const data: (string | number)[][] = Array.from({ length: 100 }, (_, row) => {
  const units = months.map((_, month) => 120 + ((row * 37 + month * 53) % 380));

  return [`SKU-${4000 + row}`, ...units, units.reduce((sum, value) => sum + value, 0)];
});

@Component({
  selector: 'app-example3',
  template: `
    <hot-table [settings]="hotSettings" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = data;

  readonly hotSettings: GridSettings = {
    colHeaders: ['SKU', ...months, 'Total'],
    colWidths: 100,
    width: '100%',
    height: 320,
    rowHeaders: true,
    fixedColumnsStart: 1,
    fixedColumnsEnd: 1,
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
