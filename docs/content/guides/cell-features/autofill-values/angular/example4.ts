/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

@Component({
  selector: 'example4-autofill-values',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  // create an external HyperFormula instance
  readonly hyperformulaInstance = HyperFormula.buildEmpty({
    // this demo uses the GPLv3 key,
    // use your own HyperFormula license key in your app
    licenseKey: 'gpl-v3',
  });

  readonly data = [
    [12, 4.5, '=A1*B1', '=C1*(1+$E$1)', 0.2],
    [8, 12.25, null, null, null],
    [20, 3.8, null, null, null],
    [5, 29.99, null, null, null],
    [15, 7.2, null, null, null],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Quantity', 'Unit price', 'Total', 'Total with tax', 'Tax rate (E1 only)'],
    rowHeaders: true,
    stretchH: 'all',
    fillHandle: true,
    formulas: {
      engine: this.hyperformulaInstance,
      sheetName: 'Sheet1',
    },
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
