/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

// Named expressions that reference cell ranges must be registered after the sheet
// exists. Pre-build the engine in the constructor so the sheet is created first.
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
    ['Widget A', 200, 250],
    ['Widget B', 150, 300],
    ['Widget C', 400, 350],
    ['Totals', '=Q1_TOTAL', '=Q2_TOTAL'],
  ];

  readonly hotSettings: GridSettings;

  constructor() {
    const hfInstance = HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
    });

    hfInstance.addSheet('Sheet1');
    hfInstance.addNamedExpression('Q1_TOTAL', '=SUM(Sheet1!$B$1:$B$3)');
    hfInstance.addNamedExpression('Q2_TOTAL', '=SUM(Sheet1!$C$1:$C$3)');

    this.hotSettings = {
      colHeaders: ['Product', 'Q1 Sales', 'Q2 Sales'],
      rowHeaders: true,
      height: 'auto',
      formulas: {
        engine: hfInstance,
        sheetName: 'Sheet1',
      },
      autoWrapRow: true,
      autoWrapCol: true,
    };
  }
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
