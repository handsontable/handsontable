/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

const data = [
  ['Acme Corp', 4.2, 5.1, -1.3, 6.8],
  ['Vertex Industries', 12.5, 11.9, 13.2, 14],
  ['Harbor Analytics', -2.4, 0.8, 2.1, 3.5],
  ['Summit Logistics', 8.7, -3.2, 4.4, 5.9],
  ['Pioneer Foods', 1.1, 1.4, 0.9, -0.5],
  ['Meridian Retail', 6, 7.3, 8.1, 9.4],
];

// shade the background from red (low) to green (high); the value stays visible
const heatmapRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue,
  cellProperties: Handsontable.CellProperties
) => {
  textRenderer(instance, td, row, col, prop, value, cellProperties);

  const amount = Number(value);

  if (Number.isFinite(amount)) {
    const values = instance.getData()
      .flatMap((rowData) => rowData.slice(1))
      .map(Number)
      .filter((cellValue) => Number.isFinite(cellValue));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ratio = min === max ? 0.5 : (amount - min) / (max - min);
    const hue = Math.round(ratio * 120);

    td.style.background = `hsl(${hue}, 75%, 85%)`;
    td.style.color = '#1b1b1b';
  }
};

registerRenderer('heatmapRenderer', heatmapRenderer);

@Component({
  selector: 'example3-conditional-formatting',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders: ['Company', 'Q1', 'Q2', 'Q3', 'Q4'],
    height: 'auto',
    columns: [
      {},
      { renderer: 'heatmapRenderer' },
      { renderer: 'heatmapRenderer' },
      { renderer: 'heatmapRenderer' },
      { renderer: 'heatmapRenderer' },
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
