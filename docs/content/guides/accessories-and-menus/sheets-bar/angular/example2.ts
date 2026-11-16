/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from 'hyperformula-ui';

const engine = HyperFormula.buildFromSheets(
  {
    Budget: [
      ['Laptops', 4200, '=B1*Rates!B1', '=B1*Rates!B2', '=B1+C1+D1'],
      ['Desks', 1200, '=B2*Rates!B1', '=B2*Rates!B2', '=B2+C2+D2'],
      ['Monitors', 2600, '=B3*Rates!B1', '=B3*Rates!B2', '=B3+C3+D3'],
      ['Chairs', 950, '=B4*Rates!B1', '=B4*Rates!B2', '=B4+C4+D4'],
      ['Docking stations', 780, '=B5*Rates!B1', '=B5*Rates!B2', '=B5+C5+D5'],
      ['Total', '=SUM(B1:B5)', '=SUM(C1:C5)', '=SUM(D1:D5)', '=SUM(E1:E5)'],
    ],
    Rates: [
      ['VAT rate', 0.23],
      ['Service fee', 0.05],
    ],
  },
  {
    // this demo uses the GPLv3 key,
    // use your own HyperFormula license key in your app
    licenseKey: 'gpl-v3',
  }
);

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
    formulas: { engine },
    sheetsBar: true,
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    height: 240,
    editor: 'formula',
    formulaBuilder: {
      builder: formulaBuilder,
      showFormulaBar: true,
    },
  };
}
/* end-file */


/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
