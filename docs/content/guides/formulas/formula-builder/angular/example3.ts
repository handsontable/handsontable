/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example3-formula-builder',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data: (string | number)[][] = [
    ['SKU-4821', 142, 96, '=(B1-C1)/C1'],
    ['SKU-0093', 67, 88, '=(B2-C2)/C2'],
    ['SKU-3310', 205, 0, '=(B3-C3)/C3'],
    ['SKU-1275', 58, 41, '=(B4-C4)/C4'],
    ['SKU-9004', 310, 264, '=(B5-C5)/C5'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Stock 2025', 'Stock 2024', 'Change'],
    rowHeaders: true,
    height: 296,
    columns: [
      { editor: 'formula' },
      { editor: 'formula' },
      { editor: 'formula' },
      { editor: 'formula', readOnly: true },
    ],
    formulas: {
      engine: HyperFormula,
    },
    formulaBuilder: {
      builder: formulaBuilder,
      showFormulaBar: true,
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
