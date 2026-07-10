/* file: app.component.ts */
import { Component, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example1-conditional-formatting',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
  styles: `example1-conditional-formatting .handsontable td.company-name {
    font-weight: 600;
}
example1-conditional-formatting .handsontable td.loss {
    color: #d81e2c;
    background: #fdecea;
}
example1-conditional-formatting .handsontable td.loss::before {
    content: "▼ ";
}
example1-conditional-formatting .handsontable td.strong-quarter {
    color: #157a3d;
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
      { className: 'company-name' },
      { type: 'numeric' },
      { type: 'numeric' },
      { type: 'numeric' },
      { type: 'numeric' },
    ],
    cells(row: number, col: number) {
      const cellProperties: Handsontable.CellMeta = {};

      if (col > 0) {
        cellProperties.className = '';

        const value = (this as any).instance.getDataAtCell(row, col);

        if (typeof value === 'number' && value < 0) {
          cellProperties.className = 'loss';
        } else if (typeof value === 'number' && value > 10) {
          cellProperties.className = 'strong-quarter';
        }
      }

      return cellProperties;
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
