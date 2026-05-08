/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { registerRenderer, textRenderer } from 'handsontable/renderers';

registerRenderer('customStylesRenderer', (hotInstance: Handsontable, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: unknown, cellProperties: Handsontable.CellProperties) => {
  textRenderer(hotInstance, TD, row, col, prop, value, cellProperties);

  TD.style.fontWeight = 'bold';
  TD.style.color = 'green';
  TD.style.background = '#d7f1e1';
});

@Component({
  selector: 'example3-formatting-cells',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['SKU-4821', 'Laptop Pro 15',    'Electronics', 149900,  42],
    ['SKU-0093', 'Wireless Mouse',   'Peripherals',   2999, 218],
    ['SKU-7712', 'USB-C Hub 7-port', 'Peripherals',   5499,   0],
    ['SKU-3305', 'Mech. Keyboard',   'Peripherals',   8999,  67],
    ['SKU-9140', '4K Monitor 27"',   'Electronics',  34999,  15],
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    customBorders: [
      {
        range: {
          from: {
            row: 1,
            col: 1,
          },
          to: {
            row: 3,
            col: 4,
          },
        },
        top: {
          width: 2,
          color: '#5292F7',
          style: 'dotted',
        },
        bottom: {
          width: 2,
          color: 'red',
        },
        start: {
          width: 2,
          color: 'orange',
          style: 'dashed',
        },
        end: {
          width: 2,
          color: 'magenta',
        },
      },
      {
        row: 2,
        col: 2,
        start: {
          width: 2,
          color: 'red',
        },
        end: {
          width: 1,
          color: 'green',
        },
      },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
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
