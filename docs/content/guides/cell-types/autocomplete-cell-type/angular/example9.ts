/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example9-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
  readonly stockStatuses = [
    '<span style="color: #1a7f37">In stock</span>',
    '<span style="color: #b35900">Low stock</span>',
    '<span style="color: #c92a2a">Out of stock</span>',
    '<span style="color: #495057">Backordered</span>',
    '<span style="color: #495057">Discontinued</span>',
  ];

  readonly data = [
    [this.stockStatuses[0], this.stockStatuses[0]],
    [this.stockStatuses[1], this.stockStatuses[1]],
    [this.stockStatuses[2], this.stockStatuses[2]],
    [this.stockStatuses[3], this.stockStatuses[3]],
    [this.stockStatuses[4], this.stockStatuses[4]],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['allowHtml: false (default)', 'allowHtml: true'],
    columns: [
      {
        type: 'autocomplete',
        source: this.stockStatuses,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.stockStatuses,
        strict: false,
        // render `source` values as HTML — only use with trusted, static data
        allowHtml: true,
      },
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
