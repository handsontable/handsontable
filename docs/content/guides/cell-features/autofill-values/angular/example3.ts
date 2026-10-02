/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type Handsontable from 'handsontable/base';
import type { CellRange } from 'handsontable/base';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example3-autofill-values',
  template: `
    <output class="console" id="output">{{ output }}</output>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly data = [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', '', '', '', ''],
    ['Boron', '', '', '', ''],
  ];

  output = 'Drag the fill handle to see the affected range logged here.';

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
    colWidths: [80, 62, 110, 118, 110],
    stretchH: 'all',
    fillHandle: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    beforeAutofill: (selectionData: Handsontable.CellValue[][]) =>
      // Round every filled number up to the nearest multiple of 5.
      selectionData.map((row) => row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value))),
    afterAutofill: (
      fillData: Handsontable.CellValue[][],
      sourceRange: CellRange,
      targetRange: CellRange,
      direction: 'up' | 'down' | 'left' | 'right'
    ) => {
      this.output =
        `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
        `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`;
    },
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
