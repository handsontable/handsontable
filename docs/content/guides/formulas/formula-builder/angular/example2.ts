/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example2-formula-builder',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data: (string | number)[][] = [
    ['Spring Sale 2025', 18200, 640, '=C1/B1'],
    ['Brand Awareness Q3', 45100, 1490, '=C2/B2'],
    ['Product Launch', 9800, 410, '=C3/B3'],
    ['Newsletter Reactivation', 12600, 505, '=C4/B4'],
    ['All campaigns', '=SUM(B1:B4)', '=SUM(C1:C4)', '=C5/B5'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Campaign', 'Impressions', 'Conversions', 'Rate'],
    rowHeaders: true,
    height: 296,
    editor: 'formula',
    formulas: {
      engine: HyperFormula,
    },
    formulaBuilder: {
      builder: formulaBuilder,
      showFormulaBar: true,
      popups: {
        showClose: true,
        suggestions: {
          showKeyboardHelp: false,
          showNamedExpressions: false,
        },
      },
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
