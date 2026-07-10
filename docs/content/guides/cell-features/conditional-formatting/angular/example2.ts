/* file: app.component.ts */
import { Component, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// display losses in an accounting format, so color is not the only signal
const profitRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue,
  cellProperties: Handsontable.CellProperties
) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    textRenderer(instance, td, row, col, prop, value, cellProperties);

    return;
  }

  const formatted = amount < 0
    ? `($${Math.abs(amount).toFixed(1)}M)`
    : `$${amount.toFixed(1)}M`;

  textRenderer(instance, td, row, col, prop, formatted, cellProperties);

  if (amount < 0) {
    td.className = 'loss-cell';
  }
};

registerRenderer('profitRenderer', profitRenderer);

@Component({
  selector: 'example2-conditional-formatting',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
  styles: `hot-table td.loss-cell {
    color: #d81e2c;
    font-weight: 600;
}
`,
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {

  readonly data = [
    ['Acme Corp', 4.2, 5.1, -1.3, 6.8],
    ['Vertex Industries', 12.5, 11.9, 13.2, 14],
    ['Harbor Analytics', -2.4, 0.8, 2.1, 3.5],
    ['Summit Logistics', 8.7, -3.2, 4.4, 5.9],
    ['Pioneer Foods', 1.1, 1.4, 0.9, -0.5],
    ['Meridian Retail', 6, 7.3, 8.1, 9.4],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Company', 'Q1', 'Q2', 'Q3', 'Q4'],
    height: 'auto',
    columns: [
      {},
      { renderer: 'profitRenderer' },
      { renderer: 'profitRenderer' },
      { renderer: 'profitRenderer' },
      { renderer: 'profitRenderer' },
    ],
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
