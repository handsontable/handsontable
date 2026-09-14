/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

// One engine, shared by every sheet of the workbook.
const engine = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

const ratesData = [
  ['VAT rate', 0.23],
  ['Service fee', 0.05],
];

@Component({
  selector: 'app-example2',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings">
    </hot-table>
  `,
})
export class AppComponent {

  readonly hotSettings: GridSettings = {
    sheetsBar: {
      sheets: [
        {
          name: 'Budget',
          data: [
            ['Laptops', 4200, '=B1*Rates!B1', '=B1*Rates!B2', '=B1+C1+D1'],
            ['Desks', 1200, '=B2*Rates!B1', '=B2*Rates!B2', '=B2+C2+D2'],
            ['Monitors', 2600, '=B3*Rates!B1', '=B3*Rates!B2', '=B3+C3+D3'],
            ['Chairs', 950, '=B4*Rates!B1', '=B4*Rates!B2', '=B4+C4+D4'],
            ['Docking stations', 780, '=B5*Rates!B1', '=B5*Rates!B2', '=B5+C5+D5'],
            ['Total', '=SUM(B1:B5)', '=SUM(C1:C5)', '=SUM(D1:D5)', '=SUM(E1:E5)'],
          ],
          settings: {
            colHeaders: ['Item • A', 'Net • B', 'VAT • C', 'Fee • D', 'Gross • E'],
            formulas: { engine, sheetName: 'Budget' },
          },
        },
        {
          name: 'Rates',
          data: ratesData,
          settings: {
            colHeaders: ['Rate • A', 'Value • B'],
            formulas: { engine, sheetName: 'Rates' },
          },
        },
      ],
      activeSheet: 0,
    },
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    height: 240,
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
